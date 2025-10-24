import os
from dotenv import load_dotenv
load_dotenv()

SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:loquesea2013@localhost:3306/SpeakLexi"
SQLALCHEMY_TRACK_MODIFICATIONS = False
SECRET_KEY = "clave_super_secreta"

# Configuración de correo
MAIL_SERVER = "smtp.gmail.com"
MAIL_PORT = 587
MAIL_USE_TLS = True
MAIL_USERNAME = "donitasdechocolate01@gmail.com"
MAIL_PASSWORD = "gthl njjo gafj pzcv"
MAIL_DEFAULT_SENDER = ("SpeakLexi", "donitasdechocolate01@gmail.com")

