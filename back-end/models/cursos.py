# back-end/models/cursos.py
from config.database import db
from datetime import datetime, date
from sqlalchemy.dialects.mysql import JSON
from decimal import Decimal


class Curso(db.Model):
    """Modelo para cursos organizados por niveles CEFR (A1-C2)"""
    __tablename__ = 'cursos'
    
    # Identificación
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    nivel = db.Column(db.String(10), nullable=False)  # A1, A2, B1, B2, C1, C2
    descripcion = db.Column(db.Text)
    idioma = db.Column(db.String(50), nullable=False, default='ingles')
    codigo = db.Column(db.String(20), unique=True, nullable=False)  # ENG-A1, ENG-A2
    
    # Profesor asignado
    profesor_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'))
    
    # Multimedia
    imagen_portada = db.Column(db.String(500))
    
    # Organización
    orden = db.Column(db.Integer, default=0)
    activo = db.Column(db.Boolean, default=True)
    
    # Estadísticas (actualizadas por triggers)
    total_lecciones = db.Column(db.Integer, default=0)
    duracion_estimada_total = db.Column(db.Integer, default=0)
    
    # Metadata
    requisitos_previos = db.Column(JSON)  # IDs de cursos prerequisitos
    objetivos_aprendizaje = db.Column(JSON)  # Lista de objetivos
    
    # Auditoría
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # ⭐ Relaciones - IMPORTANTE: especificar foreign_keys explícitamente
    lecciones = db.relationship(
        'Leccion',
        backref='curso',
        lazy='dynamic',
        cascade='all, delete-orphan',
        foreign_keys='Leccion.curso_id',  # ← Especificar explícitamente
        order_by='Leccion.orden'
    )
    
    estudiantes_progreso = db.relationship(
        'ProgresoCurso',
        backref='curso',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    # Índices
    __table_args__ = (
        db.Index('idx_curso_idioma_nivel', 'idioma', 'nivel'),
        db.Index('idx_curso_activo', 'activo'),
        db.Index('idx_curso_codigo', 'codigo'),
    )
    
    def __repr__(self):
        return f'<Curso {self.codigo}: {self.nombre}>'
    
    # -------------------- Serialización --------------------
    def to_dict(self, incluir_lecciones=False, incluir_profesor=True):
        """Serializar curso a diccionario"""
        data = {
            'id': self.id,
            'nombre': self.nombre,
            'nivel': self.nivel,
            'descripcion': self.descripcion,
            'idioma': self.idioma,
            'codigo': self.codigo,
            'imagen_portada': self.imagen_portada,
            'orden': self.orden,
            'activo': self.activo,
            'total_lecciones': self.total_lecciones,
            'duracion_estimada_total': self.duracion_estimada_total,
            'requisitos_previos': self.requisitos_previos,
            'objetivos_aprendizaje': self.objetivos_aprendizaje,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'actualizado_en': self.actualizado_en.isoformat() if self.actualizado_en else None
        }
        
        if incluir_profesor and self.profesor_id:
            from models.usuario import Usuario
            profesor = Usuario.query.get(self.profesor_id)
            if profesor:
                data['profesor'] = {
                    'id': profesor.id,
                    'nombre': profesor.nombre,
                    'primer_apellido': profesor.primer_apellido,
                    'correo': profesor.correo
                }
            else:
                data['profesor'] = None
        else:
            data['profesor_id'] = self.profesor_id
        
        if incluir_lecciones:
            # Importar aquí para evitar importación circular
            from models.leccion import EstadoLeccion
            lecciones_publicadas = self.lecciones.filter(
                db.text("estado = 'publicada'")
            ).order_by('orden').all()
            data['lecciones'] = [l.to_dict() for l in lecciones_publicadas]
        
        return data
    
    # -------------------- Métodos de utilidad --------------------
    def actualizar_estadisticas(self):
        """Actualizar contador de lecciones y duración total"""
        from models.leccion import EstadoLeccion
        
        lecciones_publicadas = self.lecciones.filter(
            db.text("estado = 'publicada'")
        ).all()
        
        self.total_lecciones = len(lecciones_publicadas)
        self.duracion_estimada_total = sum(
            l.duracion_estimada or 0 for l in lecciones_publicadas
        )
        db.session.commit()
    
    def obtener_lecciones_publicadas(self):
        """Obtener todas las lecciones publicadas ordenadas"""
        from models.leccion import EstadoLeccion
        return self.lecciones.filter(
            db.text("estado = 'publicada'")
        ).order_by('orden').all()
    
    def tiene_prerequisitos_cumplidos(self, usuario_id):
        """Verificar si el usuario cumple los prerequisitos del curso"""
        if not self.requisitos_previos:
            return True
        
        for curso_req_id in self.requisitos_previos:
            progreso = ProgresoCurso.query.filter_by(
                usuario_id=usuario_id,
                curso_id=curso_req_id
            ).first()
            
            if not progreso or progreso.estado != 'completado':
                return False
        
        return True


class ProgresoCurso(db.Model):
    """Modelo para tracking de progreso de estudiantes en cursos"""
    __tablename__ = 'progreso_cursos'
    
    # Identificación
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id'), nullable=False)
    
    # Progreso
    lecciones_completadas = db.Column(db.Integer, default=0)
    lecciones_totales = db.Column(db.Integer, default=0)
    porcentaje_completado = db.Column(db.Numeric(5, 2), default=0.00)
    
    # Fechas
    fecha_inicio = db.Column(db.Date)
    fecha_completado = db.Column(db.Date)
    
    # Estado: no_iniciado, en_progreso, completado, abandonado
    estado = db.Column(db.String(20), default='no_iniciado')
    
    # Estadísticas
    tiempo_dedicado = db.Column(db.Integer, default=0)  # minutos
    puntuacion_promedio = db.Column(db.Numeric(5, 2))
    ultima_leccion_id = db.Column(db.Integer, db.ForeignKey('lecciones.id'))
    
    # Relaciones
    usuario = db.relationship('Usuario', backref='progresos_cursos')
    ultima_leccion = db.relationship('Leccion', foreign_keys=[ultima_leccion_id])
    
    # Constraint única
    __table_args__ = (
        db.UniqueConstraint('usuario_id', 'curso_id', name='unique_usuario_curso'),
        db.Index('idx_progreso_usuario', 'usuario_id'),
        db.Index('idx_progreso_curso', 'curso_id'),
        db.Index('idx_progreso_estado', 'estado'),
    )
    
    def __repr__(self):
        return f'<ProgresoCurso usuario={self.usuario_id} curso={self.curso_id} {self.porcentaje_completado}%>'
    
    # -------------------- Serialización --------------------
    def to_dict(self, incluir_curso=False, incluir_usuario=False):
        """Serializar progreso a diccionario"""
        data = {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'curso_id': self.curso_id,
            'lecciones_completadas': self.lecciones_completadas,
            'lecciones_totales': self.lecciones_totales,
            'porcentaje_completado': float(self.porcentaje_completado) if self.porcentaje_completado else 0,
            'estado': self.estado,
            'tiempo_dedicado': self.tiempo_dedicado,
            'puntuacion_promedio': float(self.puntuacion_promedio) if self.puntuacion_promedio else None,
            'fecha_inicio': self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            'fecha_completado': self.fecha_completado.isoformat() if self.fecha_completado else None,
            'ultima_leccion_id': self.ultima_leccion_id
        }
        
        if incluir_curso:
            data['curso'] = self.curso.to_dict(incluir_lecciones=False, incluir_profesor=False)
        
        if incluir_usuario:
            data['usuario'] = {
                'id': self.usuario.id,
                'nombre': self.usuario.nombre,
                'correo': self.usuario.correo
            }
        
        return data
    
    # -------------------- Métodos de progreso --------------------
    def actualizar_progreso(self):
        """Calcular porcentaje y actualizar estado automáticamente"""
        if self.lecciones_totales > 0:
            self.porcentaje_completado = Decimal(
                round((self.lecciones_completadas / self.lecciones_totales) * 100, 2)
            )
            
            if self.porcentaje_completado == 0:
                self.estado = 'no_iniciado'
            elif self.porcentaje_completado >= 100:
                self.estado = 'completado'
                if not self.fecha_completado:
                    self.fecha_completado = date.today()
            else:
                self.estado = 'en_progreso'
                if not self.fecha_inicio:
                    self.fecha_inicio = date.today()
        
        db.session.commit()
    
    def registrar_leccion_completada(self, leccion_id, tiempo_minutos=0, puntuacion=None):
        """Registrar una lección como completada"""
        self.lecciones_completadas += 1
        self.ultima_leccion_id = leccion_id
        self.tiempo_dedicado += tiempo_minutos
        
        if puntuacion is not None:
            if self.puntuacion_promedio is None:
                self.puntuacion_promedio = Decimal(str(puntuacion))
            else:
                # Calcular promedio ponderado
                total_anterior = float(self.puntuacion_promedio) * (self.lecciones_completadas - 1)
                self.puntuacion_promedio = Decimal(
                    str((total_anterior + puntuacion) / self.lecciones_completadas)
                )
        
        if not self.fecha_inicio:
            self.fecha_inicio = date.today()
        
        self.actualizar_progreso()
    
    def reiniciar_progreso(self):
        """Reiniciar el progreso del estudiante en este curso"""
        self.lecciones_completadas = 0
        self.porcentaje_completado = Decimal('0.00')
        self.estado = 'no_iniciado'
        self.tiempo_dedicado = 0
        self.puntuacion_promedio = None
        self.fecha_inicio = None
        self.fecha_completado = None
        self.ultima_leccion_id = None
        db.session.commit()