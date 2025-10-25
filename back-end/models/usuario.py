from config.database import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    id_publico = db.Column(db.String(50), unique=True, nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    primer_apellido = db.Column(db.String(100), nullable=False)
    segundo_apellido = db.Column(db.String(100), nullable=True)
    correo = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    rol = db.Column(db.String(20), default="estudiante")
    
    # Verificación de correo
    correo_verificado = db.Column(db.Boolean, default=False)
    codigo_verificacion = db.Column(db.String(6), nullable=True)
    expira_verificacion = db.Column(db.DateTime, nullable=True)
    
    # ✅ RECUPERACIÓN DE CONTRASEÑA
    token_recuperacion = db.Column(db.String(256), nullable=True, unique=True)
    expira_token_recuperacion = db.Column(db.DateTime, nullable=True)
    
    # Estado de cuenta (soft delete)
    estado_cuenta = db.Column(db.String(20), default="activo")  # activo, desactivado, eliminado
    fecha_desactivacion = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación con PerfilUsuario
    perfil = db.relationship("PerfilUsuario", back_populates="usuario", uselist=False, cascade="all, delete-orphan")

    def set_password(self, password):
        """Genera el hash de la contraseña"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifica la contraseña"""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<Usuario {self.nombre} {self.primer_apellido} - {self.correo}>"


class PerfilUsuario(db.Model):
    __tablename__ = "perfiles_usuarios"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    nombre_completo = db.Column(db.String(200), nullable=False)
    id_publico = db.Column(db.String(50), unique=True, nullable=False)
    
    # Información del curso
    idioma = db.Column(db.String(50), nullable=False)
    nivel_actual = db.Column(db.String(10), default="A1")
    curso_actual = db.Column(db.String(100), nullable=True)
    
    # Gamificación
    total_xp = db.Column(db.Integer, default=0)
    dias_racha = db.Column(db.Integer, default=0)
    ultima_actividad = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación inversa con Usuario
    usuario = db.relationship("Usuario", back_populates="perfil")

    def __repr__(self):
        return f"<PerfilUsuario {self.nombre_completo} - {self.idioma} {self.nivel_actual}>"