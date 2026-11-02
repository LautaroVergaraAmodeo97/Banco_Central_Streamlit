"""
Configuración leída del entorno.

Los secretos NUNCA van en el código ni en el repositorio: en desarrollo se
cargan desde `backend/.env` (ignorado por git, ver `.env.example`) y en
producción desde las variables de entorno del hosting.
"""

import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))


def _lista(nombre, defecto=""):
    return [v.strip() for v in os.getenv(nombre, defecto).split(",") if v.strip()]


ENTORNO = os.getenv("ENTORNO", "desarrollo").lower()
EN_PRODUCCION = ENTORNO == "produccion"

# Orígenes del frontend autorizados por CORS
FRONTEND_ORIGINS = _lista("FRONTEND_ORIGINS", "http://localhost:3000")

# Proxies cuya cabecera X-Forwarded-For se acepta para conocer la IP real
PROXIES_CONFIABLES = set(_lista("PROXIES_CONFIABLES", "127.0.0.1,::1"))

# Correo del formulario de contacto (contraseña de aplicación de Gmail)
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_FROM = os.getenv("MAIL_FROM", MAIL_USERNAME)
MAIL_TO = os.getenv("MAIL_TO", MAIL_FROM)
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))

CORREO_CONFIGURADO = all([MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM, MAIL_TO])
