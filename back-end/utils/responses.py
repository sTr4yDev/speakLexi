"""
Utilidades para respuestas estándar de la API
Asegura que todas las respuestas tengan el mismo formato
"""

from flask import jsonify
from typing import Any, Optional, Dict, List


def success_response(
    data: Any = None,
    mensaje: str = "Operación exitosa",
    codigo: int = 200
) -> tuple:
    """
    Respuesta exitosa estándar
    
    Args:
        data: Datos a devolver
        mensaje: Mensaje de éxito
        codigo: Código HTTP (default: 200)
    
    Returns:
        Tupla (respuesta_json, codigo_http)
    
    Ejemplo:
        return success_response(
            data={'curso': curso.to_dict()},
            mensaje="Curso creado exitosamente"
        )
    """
    response = {
        "success": True,
        "mensaje": mensaje,
        "data": data
    }
    return jsonify(response), codigo


def error_response(
    mensaje: str,
    detalles: Optional[Dict[str, Any]] = None,
    codigo: int = 400
) -> tuple:
    """
    Respuesta de error estándar
    
    Args:
        mensaje: Mensaje de error para el usuario
        detalles: Detalles adicionales del error (opcional)
        codigo: Código HTTP (default: 400)
    
    Returns:
        Tupla (respuesta_json, codigo_http)
    
    Ejemplo:
        return error_response(
            mensaje="No se pudo crear el curso",
            detalles={"campo": "titulo", "razon": "Ya existe"},
            codigo=400
        )
    """
    response = {
        "success": False,
        "error": mensaje
    }
    
    if detalles:
        response["detalles"] = detalles
    
    return jsonify(response), codigo


def validation_error_response(errores: List[str], codigo: int = 400) -> tuple:
    """
    Respuesta para errores de validación
    
    Args:
        errores: Lista de mensajes de error
        codigo: Código HTTP (default: 400)
    
    Returns:
        Tupla (respuesta_json, codigo_http)
    
    Ejemplo:
        return validation_error_response([
            "El título es requerido",
            "La descripción debe tener al menos 10 caracteres"
        ])
    """
    response = {
        "success": False,
        "error": "Error de validación",
        "errores": errores
    }
    return jsonify(response), codigo


def not_found_response(recurso: str = "Recurso") -> tuple:
    """
    Respuesta para recurso no encontrado
    
    Args:
        recurso: Nombre del recurso no encontrado
    
    Returns:
        Tupla (respuesta_json, codigo_http)
    
    Ejemplo:
        return not_found_response("Curso")
    """
    return error_response(
        mensaje=f"{recurso} no encontrado",
        codigo=404
    )


def unauthorized_response(mensaje: str = "No autorizado") -> tuple:
    """
    Respuesta para acceso no autorizado
    
    Args:
        mensaje: Mensaje de error
    
    Returns:
        Tupla (respuesta_json, codigo_http)
    """
    return error_response(mensaje=mensaje, codigo=401)


def forbidden_response(mensaje: str = "No tienes permisos para realizar esta acción") -> tuple:
    """
    Respuesta para acceso prohibido
    
    Args:
        mensaje: Mensaje de error
    
    Returns:
        Tupla (respuesta_json, codigo_http)
    """
    return error_response(mensaje=mensaje, codigo=403)


def server_error_response(mensaje: str = "Error interno del servidor") -> tuple:
    """
    Respuesta para error interno del servidor
    
    Args:
        mensaje: Mensaje de error
    
    Returns:
        Tupla (respuesta_json, codigo_http)
    """
    return error_response(mensaje=mensaje, codigo=500)


def paginated_response(
    items: List[Any],
    total: int,
    pagina: int,
    por_pagina: int,
    mensaje: str = "Datos obtenidos exitosamente"
) -> tuple:
    """
    Respuesta paginada estándar
    
    Args:
        items: Lista de items de la página actual
        total: Total de items en la base de datos
        pagina: Número de página actual
        por_pagina: Items por página
        mensaje: Mensaje de éxito
    
    Returns:
        Tupla (respuesta_json, codigo_http)
    
    Ejemplo:
        return paginated_response(
            items=lecciones,
            total=total_lecciones,
            pagina=1,
            por_pagina=20
        )
    """
    import math
    
    total_paginas = math.ceil(total / por_pagina) if por_pagina > 0 else 0
    
    response = {
        "success": True,
        "mensaje": mensaje,
        "data": items,
        "paginacion": {
            "pagina_actual": pagina,
            "por_pagina": por_pagina,
            "total_items": total,
            "total_paginas": total_paginas,
            "tiene_siguiente": pagina < total_paginas,
            "tiene_anterior": pagina > 1
        }
    }
    
    return jsonify(response), 200


# Mensajes de error comunes en español
ERROR_MESSAGES = {
    # Autenticación
    "invalid_credentials": "Email o contraseña incorrectos",
    "email_not_verified": "Por favor verifica tu email antes de iniciar sesión",
    "account_inactive": "Tu cuenta está inactiva. Contacta al administrador",
    "token_expired": "Tu sesión ha expirado. Por favor inicia sesión nuevamente",
    "token_invalid": "Token inválido",
    
    # Validación
    "missing_field": "El campo '{field}' es requerido",
    "invalid_email": "El formato del email no es válido",
    "invalid_format": "El formato de '{field}' no es válido",
    "too_short": "'{field}' debe tener al menos {min} caracteres",
    "too_long": "'{field}' no puede tener más de {max} caracteres",
    "invalid_value": "El valor de '{field}' no es válido",
    
    # Recursos
    "not_found": "{resource} no encontrado",
    "already_exists": "{resource} ya existe",
    "cannot_delete": "No se puede eliminar {resource}",
    "cannot_update": "No se puede actualizar {resource}",
    
    # Permisos
    "unauthorized": "No tienes autorización para realizar esta acción",
    "forbidden": "No tienes permisos suficientes",
    
    # Base de datos
    "database_error": "Error al acceder a la base de datos",
    "constraint_violation": "Violación de integridad de datos",
    
    # Archivos
    "file_too_large": "El archivo es demasiado grande. Tamaño máximo: {max_size}",
    "invalid_file_type": "Tipo de archivo no permitido. Tipos válidos: {types}",
    "file_upload_failed": "Error al subir el archivo",
    
    # General
    "internal_error": "Error interno del servidor. Por favor intenta más tarde",
    "service_unavailable": "El servicio no está disponible temporalmente"
}


def get_error_message(key: str, **kwargs) -> str:
    """
    Obtiene un mensaje de error predefinido
    
    Args:
        key: Clave del mensaje
        **kwargs: Variables para formatear el mensaje
    
    Returns:
        Mensaje de error formateado
    
    Ejemplo:
        msg = get_error_message("missing_field", field="titulo")
        # Retorna: "El campo 'titulo' es requerido"
    """
    template = ERROR_MESSAGES.get(key, "Error desconocido")
    try:
        return template.format(**kwargs)
    except KeyError:
        return template