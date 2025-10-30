"""
Validadores para datos de entrada
Verifica que los datos cumplan con los requisitos antes de procesarlos
"""

import re
from typing import List, Optional, Any, Dict
from datetime import datetime


class ValidationError(Exception):
    """Excepción personalizada para errores de validación"""
    def __init__(self, errores: List[str]):
        self.errores = errores
        super().__init__(", ".join(errores))


class Validator:
    """Clase base para validadores"""
    
    def __init__(self):
        self.errores: List[str] = []
    
    def es_valido(self) -> bool:
        """Retorna True si no hay errores"""
        return len(self.errores) == 0
    
    def lanzar_si_invalido(self):
        """Lanza excepción si hay errores"""
        if not self.es_valido():
            raise ValidationError(self.errores)
    
    def agregar_error(self, mensaje: str):
        """Agrega un mensaje de error"""
        self.errores.append(mensaje)


# ==========================================
# VALIDADORES DE CAMPOS COMUNES
# ==========================================

def validar_requerido(valor: Any, nombre_campo: str, validator: Validator):
    """Valida que un campo sea requerido"""
    if valor is None or (isinstance(valor, str) and valor.strip() == ""):
        validator.agregar_error(f"El campo '{nombre_campo}' es requerido")
        return False
    return True


def validar_longitud(
    valor: str,
    nombre_campo: str,
    min_length: Optional[int] = None,
    max_length: Optional[int] = None,
    validator: Optional[Validator] = None
) -> bool:
    """
    Valida la longitud de un string
    
    Args:
        valor: Valor a validar
        nombre_campo: Nombre del campo para el mensaje de error
        min_length: Longitud mínima (opcional)
        max_length: Longitud máxima (opcional)
        validator: Validador para agregar errores
    
    Returns:
        True si es válido
    """
    if valor is None:
        return True
    
    longitud = len(valor.strip())
    
    if min_length and longitud < min_length:
        msg = f"'{nombre_campo}' debe tener al menos {min_length} caracteres"
        if validator:
            validator.agregar_error(msg)
        return False
    
    if max_length and longitud > max_length:
        msg = f"'{nombre_campo}' no puede tener más de {max_length} caracteres"
        if validator:
            validator.agregar_error(msg)
        return False
    
    return True


def validar_email(email: str, validator: Optional[Validator] = None) -> bool:
    """
    Valida formato de email
    
    Args:
        email: Email a validar
        validator: Validador para agregar errores
    
    Returns:
        True si es válido
    """
    if not email:
        return True
    
    # Patrón regex simple para email
    patron = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(patron, email):
        if validator:
            validator.agregar_error("El formato del email no es válido")
        return False
    
    return True


def validar_rango_numerico(
    valor: Any,
    nombre_campo: str,
    minimo: Optional[float] = None,
    maximo: Optional[float] = None,
    validator: Optional[Validator] = None
) -> bool:
    """
    Valida que un número esté en un rango
    
    Args:
        valor: Valor a validar
        nombre_campo: Nombre del campo
        minimo: Valor mínimo permitido
        maximo: Valor máximo permitido
        validator: Validador para agregar errores
    
    Returns:
        True si es válido
    """
    if valor is None:
        return True
    
    try:
        numero = float(valor)
    except (ValueError, TypeError):
        if validator:
            validator.agregar_error(f"'{nombre_campo}' debe ser un número")
        return False
    
    if minimo is not None and numero < minimo:
        if validator:
            validator.agregar_error(f"'{nombre_campo}' debe ser mayor o igual a {minimo}")
        return False
    
    if maximo is not None and numero > maximo:
        if validator:
            validator.agregar_error(f"'{nombre_campo}' debe ser menor o igual a {maximo}")
        return False
    
    return True


def validar_opciones(
    valor: Any,
    nombre_campo: str,
    opciones: List[Any],
    validator: Optional[Validator] = None
) -> bool:
    """
    Valida que un valor esté dentro de opciones permitidas
    
    Args:
        valor: Valor a validar
        nombre_campo: Nombre del campo
        opciones: Lista de valores permitidos
        validator: Validador para agregar errores
    
    Returns:
        True si es válido
    """
    if valor is None:
        return True
    
    if valor not in opciones:
        opciones_str = ", ".join(str(o) for o in opciones)
        if validator:
            validator.agregar_error(
                f"'{nombre_campo}' debe ser uno de: {opciones_str}"
            )
        return False
    
    return True


# ==========================================
# VALIDADORES ESPECÍFICOS DE SPEAKLEXI
# ==========================================

class LeccionValidator(Validator):
    """Validador para crear/actualizar lecciones"""
    
    def validar(self, data: Dict[str, Any]):
        """
        Valida datos de una lección
        
        Args:
            data: Diccionario con datos de la lección
        """
        # Validar título
        if validar_requerido(data.get('titulo'), 'título', self):
            validar_longitud(
                data['titulo'],
                'título',
                min_length=3,
                max_length=200,
                validator=self
            )
        
        # Validar descripción
        if data.get('descripcion'):
            validar_longitud(
                data['descripcion'],
                'descripción',
                min_length=10,
                max_length=1000,
                validator=self
            )
        
        # Validar nivel
        validar_requerido(data.get('nivel'), 'nivel', self)
        validar_opciones(
            data.get('nivel'),
            'nivel',
            ['principiante', 'intermedio', 'avanzado'],
            validator=self
        )
        
        # Validar idioma
        validar_requerido(data.get('idioma'), 'idioma', self)
        validar_opciones(
            data.get('idioma'),
            'idioma',
            ['ingles', 'español', 'frances', 'aleman', 'italiano'],
            validator=self
        )
        
        # Validar duración estimada
        if data.get('duracion_estimada') is not None:
            validar_rango_numerico(
                data['duracion_estimada'],
                'duración estimada',
                minimo=1,
                maximo=180,  # Máximo 3 horas
                validator=self
            )
        
        # Validar puntos XP
        if data.get('puntos_xp') is not None:
            validar_rango_numerico(
                data['puntos_xp'],
                'puntos XP',
                minimo=0,
                maximo=1000,
                validator=self
            )


class CursoValidator(Validator):
    """Validador para crear/actualizar cursos"""
    
    def validar(self, data: Dict[str, Any]):
        """
        Valida datos de un curso
        
        Args:
            data: Diccionario con datos del curso
        """
        # Validar nombre
        if validar_requerido(data.get('nombre'), 'nombre', self):
            validar_longitud(
                data['nombre'],
                'nombre',
                min_length=3,
                max_length=200,
                validator=self
            )
        
        # Validar descripción
        if data.get('descripcion'):
            validar_longitud(
                data['descripcion'],
                'descripción',
                min_length=10,
                max_length=2000,
                validator=self
            )
        
        # Validar nivel
        validar_requerido(data.get('nivel'), 'nivel', self)
        validar_opciones(
            data.get('nivel'),
            'nivel',
            ['principiante', 'intermedio', 'avanzado'],
            validator=self
        )
        
        # Validar idioma
        validar_requerido(data.get('idioma'), 'idioma', self)


class ActividadValidator(Validator):
    """Validador para crear/actualizar actividades"""
    
    def validar(self, data: Dict[str, Any]):
        """
        Valida datos de una actividad
        
        Args:
            data: Diccionario con datos de la actividad
        """
        # Validar pregunta
        if validar_requerido(data.get('pregunta'), 'pregunta', self):
            validar_longitud(
                data['pregunta'],
                'pregunta',
                min_length=5,
                max_length=500,
                validator=self
            )
        
        # Validar tipo
        validar_requerido(data.get('tipo'), 'tipo', self)
        tipos_validos = [
            'opcion_multiple',
            'verdadero_falso',
            'completar',
            'ordenar',
            'emparejar',
            'traduccion'
        ]
        validar_opciones(
            data.get('tipo'),
            'tipo',
            tipos_validos,
            validator=self
        )
        
        # Validar respuesta correcta
        validar_requerido(data.get('respuesta_correcta'), 'respuesta correcta', self)
        
        # Validar puntos
        if data.get('puntos') is not None:
            validar_rango_numerico(
                data['puntos'],
                'puntos',
                minimo=1,
                maximo=100,
                validator=self
            )
        
        # Validaciones específicas por tipo
        tipo = data.get('tipo')
        
        if tipo == 'opcion_multiple':
            if not data.get('opciones') or not isinstance(data['opciones'], dict):
                self.agregar_error("Las actividades de opción múltiple deben tener opciones")
            elif 'opciones' in data.get('opciones', {}):
                opciones_lista = data['opciones'].get('opciones', [])
                if len(opciones_lista) < 2:
                    self.agregar_error("Debe haber al menos 2 opciones")
                if len(opciones_lista) > 6:
                    self.agregar_error("No puede haber más de 6 opciones")


class UsuarioValidator(Validator):
    """Validador para crear/actualizar usuarios"""
    
    def validar_registro(self, data: Dict[str, Any]):
        """
        Valida datos de registro de usuario
        
        Args:
            data: Diccionario con datos del usuario
        """
        # Validar nombre
        if validar_requerido(data.get('nombre'), 'nombre', self):
            validar_longitud(
                data['nombre'],
                'nombre',
                min_length=2,
                max_length=100,
                validator=self
            )
        
        # Validar email
        if validar_requerido(data.get('email'), 'email', self):
            validar_email(data['email'], validator=self)
        
        # Validar contraseña
        if validar_requerido(data.get('password'), 'contraseña', self):
            self._validar_password(data['password'])
    
    def _validar_password(self, password: str):
        """Valida requisitos de contraseña"""
        if len(password) < 6:
            self.agregar_error("La contraseña debe tener al menos 6 caracteres")
        
        if len(password) > 128:
            self.agregar_error("La contraseña no puede tener más de 128 caracteres")


# ==========================================
# VALIDADOR DE ARCHIVOS
# ==========================================

class ArchivoValidator(Validator):
    """Validador para subida de archivos"""
    
    EXTENSIONES_PERMITIDAS = {
        'imagen': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'audio': ['mp3', 'wav', 'ogg', 'm4a'],
        'video': ['mp4', 'webm', 'mov'],
        'documento': ['pdf']
    }
    
    TAMANO_MAX_MB = {
        'imagen': 5,
        'audio': 10,
        'video': 50,
        'documento': 5
    }
    
    def validar_archivo(
        self,
        filename: str,
        tipo_archivo: str,
        tamano_bytes: int
    ):
        """
        Valida un archivo subido
        
        Args:
            filename: Nombre del archivo
            tipo_archivo: Tipo de archivo (imagen, audio, video, documento)
            tamano_bytes: Tamaño del archivo en bytes
        """
        # Validar que tenga extensión
        if '.' not in filename:
            self.agregar_error("El archivo debe tener una extensión")
            return
        
        # Obtener extensión
        extension = filename.rsplit('.', 1)[1].lower()
        
        # Validar extensión permitida
        if tipo_archivo not in self.EXTENSIONES_PERMITIDAS:
            self.agregar_error(f"Tipo de archivo '{tipo_archivo}' no válido")
            return
        
        extensiones_validas = self.EXTENSIONES_PERMITIDAS[tipo_archivo]
        if extension not in extensiones_validas:
            self.agregar_error(
                f"Extensión '.{extension}' no permitida. "
                f"Extensiones válidas: {', '.join(extensiones_validas)}"
            )
        
        # Validar tamaño
        tamano_max_mb = self.TAMANO_MAX_MB.get(tipo_archivo, 5)
        tamano_max_bytes = tamano_max_mb * 1024 * 1024
        
        if tamano_bytes > tamano_max_bytes:
            tamano_mb = tamano_bytes / (1024 * 1024)
            self.agregar_error(
                f"El archivo es demasiado grande ({tamano_mb:.1f} MB). "
                f"Tamaño máximo: {tamano_max_mb} MB"
            )


# ==========================================
# FUNCIONES DE UTILIDAD
# ==========================================

def validar_datos(validator: Validator, data: Dict[str, Any]):
    """
    Función helper para validar datos y lanzar excepción si hay errores
    
    Args:
        validator: Instancia del validador
        data: Datos a validar
    
    Raises:
        ValidationError: Si hay errores de validación
    """
    validator.validar(data)
    validator.lanzar_si_invalido()