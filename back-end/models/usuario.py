from config.database import db
# IMPORTANTE: Asegúrate de importar estas funciones si las usas en los métodos
from werkzeug.security import generate_password_hash, check_password_hash 
from datetime import datetime
# IMPORTANTE: Necesitas importar Date para usarlo
from sqlalchemy import Date 

class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    # Corrección: Longitud 20, nullable=True (aunque siempre lo insertas)
    id_publico = db.Column(db.String(20), unique=True, nullable=True) 
    nombre = db.Column(db.String(100), nullable=False)
    primer_apellido = db.Column(db.String(100), nullable=False)
    segundo_apellido = db.Column(db.String(100), nullable=True)
    # Corrección: Longitud 255
    correo = db.Column(db.String(255), unique=True, nullable=False) 
    # Corrección: Longitud 255
    contrasena_hash = db.Column(db.String(255), nullable=False) 
    # Corrección: Longitud 50, default='alumno'
    rol = db.Column(db.String(50), default="alumno") 
    
    # Verificación de correo
    correo_verificado = db.Column(db.Boolean, default=False)
    codigo_verificacion = db.Column(db.String(6), nullable=True)
    expira_verificacion = db.Column(db.DateTime, nullable=True)
    
    # Recuperación de contraseña
    token_recuperacion = db.Column(db.String(256), nullable=True, unique=True) # Longitud 256 está bien aquí
    expira_token_recuperacion = db.Column(db.DateTime, nullable=True)
    
    # Estado de cuenta (soft delete)
    # Corrección: nullable=False según tu SQL
    estado_cuenta = db.Column(db.String(20), default="activo", nullable=False) 
    fecha_desactivacion = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    # Corrección: Usar db.func.now() para defaults manejados por DB si prefieres
    creado_en = db.Column(db.DateTime, default=db.func.now()) 
    actualizado_en = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    # Relación con PerfilUsuario
    perfil = db.relationship("PerfilUsuario", back_populates="usuario", uselist=False, cascade="all, delete-orphan")

    def set_password(self, password):
        """Genera el hash de la contraseña"""
        self.contrasena_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifica la contraseña"""
        # Añadir verificación de que contrasena_hash no sea None por si acaso
        if not self.contrasena_hash:
            return False
        return check_password_hash(self.contrasena_hash, password)

    def __repr__(self):
        return f"<Usuario {self.id}: {self.correo}>"


class PerfilUsuario(db.Model):
    __tablename__ = "perfil_usuarios" # ✅ Correcto

    id = db.Column(db.Integer, primary_key=True)
    # Corrección: Añadir unique=True para coincidir con SQL
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), unique=True, nullable=False) 
    # Corrección: Longitud 255
    nombre_completo = db.Column(db.String(255), nullable=False) 
    # Corrección: Longitud 20, nullable=True, quitar unique
    id_publico = db.Column(db.String(20), nullable=True) 
    
    # Información del curso
    # Corrección: Longitud 100, nullable=True (según SQL)
    idioma = db.Column(db.String(100), nullable=True) 
    # Corrección: Longitud 50
    nivel_actual = db.Column(db.String(50), default="A1") 
    curso_actual = db.Column(db.String(100), nullable=True)
    
    # Gamificación
    total_xp = db.Column(db.Integer, default=0)
    dias_racha = db.Column(db.Integer, default=0)
    # Corrección: Cambiar a db.Date
    ultima_actividad = db.Column(db.Date, nullable=True) 
    
    # Timestamps
    # Corrección: Usar db.func.now() para defaults manejados por DB
    creado_en = db.Column(db.DateTime, default=db.func.now()) 
    actualizado_en = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    # Relación inversa con Usuario
    usuario = db.relationship("Usuario", back_populates="perfil")

    def __repr__(self):
        return f"<PerfilUsuario para Usuario ID {self.usuario_id}>"
