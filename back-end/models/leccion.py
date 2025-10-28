from datetime import datetime
from config.database import db
from sqlalchemy import Enum as SQLEnum
import enum


class NivelDificultad(enum.Enum):
    """Enum para niveles de dificultad de lecciones"""
    PRINCIPIANTE = "principiante"
    INTERMEDIO = "intermedio"
    AVANZADO = "avanzado"


class TipoActividad(enum.Enum):
    """Enum para tipos de actividades disponibles"""
    MULTIPLE_CHOICE = "multiple_choice"
    FILL_BLANK = "fill_blank"
    MATCHING = "matching"
    TRANSLATION = "translation"
    LISTEN_REPEAT = "listen_repeat"
    TRUE_FALSE = "true_false"
    WORD_ORDER = "word_order"


class EstadoLeccion(enum.Enum):
    """Enum para estados de publicación de lecciones"""
    BORRADOR = "borrador"
    PUBLICADA = "publicada"
    ARCHIVADA = "archivada"


class Leccion(db.Model):
    """
    Modelo para almacenar lecciones del sistema.
    
    Attributes:
        id (int): Identificador único de la lección
        titulo (str): Título de la lección (máx. 200 caracteres)
        descripcion (str): Descripción breve de la lección
        contenido (JSON): Contenido estructurado de la lección
        nivel (str): Nivel de dificultad (principiante, intermedio, avanzado)
        idioma (str): Idioma de la lección
        orden (int): Orden de la lección en el curso
        duracion_estimada (int): Duración estimada en minutos
        puntos_xp (int): Puntos de experiencia que otorga
        estado (str): Estado de publicación (borrador, publicada, archivada)
        categoria (str): Categoría temática de la lección
        etiquetas (JSON): Lista de etiquetas para búsqueda
        requisitos (JSON): Lecciones previas requeridas
        creado_por (int): ID del usuario que creó la lección
        creado_en (datetime): Fecha de creación
        actualizado_en (datetime): Fecha de última actualización
    
    Relationships:
        actividades: Lista de actividades asociadas a la lección
        multimedia: Recursos multimedia asociados
        creador: Usuario que creó la lección
    """
    __tablename__ = 'lecciones'

    # Identificación
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    titulo = db.Column(db.String(200), nullable=False, index=True)
    descripcion = db.Column(db.Text)
    
    # Contenido
    contenido = db.Column(db.JSON, nullable=False, default=dict)
    
    # Clasificación
    nivel = db.Column(
        SQLEnum(NivelDificultad),
        nullable=False,
        index=True,
        default=NivelDificultad.PRINCIPIANTE
    )
    idioma = db.Column(db.String(50), nullable=False, index=True, default='ingles')
    categoria = db.Column(db.String(100), index=True)
    etiquetas = db.Column(db.JSON, default=list)  # Lista de strings
    
    # Orden y estructura
    orden = db.Column(db.Integer, index=True)
    requisitos = db.Column(db.JSON, default=list)  # IDs de lecciones previas
    
    # Metadata de aprendizaje
    duracion_estimada = db.Column(db.Integer, default=10)  # En minutos
    puntos_xp = db.Column(db.Integer, default=50, nullable=False)
    
    # Estado
    estado = db.Column(
        SQLEnum(EstadoLeccion),
        nullable=False,
        default=EstadoLeccion.BORRADOR,
        index=True
    )
    
    # Auditoría
    creado_por = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relaciones
    actividades = db.relationship(
        'Actividad',
        backref='leccion',
        lazy='dynamic',
        cascade='all, delete-orphan',
        order_by='Actividad.orden'
    )
    
    recursos_multimedia = db.relationship(
        'Multimedia',
        secondary='leccion_multimedia',
        backref=db.backref('lecciones', lazy='dynamic')
    )
    
    creador = db.relationship('Usuario', foreign_keys=[creado_por])

    # Índices compuestos para búsquedas eficientes
    __table_args__ = (
        db.Index('idx_leccion_nivel_idioma', 'nivel', 'idioma'),
        db.Index('idx_leccion_estado_orden', 'estado', 'orden'),
    )

    def __repr__(self):
        return f'<Leccion {self.id}: {self.titulo}>'

    def to_dict(self, incluir_actividades=False, incluir_multimedia=False):
        """
        Convierte el modelo a diccionario para serialización JSON.
        
        Args:
            incluir_actividades (bool): Si debe incluir las actividades
            incluir_multimedia (bool): Si debe incluir recursos multimedia
        
        Returns:
            dict: Representación de la lección
        """
        data = {
            'id': self.id,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'contenido': self.contenido,
            'nivel': self.nivel.value if isinstance(self.nivel, NivelDificultad) else self.nivel,
            'idioma': self.idioma,
            'categoria': self.categoria,
            'etiquetas': self.etiquetas or [],
            'orden': self.orden,
            'requisitos': self.requisitos or [],
            'duracion_estimada': self.duracion_estimada,
            'puntos_xp': self.puntos_xp,
            'estado': self.estado.value if isinstance(self.estado, EstadoLeccion) else self.estado,
            'creado_por': self.creado_por,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None,
        }
        
        if incluir_actividades:
            data['actividades'] = [
                actividad.to_dict() 
                for actividad in self.actividades.all()
            ]
        
        if incluir_multimedia:
            data['multimedia'] = [
                recurso.to_dict() 
                for recurso in self.recursos_multimedia
            ]
        
        return data

    def validar_requisitos_cumplidos(self, lecciones_completadas):
        """
        Verifica si el usuario cumple con los requisitos para esta lección.
        
        Args:
            lecciones_completadas (list): Lista de IDs de lecciones completadas
        
        Returns:
            bool: True si cumple todos los requisitos
        """
        if not self.requisitos:
            return True
        
        return all(req_id in lecciones_completadas for req_id in self.requisitos)

    def publicar(self):
        """Marca la lección como publicada"""
        if self.estado == EstadoLeccion.BORRADOR:
            self.estado = EstadoLeccion.PUBLICADA
            self.actualizado_en = datetime.utcnow()

    def archivar(self):
        """Marca la lección como archivada"""
        self.estado = EstadoLeccion.ARCHIVADA
        self.actualizado_en = datetime.utcnow()


class Actividad(db.Model):
    """
    Modelo para actividades dentro de las lecciones.
    
    Attributes:
        id (int): Identificador único
        leccion_id (int): ID de la lección padre
        tipo (str): Tipo de actividad
        pregunta (str): Texto de la pregunta
        opciones (JSON): Opciones de respuesta según el tipo
        respuesta_correcta (JSON): Respuesta correcta (hash/cifrada)
        retroalimentacion (JSON): Mensajes de retroalimentación
        puntos (int): Puntos que otorga esta actividad
        orden (int): Orden dentro de la lección
    """
    __tablename__ = 'actividades'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    leccion_id = db.Column(
        db.Integer,
        db.ForeignKey('lecciones.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    
    # Tipo y contenido
    tipo = db.Column(SQLEnum(TipoActividad), nullable=False)
    pregunta = db.Column(db.Text, nullable=False)
    instrucciones = db.Column(db.Text)
    
    # Opciones y respuestas (estructura varía según tipo)
    opciones = db.Column(db.JSON, default=dict)
    respuesta_correcta = db.Column(db.JSON, nullable=False)
    
    # Retroalimentación
    retroalimentacion = db.Column(db.JSON, default=dict)
    pista = db.Column(db.Text)
    
    # Metadata
    puntos = db.Column(db.Integer, default=10, nullable=False)
    orden = db.Column(db.Integer, nullable=False)
    tiempo_limite = db.Column(db.Integer)  # En segundos, opcional
    
    # Multimedia asociado
    multimedia_id = db.Column(db.Integer, db.ForeignKey('multimedia.id'))
    
    # Auditoría
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    __table_args__ = (
        db.Index('idx_actividad_leccion_orden', 'leccion_id', 'orden'),
    )

    def __repr__(self):
        return f'<Actividad {self.id} - {self.tipo.value}>'

    def to_dict(self, incluir_respuesta=False):
        """
        Convierte la actividad a diccionario.
        
        Args:
            incluir_respuesta (bool): Si debe incluir la respuesta correcta
                                     (solo para profesores/admin)
        
        Returns:
            dict: Representación de la actividad
        """
        data = {
            'id': self.id,
            'tipo': self.tipo.value if isinstance(self.tipo, TipoActividad) else self.tipo,
            'pregunta': self.pregunta,
            'instrucciones': self.instrucciones,
            'opciones': self.opciones,
            'retroalimentacion': self.retroalimentacion,
            'pista': self.pista,
            'puntos': self.puntos,
            'orden': self.orden,
            'tiempo_limite': self.tiempo_limite,
            'multimedia_id': self.multimedia_id,
        }
        
        # Solo incluir respuesta para roles autorizados
        if incluir_respuesta:
            data['respuesta_correcta'] = self.respuesta_correcta
        
        return data

    def verificar_respuesta(self, respuesta_usuario):
        """
        Verifica si la respuesta del usuario es correcta.
        
        Args:
            respuesta_usuario: Respuesta proporcionada por el usuario
        
        Returns:
            dict: {'correcta': bool, 'retroalimentacion': str, 'puntos': int}
        """
        correcta = self._comparar_respuesta(respuesta_usuario)
        
        return {
            'correcta': correcta,
            'retroalimentacion': self.retroalimentacion.get(
                'correcta' if correcta else 'incorrecta',
                'Respuesta ' + ('correcta' if correcta else 'incorrecta')
            ),
            'puntos': self.puntos if correcta else 0
        }

    def _comparar_respuesta(self, respuesta_usuario):
        """
        Compara respuesta del usuario con la correcta según el tipo de actividad.
        
        Args:
            respuesta_usuario: Respuesta del usuario (formato varía según tipo)
        
        Returns:
            bool: True si la respuesta es correcta
        """
        if self.tipo == TipoActividad.MULTIPLE_CHOICE:
            return str(respuesta_usuario).strip().lower() == str(self.respuesta_correcta).strip().lower()
        
        elif self.tipo == TipoActividad.TRUE_FALSE:
            return bool(respuesta_usuario) == bool(self.respuesta_correcta)
        
        elif self.tipo == TipoActividad.FILL_BLANK:
            respuesta_norm = str(respuesta_usuario).strip().lower()
            correcta_norm = str(self.respuesta_correcta).strip().lower()
            return respuesta_norm == correcta_norm
        
        elif self.tipo == TipoActividad.MATCHING:
            # Comparar diccionarios de pares
            return respuesta_usuario == self.respuesta_correcta
        
        elif self.tipo == TipoActividad.WORD_ORDER:
            # Comparar listas ordenadas
            return respuesta_usuario == self.respuesta_correcta
        
        elif self.tipo == TipoActividad.TRANSLATION:
            # Comparación flexible para traducciones
            respuesta_norm = str(respuesta_usuario).strip().lower()
            correcta_norm = str(self.respuesta_correcta).strip().lower()
            return respuesta_norm == correcta_norm
        
        else:
            # Para LISTEN_REPEAT y otros, comparación simple
            return respuesta_usuario == self.respuesta_correcta


# Tabla de asociación para relación muchos-a-muchos
leccion_multimedia = db.Table(
    'leccion_multimedia',
    db.Column('leccion_id', db.Integer, db.ForeignKey('lecciones.id', ondelete='CASCADE'), primary_key=True),
    db.Column('multimedia_id', db.Integer, db.ForeignKey('multimedia.id', ondelete='CASCADE'), primary_key=True),
    db.Column('orden', db.Integer, default=0),
    db.Column('creado_en', db.DateTime, default=datetime.utcnow)
)