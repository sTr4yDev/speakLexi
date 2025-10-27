"""
Archivo de configuración de la aplicación SpeakLexi
Lee las variables de entorno desde el archivo .env
"""

import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# ==========================================================
# CONFIGURACIÓN DE BASE DE DATOS
# ==========================================================
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'SpeakLexi')

# URI de conexión a la base de datos
SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
SQLALCHEMY_TRACK_MODIFICATIONS = False

# ==========================================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ==========================================================
SECRET_KEY = os.getenv('SECRET_KEY', 'clave_super_secreta')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# ==========================================================
# CONFIGURACIÓN DE JWT
# ==========================================================
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))

# ==========================================================
# CONFIGURACIÓN DE CORREO ELECTRÓNICO
# ==========================================================
MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
MAIL_USERNAME = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')

# Configurar el remitente por defecto
mail_sender_name = "SpeakLexi"
mail_sender_email = os.getenv('MAIL_USERNAME', 'noreply@speaklexi.com')
MAIL_DEFAULT_SENDER = (mail_sender_name, mail_sender_email)

# ==========================================================
# CONFIGURACIÓN DE ARCHIVOS
# ==========================================================
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))  # 16MB
ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'png,jpg,jpeg,gif,mp3,mp4,pdf').split(','))

# ==========================================================
# CONFIGURACIÓN DE CORS
# ==========================================================
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

# ==========================================================
# IMPRIMIR CONFIGURACIÓN AL INICIAR (Solo en desarrollo)
# ==========================================================
if DEBUG:
    print("\n" + "="*60)
    print("⚙️  CONFIGURACIÓN DE SPEAKLEXI")
    print("="*60)
    print(f"🗄️  Base de datos: {DB_NAME}")
    print(f"🔗 Host: {DB_HOST}:{DB_PORT}")
    print(f"👤 Usuario: {DB_USER}")
    print(f"📧 Correo: {MAIL_USERNAME}")
    print(f"🌐 Entorno: {'Desarrollo' if DEBUG else 'Producción'}")
    print("="*60 + "\n")