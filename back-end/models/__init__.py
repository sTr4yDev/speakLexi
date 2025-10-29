# back-end/models/__init__.py
"""
Modelos de la aplicación SpeakLexi
"""

from models.usuario import Usuario, PerfilUsuario, PerfilEstudiante, PerfilProfesor, PerfilAdministrador
from models.leccion import Leccion, Actividad, NivelDificultad, TipoActividad, EstadoLeccion
from models.multimedia import Multimedia
from models.cursos import Curso, ProgresoCurso  # ← AGREGAR

__all__ = [
    'Usuario',
    'PerfilUsuario',
    'PerfilEstudiante',
    'PerfilProfesor',
    'PerfilAdministrador',
    'Leccion',
    'Actividad',
    'NivelDificultad',
    'TipoActividad',
    'EstadoLeccion',
    'Multimedia',
    'Curso',  # ← AGREGAR
    'ProgresoCurso'  # ← AGREGAR
]