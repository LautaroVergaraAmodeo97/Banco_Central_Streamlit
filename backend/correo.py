"""
Formulario de contacto: envía el mensaje por correo al dueño del sitio.

Protecciones: validación y largo máximo de cada campo, campo trampa contra
bots, límite de envíos por IP y errores genéricos (el detalle queda en el log).
"""

import logging
import time
from collections import defaultdict, deque
from html import escape

from fastapi import APIRouter, HTTPException, Request
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from pydantic import BaseModel, EmailStr, Field

import config

log = logging.getLogger("contacto")
router = APIRouter()

MAX_ENVIOS = 3
VENTANA_SEGUNDOS = 10 * 60
_envios_por_ip = defaultdict(deque)


class ContactoFormulario(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    email: EmailStr
    asunto: str = Field(min_length=1, max_length=150)
    mensaje: str = Field(min_length=1, max_length=5000)
    # Campo trampa: invisible para personas, los bots suelen completarlo
    sitio_web: str = Field(default="", max_length=200)


def _ip_cliente(request: Request):
    if config.EN_VERCEL and request.headers.get("x-real-ip"):
        return request.headers["x-real-ip"]

    ip = request.client.host if request.client else "desconocida"
    reenviada = request.headers.get("x-forwarded-for")
    if reenviada and ip in config.PROXIES_CONFIABLES:
        # El proxy agrega la IP real AL FINAL; los valores anteriores los
        # puede inventar el visitante, así que no se usan
        return reenviada.split(",")[-1].strip()
    return ip


def _supero_limite(ip):
    ahora = time.monotonic()
    # Olvida las IPs sin envíos recientes para que el registro no crezca sin fin
    for otra in [i for i, e in _envios_por_ip.items() if not e or ahora - e[-1] > VENTANA_SEGUNDOS]:
        del _envios_por_ip[otra]

    envios = _envios_por_ip[ip]
    while envios and ahora - envios[0] > VENTANA_SEGUNDOS:
        envios.popleft()
    if len(envios) >= MAX_ENVIOS:
        return True
    envios.append(ahora)
    return False


@router.post("/contacto/enviar")
async def enviar_email_contacto(formulario: ContactoFormulario, request: Request):
    if formulario.sitio_web:
        return {"success": True, "message": "Correo enviado correctamente"}

    if not config.CORREO_CONFIGURADO:
        raise HTTPException(503, "El formulario de contacto no está disponible en este momento.")

    if _supero_limite(_ip_cliente(request)):
        raise HTTPException(429, "Enviaste varios mensajes seguidos. Probá de nuevo en unos minutos.")

    # Sin saltos de línea en el asunto: evita inyectar cabeceras de correo
    asunto = " ".join(formulario.asunto.split())
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #1d4ed8;">Nuevo mensaje de contacto - Prognosis</h2>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Nombre:</strong> {escape(formulario.nombre)}</p>
                <p><strong>Email:</strong> {escape(str(formulario.email))}</p>
                <p><strong>Asunto:</strong> {escape(asunto)}</p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #1d4ed8;">
                <h3>Mensaje:</h3>
                <p style="white-space: pre-line">{escape(formulario.mensaje)}</p>
            </div>
            <p style="color: #6b7280; font-size: 12px;">Enviado desde el formulario de contacto de Prognosis</p>
        </body>
    </html>
    """

    mensaje = MessageSchema(
        subject=f"[Prognosis] {asunto}",
        recipients=[config.MAIL_TO],
        reply_to=[formulario.email],
        body=html_content,
        subtype="html",
    )
    conexion = ConnectionConfig(
        MAIL_USERNAME=config.MAIL_USERNAME,
        MAIL_PASSWORD=config.MAIL_PASSWORD,
        MAIL_FROM=config.MAIL_FROM,
        MAIL_PORT=config.MAIL_PORT,
        MAIL_SERVER=config.MAIL_SERVER,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )

    try:
        await FastMail(conexion).send_message(mensaje)
    except Exception:
        log.exception("No se pudo enviar el correo de contacto")
        raise HTTPException(502, "No se pudo enviar el mensaje. Probá de nuevo más tarde.")

    return {"success": True, "message": "Correo enviado correctamente"}
