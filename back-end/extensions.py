"""
Extensiones de Flask - SpeakLexi
Inicialización centralizada de todas las extensiones
"""

from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_mail import Mail

# Inicializar extensiones sin app (se vinculan después con init_app)
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
mail = Mail()