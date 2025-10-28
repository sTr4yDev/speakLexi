"""
Rutas API para gestión de lecciones y actividades - SpeakLexi
Endpoints REST para el módulo de lecciones
"""

from flask import Blueprint, request, jsonify
from services.gestor_lecciones import gestor_lecciones
from functools import wraps

# Crear blueprint
leccion_bp = Blueprint('lecciones', __name__, url_prefix='/api/lecciones')


# ========== DECORADORES ==========

def validar_usuario_id(f):
    """Decorador para validar que exista usuario_id en la sesión/headers"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # TODO: Implementar autenticación real con JWT o sesiones
        # Por ahora asumimos usuario_id = 1 para desarrollo
        usuario_id = request.headers.get('X-User-ID', 1)
        request.usuario_id = int(usuario_id)
        return f(*args, **kwargs)
    return decorated


def validar_permisos_admin(f):
    """Decorador para validar permisos de administrador"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # TODO: Implementar verificación real de roles
        # Por ahora permite todas las operaciones
        return f(*args, **kwargs)
    return decorated


# ========== ENDPOINTS DE LECCIONES ==========

@leccion_bp.route('/', methods=['GET'])
def listar_lecciones():
    """
    GET /api/lecciones
    Lista todas las lecciones con filtros opcionales
    
    Query params:
        - nivel: principiante|intermedio|avanzado
        - idioma: ingles|espanol|etc
        - categoria: vocabulario|gramatica|etc
        - estado: borrador|publicada|archivada
        - buscar: término de búsqueda
        - etiqueta: etiqueta específica
        - pagina: número de página (default: 1)
        - por_pagina: items por página (default: 20)
    """
    try:
        # Obtener parámetros de consulta
        filtros = {
            'nivel': request.args.get('nivel'),
            'idioma': request.args.get('idioma'),
            'categoria': request.args.get('categoria'),
            'estado': request.args.get('estado'),
            'buscar': request.args.get('buscar'),
            'etiqueta': request.args.get('etiqueta')
        }
        
        # Remover valores None
        filtros = {k: v for k, v in filtros.items() if v is not None}
        
        pagina = request.args.get('pagina', 1, type=int)
        por_pagina = request.args.get('por_pagina', 20, type=int)
        
        resultado, codigo = gestor_lecciones.listar_lecciones(
            filtros=filtros,
            pagina=pagina,
            por_pagina=por_pagina
        )
        
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al listar lecciones: {str(e)}"}), 500


@leccion_bp.route('/<int:leccion_id>', methods=['GET'])
def obtener_leccion(leccion_id):
    """
    GET /api/lecciones/<id>
    Obtiene una lección específica
    
    Query params:
        - incluir_actividades: true|false (default: false)
        - incluir_multimedia: true|false (default: false)
    """
    try:
        incluir_actividades = request.args.get('incluir_actividades', 'false').lower() == 'true'
        incluir_multimedia = request.args.get('incluir_multimedia', 'false').lower() == 'true'
        
        resultado, codigo = gestor_lecciones.obtener_leccion(
            leccion_id,
            incluir_actividades=incluir_actividades,
            incluir_multimedia=incluir_multimedia
        )
        
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al obtener lección: {str(e)}"}), 500


@leccion_bp.route('/', methods=['POST'])
@validar_usuario_id
@validar_permisos_admin
def crear_leccion():
    """
    POST /api/lecciones
    Crea una nueva lección
    
    Body JSON:
    {
        "titulo": "string (requerido)",
        "descripcion": "string",
        "contenido": {}, // JSON con contenido estructurado
        "nivel": "principiante|intermedio|avanzado",
        "idioma": "string",
        "categoria": "string",
        "etiquetas": ["tag1", "tag2"],
        "orden": int,
        "requisitos": [id1, id2], // IDs de lecciones previas
        "duracion_estimada": int, // minutos
        "puntos_xp": int
    }
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({"error": "No se proporcionaron datos"}), 400
        
        resultado, codigo = gestor_lecciones.crear_leccion(
            datos,
            request.usuario_id
        )
        
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al crear lección: {str(e)}"}), 500


@leccion_bp.route('/<int:leccion_id>', methods=['PUT', 'PATCH'])
@validar_usuario_id
@validar_permisos_admin
def actualizar_leccion(leccion_id):
    """
    PUT/PATCH /api/lecciones/<id>
    Actualiza una lección existente
    
    Body JSON: Campos a actualizar (mismos que POST)
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({"error": "No se proporcionaron datos"}), 400
        
        resultado, codigo = gestor_lecciones.actualizar_leccion(
            leccion_id,
            datos,
            request.usuario_id
        )
        
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al actualizar lección: {str(e)}"}), 500


@leccion_bp.route('/<int:leccion_id>', methods=['DELETE'])
@validar_usuario_id
@validar_permisos_admin
def eliminar_leccion(leccion_id):
    """
    DELETE /api/lecciones/<id>
    Elimina (archiva) una lección
    """
    try:
        resultado, codigo = gestor_lecciones.eliminar_leccion(
            leccion_id,
            request.usuario_id
        )
        
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al eliminar lección: {str(e)}"}), 500


@leccion_bp.route('/<int:leccion_id>/publicar', methods=['POST'])
@validar_usuario_id
@validar_permisos_admin
def publicar_leccion(leccion_id):
    """
    POST /api/lecciones/<id>/publicar
    Publica una lección (cambia estado de borrador a publicada)
    """
    try:
        resultado, codigo = gestor_lecciones.publicar_leccion(
            leccion_id,
            request.usuario_id
        )
        
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al publicar lección: {str(e)}"}), 500


@leccion_bp.route('/<int:leccion_id>/estadisticas', methods=['GET'])
def obtener_estadisticas_leccion(leccion_id):
    """
    GET /api/lecciones/<id>/estadisticas
    Obtiene estadísticas de una lección
    """
    try:
        resultado, codigo = gestor_lecciones.obtener_estadisticas_leccion(leccion_id)
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al obtener estadísticas: {str(e)}"}), 500


@leccion_bp.route('/nivel/<string:nivel>', methods=['GET'])
def obtener_lecciones_por_nivel(nivel):
    """
    GET /api/lecciones/nivel/<nivel>
    Obtiene lecciones por nivel de dificultad
    
    Query params:
        - idioma: filtro opcional por idioma
    """
    try:
        idioma = request.args.get('idioma')
        resultado, codigo = gestor_lecciones.obtener_lecciones_por_nivel(nivel, idioma)
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al obtener lecciones: {str(e)}"}), 500


# ========== ENDPOINTS DE ACTIVIDADES ==========

@leccion_bp.route('/<int:leccion_id>/actividades', methods=['POST'])
@validar_usuario_id
@validar_permisos_admin
def agregar_actividad(leccion_id):
    """
    POST /api/lecciones/<id>/actividades
    Agrega una actividad a una lección
    
    Body JSON:
    {
        "tipo": "multiple_choice|fill_blank|matching|translation|listen_repeat|true_false|word_order",
        "pregunta": "string (requerido)",
        "instrucciones": "string",
        "opciones": {}, // Estructura varía según tipo
        "respuesta_correcta": {}, // Estructura varía según tipo
        "retroalimentacion": {
            "correcta": "mensaje",
            "incorrecta": "mensaje"
        },
        "pista": "string",
        "puntos": int,
        "orden": int,
        "tiempo_limite": int, // segundos
        "multimedia_id": int
    }
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({"error": "No se proporcionaron datos"}), 400
        
        resultado, codigo = gestor_lecciones.agregar_actividad(leccion_id, datos)
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al agregar actividad: {str(e)}"}), 500


@leccion_bp.route('/<int:leccion_id>/actividades/<int:actividad_id>', methods=['PUT', 'PATCH'])
@validar_usuario_id
@validar_permisos_admin
def actualizar_actividad(leccion_id, actividad_id):
    """
    PUT/PATCH /api/lecciones/<leccion_id>/actividades/<actividad_id>
    Actualiza una actividad
    
    Body JSON: Campos a actualizar (mismos que POST)
    """
    try:
        datos = request.get_json()
        
        if not datos:
            return jsonify({"error": "No se proporcionaron datos"}), 400
        
        resultado, codigo = gestor_lecciones.actualizar_actividad(actividad_id, datos)
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al actualizar actividad: {str(e)}"}), 500


@leccion_bp.route('/<int:leccion_id>/actividades/<int:actividad_id>', methods=['DELETE'])
@validar_usuario_id
@validar_permisos_admin
def eliminar_actividad(leccion_id, actividad_id):
    """
    DELETE /api/lecciones/<leccion_id>/actividades/<actividad_id>
    Elimina una actividad
    """
    try:
        resultado, codigo = gestor_lecciones.eliminar_actividad(actividad_id)
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al eliminar actividad: {str(e)}"}), 500


@leccion_bp.route('/<int:leccion_id>/actividades/<int:actividad_id>/verificar', methods=['POST'])
@validar_usuario_id
def verificar_respuesta(leccion_id, actividad_id):
    """
    POST /api/lecciones/<leccion_id>/actividades/<actividad_id>/verificar
    Verifica la respuesta de un usuario a una actividad
    
    Body JSON:
    {
        "respuesta": <any> // Formato depende del tipo de actividad
    }
    """
    try:
        datos = request.get_json()
        
        if not datos or 'respuesta' not in datos:
            return jsonify({"error": "Debe proporcionar una respuesta"}), 400
        
        resultado, codigo = gestor_lecciones.verificar_respuesta_actividad(
            actividad_id,
            datos['respuesta']
        )
        
        return jsonify(resultado), codigo
        
    except Exception as e:
        return jsonify({"error": f"Error al verificar respuesta: {str(e)}"}), 500


# ========== MANEJO DE ERRORES ==========

@leccion_bp.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Recurso no encontrado"}), 404


@leccion_bp.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Error interno del servidor"}), 500


# ========== INFORMACIÓN DEL BLUEPRINT ==========

@leccion_bp.route('/info', methods=['GET'])
def info():
    """Información sobre los endpoints disponibles"""
    return jsonify({
        "nombre": "API de Lecciones - SpeakLexi",
        "version": "1.0.0",
        "endpoints": {
            "lecciones": {
                "GET /api/lecciones": "Listar lecciones con filtros",
                "GET /api/lecciones/<id>": "Obtener lección específica",
                "POST /api/lecciones": "Crear nueva lección",
                "PUT /api/lecciones/<id>": "Actualizar lección",
                "DELETE /api/lecciones/<id>": "Eliminar lección",
                "POST /api/lecciones/<id>/publicar": "Publicar lección",
                "GET /api/lecciones/<id>/estadisticas": "Estadísticas de lección",
                "GET /api/lecciones/nivel/<nivel>": "Lecciones por nivel"
            },
            "actividades": {
                "POST /api/lecciones/<id>/actividades": "Agregar actividad",
                "PUT /api/lecciones/<id>/actividades/<aid>": "Actualizar actividad",
                "DELETE /api/lecciones/<id>/actividades/<aid>": "Eliminar actividad",
                "POST /api/lecciones/<id>/actividades/<aid>/verificar": "Verificar respuesta"
            }
        }
    }), 200