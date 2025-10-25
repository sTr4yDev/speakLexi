from datetime import datetime
from config.database import db
from werkzeug.security import generate_password_hash, check_password_hash

class Usuario(db.Model):
    __tablename__ = 'usuarios'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_publico = db.Column(db.String(20), unique=True)
    nombre = db.Column(db.String(100), nullable=False)
    primer_apellido = db.Column(db.String(100), nullable=False)
    segundo_apellido = db.Column(db.String(100))
    correo = db.Column(db.String(255), unique=True, nullable=False)
    contrasena_hash = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(50), default='alumno', nullable=False)
    correo_verificado = db.Column(db.Boolean, default=False)
    codigo_verificacion = db.Column(db.String(6))
    expira_verificacion = db.Column(db.DateTime)
    
    # ✅ NUEVOS CAMPOS PARA SOFT DELETE
    estado_cuenta = db.Column(db.String(20), default='activo', nullable=False)
    fecha_desactivacion = db.Column(db.DateTime)
    token_recuperacion = db.Column(db.String(255))
    expira_token_recuperacion = db.Column(db.DateTime)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    perfil = db.relationship('PerfilUsuario', backref='usuario', uselist=False, cascade="all, delete-orphan")

    def set_password(self, password):
        self.contrasena_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.contrasena_hash, password)
    
    def esta_activo(self):
        """Verifica si la cuenta está activa"""
        return self.estado_cuenta == 'activo'


class PerfilUsuario(db.Model):
    __tablename__ = 'perfil_usuarios'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False, unique=True)
    nombre_completo = db.Column(db.String(255), nullable=False)
    id_publico = db.Column(db.String(20))
    idioma = db.Column(db.String(100))
    nivel_actual = db.Column(db.String(50))
    curso_actual = db.Column(db.String(100))
    total_xp = db.Column(db.Integer, default=0)
    dias_racha = db.Column(db.Integer, default=0)
    ultima_actividad = db.Column(db.Date)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)