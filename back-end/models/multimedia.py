from datetime import datetime
from config.database import db
from sqlalchemy import Enum as SQLEnum
import enum
import os


class TipoMultimedia(enum.Enum):
    """Enum para tipos de recursos multimedia"""
    IMAGEN = "imagen"
    AUDIO = "audio"
    VIDEO = "video"
    DOCUMENTO = "documento"


class EstadoMultimedia(enum.Enum):
    """Enum para estados de procesamiento de multimedia"""
    PENDIENTE = "pendiente"
    PROCESANDO = "procesando"
    DISPONIBLE = "disponible"
    ERROR = "error"


class Multimedia(db.Model):
    """
    Modelo para almacenar recursos multimedia del sistema.
    
    Attributes:
        id (int): Identificador único del recurso
        nombre_archivo (str): Nombre original del archivo
        nombre_almacenado (str): Nombre único en el sistema de archivos
        tipo (str): Tipo de multimedia (imagen, audio, video, documento)
        url (str): URL o ruta del archivo
        url_thumbnail (str): URL de miniatura (para imágenes/videos)
        mime_type (str): Tipo MIME del archivo
        tamano (int): Tamaño del archivo en bytes
        duracion (int): Duración en segundos (para audio/video)
        dimensiones (JSON): Ancho y alto (para imágenes/videos)
        estado (str): Estado de procesamiento
        metadata (JSON): Metadatos adicionales
        descripcion (str): Descripción del recurso
        alt_text (str): Texto alternativo (accesibilidad)
        etiquetas (JSON): Etiquetas para búsqueda
        subido_por (int): ID del usuario que subió el recurso
        creado_en (datetime): Fecha de creación
        actualizado_en (datetime): Fecha de última actualización
    
    Relationships:
        subidor: Usuario que subió el archivo
        lecciones: Lecciones que usan este recurso
    """
    __tablename__ = 'multimedia'

    # Identificación
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre_archivo = db.Column(db.String(255), nullable=False)
    nombre_almacenado = db.Column(db.String(255), unique=True, nullable=False, index=True)
    
    # Tipo y clasificación
    tipo = db.Column(SQLEnum(TipoMultimedia), nullable=False, index=True)
    mime_type = db.Column(db.String(100), nullable=False)
    categoria = db.Column(db.String(50), index=True)  # vocabulario, gramatica, pronunciacion, etc.
    
    # URLs y almacenamiento
    url = db.Column(db.String(500), nullable=False)
    url_thumbnail = db.Column(db.String(500))
    ruta_local = db.Column(db.String(500))  # Ruta en el servidor si aplica
    
    # Propiedades del archivo
    tamano = db.Column(db.Integer)  # En bytes
    duracion = db.Column(db.Integer)  # En segundos (para audio/video)
    dimensiones = db.Column(db.JSON)  # {"ancho": 1920, "alto": 1080}
    
    # Estado y procesamiento
    estado = db.Column(
        SQLEnum(EstadoMultimedia),
        nullable=False,
        default=EstadoMultimedia.PENDIENTE,
        index=True
    )
    mensaje_error = db.Column(db.Text)  # Si estado es ERROR
    
    # Información adicional
    descripcion = db.Column(db.Text)
    alt_text = db.Column(db.String(200))  # Para accesibilidad
    transcripcion = db.Column(db.Text)  # Para audio/video
    etiquetas = db.Column(db.JSON, default=list)
    metadata = db.Column(db.JSON, default=dict)  # Metadata adicional flexible
    
    # Uso y estadísticas
    veces_usado = db.Column(db.Integer, default=0)
    ultima_vez_usado = db.Column(db.DateTime)
    
    # Auditoría
    subido_por = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relaciones
    subidor = db.relationship('Usuario', foreign_keys=[subido_por])
    
    # Índices compuestos
    __table_args__ = (
        db.Index('idx_multimedia_tipo_estado', 'tipo', 'estado'),
        db.Index('idx_multimedia_categoria', 'categoria'),
    )

    def __repr__(self):
        return f'<Multimedia {self.id}: {self.nombre_archivo}>'

    def to_dict(self, incluir_metadata=False):
        """
        Convierte el modelo a diccionario para serialización JSON.
        
        Args:
            incluir_metadata (bool): Si debe incluir metadata completa
        
        Returns:
            dict: Representación del recurso multimedia
        """
        data = {
            'id': self.id,
            'nombre_archivo': self.nombre_archivo,
            'tipo': self.tipo.value if isinstance(self.tipo, TipoMultimedia) else self.tipo,
            'mime_type': self.mime_type,
            'categoria': self.categoria,
            'url': self.url,
            'url_thumbnail': self.url_thumbnail,
            'tamano': self.tamano,
            'tamano_formateado': self._formatear_tamano(),
            'duracion': self.duracion,
            'duracion_formateada': self._formatear_duracion(),
            'dimensiones': self.dimensiones,
            'estado': self.estado.value if isinstance(self.estado, EstadoMultimedia) else self.estado,
            'descripcion': self.descripcion,
            'alt_text': self.alt_text,
            'transcripcion': self.transcripcion,
            'etiquetas': self.etiquetas or [],
            'veces_usado': self.veces_usado,
            'subido_por': self.subido_por,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None,
        }
        
        if incluir_metadata:
            data['metadata'] = self.metadata
            data['nombre_almacenado'] = self.nombre_almacenado
            data['ruta_local'] = self.ruta_local
            data['mensaje_error'] = self.mensaje_error
        
        return data

    def _formatear_tamano(self):
        """
        Formatea el tamaño del archivo en formato legible.
        
        Returns:
            str: Tamaño formateado (ej: "1.5 MB")
        """
        if not self.tamano:
            return "Desconocido"
        
        for unidad in ['B', 'KB', 'MB', 'GB']:
            if self.tamano < 1024.0:
                return f"{self.tamano:.2f} {unidad}"
            self.tamano /= 1024.0
        
        return f"{self.tamano:.2f} TB"

    def _formatear_duracion(self):
        """
        Formatea la duración en formato legible.
        
        Returns:
            str: Duración formateada (ej: "3:45")
        """
        if not self.duracion:
            return None
        
        minutos = self.duracion // 60
        segundos = self.duracion % 60
        
        if minutos > 60:
            horas = minutos // 60
            minutos = minutos % 60
            return f"{horas}:{minutos:02d}:{segundos:02d}"
        
        return f"{minutos}:{segundos:02d}"

    def marcar_disponible(self):
        """Marca el recurso como disponible después de procesamiento"""
        self.estado = EstadoMultimedia.DISPONIBLE
        self.actualizado_en = datetime.utcnow()

    def marcar_error(self, mensaje_error):
        """
        Marca el recurso como error.
        
        Args:
            mensaje_error (str): Descripción del error ocurrido
        """
        self.estado = EstadoMultimedia.ERROR
        self.mensaje_error = mensaje_error
        self.actualizado_en = datetime.utcnow()

    def incrementar_uso(self):
        """Incrementa el contador de uso del recurso"""
        self.veces_usado += 1
        self.ultima_vez_usado = datetime.utcnow()

    def es_imagen(self):
        """Verifica si el recurso es una imagen"""
        return self.tipo == TipoMultimedia.IMAGEN

    def es_audio(self):
        """Verifica si el recurso es audio"""
        return self.tipo == TipoMultimedia.AUDIO

    def es_video(self):
        """Verifica si el recurso es video"""
        return self.tipo == TipoMultimedia.VIDEO

    def puede_tener_thumbnail(self):
        """Verifica si el recurso puede tener miniatura"""
        return self.tipo in [TipoMultimedia.IMAGEN, TipoMultimedia.VIDEO]

    @staticmethod
    def generar_nombre_unico(nombre_original):
        """
        Genera un nombre único para almacenar el archivo.
        
        Args:
            nombre_original (str): Nombre original del archivo
        
        Returns:
            str: Nombre único generado
        """
        import uuid
        from pathlib import Path
        
        extension = Path(nombre_original).suffix
        nombre_unico = f"{uuid.uuid4().hex}{extension}"
        
        return nombre_unico

    @staticmethod
    def validar_tipo_archivo(mime_type, tipo_esperado):
        """
        Valida que el tipo MIME corresponda al tipo esperado.
        
        Args:
            mime_type (str): Tipo MIME del archivo
            tipo_esperado (TipoMultimedia): Tipo esperado
        
        Returns:
            bool: True si es válido
        """
        tipos_validos = {
            TipoMultimedia.IMAGEN: [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                'image/webp', 'image/svg+xml'
            ],
            TipoMultimedia.AUDIO: [
                'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
                'audio/webm', 'audio/aac'
            ],
            TipoMultimedia.VIDEO: [
                'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
            ],
            TipoMultimedia.DOCUMENTO: [
                'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ]
        }
        
        return mime_type in tipos_validos.get(tipo_esperado, [])

    @staticmethod
    def obtener_extension_mime(mime_type):
        """
        Obtiene la extensión recomendada para un tipo MIME.
        
        Args:
            mime_type (str): Tipo MIME
        
        Returns:
            str: Extensión con punto (ej: ".jpg")
        """
        extensiones = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'audio/mpeg': '.mp3',
            'audio/mp3': '.mp3',
            'audio/wav': '.wav',
            'audio/ogg': '.ogg',
            'video/mp4': '.mp4',
            'video/webm': '.webm',
            'application/pdf': '.pdf',
            'text/plain': '.txt'
        }
        
        return extensiones.get(mime_type, '.bin')


class ConfiguracionMultimedia(db.Model):
    """
    Modelo para configuración global de multimedia.
    Almacena límites, rutas y configuraciones del sistema.
    """
    __tablename__ = 'configuracion_multimedia'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    clave = db.Column(db.String(100), unique=True, nullable=False, index=True)
    valor = db.Column(db.Text, nullable=False)
    descripcion = db.Column(db.Text)
    actualizado_en = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    @staticmethod
    def obtener_valor(clave, valor_por_defecto=None):
        """
        Obtiene un valor de configuración.
        
        Args:
            clave (str): Clave de configuración
            valor_por_defecto: Valor si no existe
        
        Returns:
            Valor de configuración o valor por defecto
        """
        config = ConfiguracionMultimedia.query.filter_by(clave=clave).first()
        return config.valor if config else valor_por_defecto

    @staticmethod
    def establecer_valor(clave, valor, descripcion=None):
        """
        Establece un valor de configuración.
        
        Args:
            clave (str): Clave de configuración
            valor: Valor a establecer
            descripcion (str): Descripción opcional
        """
        config = ConfiguracionMultimedia.query.filter_by(clave=clave).first()
        
        if config:
            config.valor = str(valor)
            config.actualizado_en = datetime.utcnow()
        else:
            config = ConfiguracionMultimedia(
                clave=clave,
                valor=str(valor),
                descripcion=descripcion
            )
            db.session.add(config)
        
        db.session.commit()
        return config

    def __repr__(self):
        return f'<ConfigMultimedia {self.clave}: {self.valor}>'


# Valores por defecto de configuración
CONFIGURACION_POR_DEFECTO = {
    'max_tamano_imagen': '5242880',  # 5 MB en bytes
    'max_tamano_audio': '10485760',  # 10 MB
    'max_tamano_video': '52428800',  # 50 MB
    'max_tamano_documento': '10485760',  # 10 MB
    'ruta_almacenamiento': 'uploads/multimedia',
    'generar_thumbnails': 'true',
    'thumbnail_ancho': '300',
    'thumbnail_alto': '300',
    'calidad_compresion_imagen': '85',
    'formatos_permitidos_imagen': 'jpg,jpeg,png,gif,webp',
    'formatos_permitidos_audio': 'mp3,wav,ogg',
    'formatos_permitidos_video': 'mp4,webm',
    'formatos_permitidos_documento': 'pdf,txt'
}