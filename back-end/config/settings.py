"""
Archivo de configuración de la aplicación SpeakLexi
Lee las variables de entorno desde el archivo .env
"""

import os
from dotenv import load_dotenv
from datetime import timedelta

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# ==========================================================
# LEER VARIABLES DE ENTORNO (Se leen aquí, pero se usan dentro de la clase Config)
# ==========================================================
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '') # Asegúrate que tu .env tenga DB_PASSWORD
DB_NAME = os.getenv('DB_NAME', 'SpeakLexi')

SECRET_KEY_ENV = os.getenv('SECRET_KEY', 'clave_super_secreta_por_defecto')
DEBUG_ENV = os.getenv('DEBUG', 'True').lower() == 'true' # Convertir a booleano

JWT_SECRET_KEY_ENV = os.getenv('JWT_SECRET_KEY', SECRET_KEY_ENV) # Usa SECRET_KEY_ENV como fallback
JWT_ACCESS_TOKEN_EXPIRES_ENV = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))

MAIL_SERVER_ENV = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
MAIL_PORT_ENV = int(os.getenv('MAIL_PORT', 587))
MAIL_USE_TLS_ENV = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
MAIL_USERNAME_ENV = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD_ENV = os.getenv('MAIL_PASSWORD')
MAIL_DEFAULT_SENDER_ENV = os.getenv('MAIL_DEFAULT_SENDER')

UPLOAD_FOLDER_ENV = os.getenv('UPLOAD_FOLDER', 'uploads')
MAX_CONTENT_LENGTH_ENV = int(os.getenv('MAX_CONTENT_LENGTH', 16777216)) # 16MB
ALLOWED_EXTENSIONS_ENV = set(os.getenv('ALLOWED_EXTENSIONS', 'png,jpg,jpeg,gif,mp3,mp4,pdf').split(','))

CORS_ORIGINS_ENV = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

# ==========================================================
# CLASE CONFIG PARA FLASK
# ==========================================================
class Config:
    """Clase de configuración para Flask"""

    # --- CORRECCIÓN: Construir URI dentro de la clase ---
    # Base de datos
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # --- FIN CORRECCIÓN ---

    # Aplicación
    SECRET_KEY = SECRET_KEY_ENV
    DEBUG = DEBUG_ENV

    # JWT
    JWT_SECRET_KEY = JWT_SECRET_KEY_ENV
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=JWT_ACCESS_TOKEN_EXPIRES_ENV)
    # Configuración CSRF (deshabilitado como antes)
    JWT_CSRF_CHECK_FORM = False
    JWT_CSRF_IN_COOKIES = False
    JWT_CSRF_METHODS = [] 

    # Correo
    MAIL_SERVER = MAIL_SERVER_ENV
    MAIL_PORT = MAIL_PORT_ENV
    MAIL_USE_TLS = MAIL_USE_TLS_ENV
    MAIL_USERNAME = MAIL_USERNAME_ENV
    MAIL_PASSWORD = MAIL_PASSWORD_ENV
    # Ajuste para MAIL_DEFAULT_SENDER si viene del .env o se construye
    if MAIL_DEFAULT_SENDER_ENV:
         MAIL_DEFAULT_SENDER = MAIL_DEFAULT_SENDER_ENV
    else:
         mail_sender_name = "SpeakLexi"
         mail_sender_email = MAIL_USERNAME_ENV or 'noreply@speaklexi.com'
         MAIL_DEFAULT_SENDER = (mail_sender_name, mail_sender_email)

    # Archivos
    UPLOAD_FOLDER = UPLOAD_FOLDER_ENV
    MAX_CONTENT_LENGTH = MAX_CONTENT_LENGTH_ENV
    ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS_ENV

    # CORS (Aunque flask_cors lo maneja en app.py, lo mantenemos aquí por consistencia)
    CORS_ORIGINS = CORS_ORIGINS_ENV


# ==========================================================
# IMPRIMIR CONFIGURACIÓN AL INICIAR (Solo en desarrollo)
# ==========================================================
# Usar la variable DEBUG_ENV leída directamente del entorno
if DEBUG_ENV:
    # Añadimos un print para confirmar la URI que se está usando
    print("\n" + "="*60)
    print("⚙️  CONFIGURACIÓN DE SPEAKLEXI (Leída desde .env)")
    print("="*60)
    print(f"🔩 Debug Mode: {DEBUG_ENV}")
    print(f"🔑 Secret Key: {'*' * len(SECRET_KEY_ENV) if SECRET_KEY_ENV else 'No definida'}")
    print(f"🔑 JWT Secret Key: {'*' * len(JWT_SECRET_KEY_ENV) if JWT_SECRET_KEY_ENV else 'Usando SECRET_KEY'}")
    print(f"⏳ JWT Expiración: {JWT_ACCESS_TOKEN_EXPIRES_ENV} segundos")
    print("-" * 60)
    print(f"🗄️  Base de datos: {DB_NAME}")
    print(f"🔗 Host: {DB_HOST}:{DB_PORT}")
    print(f"👤 Usuario DB: {DB_USER}")
    # ¡Importante! No imprimir la contraseña de la BD en producción
    print(f"🔒 Password DB: {'Sí' if DB_PASSWORD else 'No'}") 
    # Imprimir la URI construida para depuración
    print(f"URI Construida: mysql+pymysql://{DB_USER}:{'****' if DB_PASSWORD else ''}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    print("-" * 60)
    print(f"📧 Correo: {MAIL_USERNAME_ENV or 'No definido'}")
    print(f"✉️ Remitente: {Config.MAIL_DEFAULT_SENDER}") # Usar el valor final de la clase Config
    print("-" * 60)
    print(f"🌐 Orígenes CORS Permitidos: {', '.join(CORS_ORIGINS_ENV)}")
    print("="*60 + "\n")

    # Añadir el print que tenías para la clave JWT cargada
    print(f"🔑 JWT Secret Key cargada en Config: '{Config.JWT_SECRET_KEY}'") 

