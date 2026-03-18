from fastapi import APIRouter, HTTPException
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr, BaseModel
from typing import List
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# IMPORTANTE: No pongas tu email y contraseña directamente en el código
# Usa variables de entorno
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "lautarovergaramodeo@gmail.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),  
    MAIL_FROM=os.getenv("MAIL_FROM", "lautarovergaramodeo@gmail.com"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

router = APIRouter()

# Modelo para el formulario de contacto
class ContactoFormulario(BaseModel):
    nombre: str
    email: EmailStr
    asunto: str
    mensaje: str

@router.post("/contacto/enviar")
async def enviar_email_contacto(formulario: ContactoFormulario):
    """
    Endpoint para enviar emails desde el formulario de contacto
    """
    try:
        # Crear mensaje HTML
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #2563eb;">Nuevo mensaje de contacto - BCRA Dashboard</h2>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Nombre:</strong> {formulario.nombre}</p>
                    <p><strong>Email:</strong> {formulario.email}</p>
                    <p><strong>Asunto:</strong> {formulario.asunto}</p>
                </div>
                
                <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #2563eb;">
                    <h3>Mensaje:</h3>
                    <p>{formulario.mensaje}</p>
                </div>
                
                <hr style="margin: 30px 0;">
                
                <p style="color: #6b7280; font-size: 12px;">
                    Este mensaje fue enviado desde el formulario de contacto del Dashboard BCRA
                </p>
            </body>
        </html>
        """
        
        # Configurar mensaje
        mensaje = MessageSchema(
            subject=f"[BCRA Dashboard] {formulario.asunto}",
            recipients=["lautarovergaramodeo@gmail.com"],  # Tu email donde recibirás los mensajes
            body=html_content,
            subtype="html"
        )
        
        # Enviar email
        fm = FastMail(conf)
        await fm.send_message(mensaje)
        
        return {
            "success": True,
            "message": "Correo enviado correctamente"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al enviar el correo: {str(e)}"
        )
    

print("🔍 DEBUG - Variables de entorno:")
print(f"MAIL_USERNAME: {os.getenv('MAIL_USERNAME')}")
print(f"MAIL_PASSWORD: {'***' if os.getenv('MAIL_PASSWORD') else 'NO CONFIGURADA'}")