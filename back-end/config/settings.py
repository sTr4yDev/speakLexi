import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class Config:
    """Configuración de la aplicación Flask"""
    
    # Configuración de base de datos
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:loquesea2013@localhost:3306/SpeakLexi"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Clave secreta para sesiones y tokens
    SECRET_KEY = os.getenv("SECRET_KEY", "clave_super_secreta")
    
    # Configuración de correo electrónico
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = "donitasdechocolate01@gmail.com"
    MAIL_PASSWORD = "gthl njjo gafj pzcv"
    MAIL_DEFAULT_SENDER = ("SpeakLexi", "donitasdechocolate01@gmail.com")
    
    # Configuración de CORS
    CORS_ORIGINS = ["http://localhost:3000"]
    
    # Configuración de JWT (para futuro)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt_super_secreto")
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hora
    
    # Configuración general
    DEBUG = True
    TESTING = False


class DevelopmentConfig(Config):
    """Configuración para desarrollo"""
    DEBUG = True
    DEVELOPMENT = True


class ProductionConfig(Config):
    """Configuración para producción"""
    DEBUG = False
    TESTING = False
    # En producción, obtener valores de variables de entorno
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SECRET_KEY = os.getenv("SECRET_KEY")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")


class TestingConfig(Config):
    """Configuración para pruebas"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False


# Diccionario de configuraciones
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}