from flask import Blueprint, request, jsonify
from config.database import db
from models.usuario import Usuario, PerfilUsuario
from werkzeug.security import check_password_hash

usuario_bp = Blueprint("usuario_bp", __name__, url_prefix="/api/usuario")

@usuario_bp.route("/perfil/<int:usuario_id>", methods=["GET"])
def obtener_perfil(usuario_id):
    """Obtiene el perfil completo del usuario"""
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    perfil = usuario.perfil
    if not perfil:
        return jsonify({"error": "Perfil no encontrado"}), 404
    
    return jsonify({
        "usuario": {
            "id": usuario.id,
            "id_publico": usuario.id_publico,
            "nombre": usuario.nombre,
            "primer_apellido": usuario.primer_apellido,
            "segundo_apellido": usuario.segundo_apellido,
            "correo": usuario.correo,
            "rol": usuario.rol,
            "correo_verificado": usuario.correo_verificado,
            "creado_en": usuario.creado_en.isoformat() if usuario.creado_en else None
        },
        "perfil": {
            "nombre_completo": perfil.nombre_completo,
            "idioma": perfil.idioma,
            "nivel_actual": perfil.nivel_actual,
            "curso_actual": perfil.curso_actual,
            "total_xp": perfil.total_xp,
            "dias_racha": perfil.dias_racha,
            "ultima_actividad": perfil.ultima_actividad.isoformat() if perfil.ultima_actividad else None
        }
    }), 200


@usuario_bp.route("/perfil/<int:usuario_id>", methods=["PUT"])
def actualizar_perfil(usuario_id):
    """Actualiza la información del perfil del usuario"""
    data = request.get_json()
    
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    perfil = usuario.perfil
    if not perfil:
        return jsonify({"error": "Perfil no encontrado"}), 404
    
    # Actualizar campos del usuario
    if "nombre" in data:
        usuario.nombre = data["nombre"]
    if "primer_apellido" in data:
        usuario.primer_apellido = data["primer_apellido"]
    if "segundo_apellido" in data:
        usuario.segundo_apellido = data["segundo_apellido"]
    
    # Actualizar correo solo si es diferente y no existe
    if "correo" in data and data["correo"] != usuario.correo:
        correo_existente = Usuario.query.filter_by(correo=data["correo"]).first()
        if correo_existente:
            return jsonify({"error": "El correo electrónico ya está registrado"}), 400
        usuario.correo = data["correo"]
        usuario.correo_verificado = False  # Requiere nueva verificación
    
    # Actualizar nombre completo en perfil
    if any(k in data for k in ["nombre", "primer_apellido", "segundo_apellido"]):
        nombre_completo = f"{usuario.nombre} {usuario.primer_apellido} {usuario.segundo_apellido or ''}".strip()
        perfil.nombre_completo = nombre_completo
    
    try:
        db.session.commit()
        return jsonify({
            "mensaje": "Perfil actualizado correctamente",
            "usuario": {
                "id": usuario.id,
                "nombre": usuario.nombre,
                "primer_apellido": usuario.primer_apellido,
                "segundo_apellido": usuario.segundo_apellido,
                "correo": usuario.correo,
                "rol": usuario.rol
            },
            "perfil": {
                "nombre_completo": perfil.nombre_completo,
                "idioma": perfil.idioma,
                "nivel_actual": perfil.nivel_actual
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al actualizar: {str(e)}"}), 500


@usuario_bp.route("/eliminar/<int:usuario_id>", methods=["DELETE"])
def eliminar_cuenta(usuario_id):
    """Elimina la cuenta del usuario (requiere confirmación de contraseña)"""
    data = request.get_json()
    password = data.get("password")
    
    if not password:
        return jsonify({"error": "Se requiere la contraseña para confirmar"}), 400
    
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    # Verificar contraseña
    if not usuario.check_password(password):
        return jsonify({"error": "Contraseña incorrecta"}), 401
    
    try:
        # El perfil se elimina automáticamente por cascade
        db.session.delete(usuario)
        db.session.commit()
        return jsonify({"mensaje": "Cuenta eliminada correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al eliminar: {str(e)}"}), 500


@usuario_bp.route("/actualizar-nivel", methods=["PATCH"])
def actualizar_nivel():
    """Actualiza el nivel del usuario tras completar el test"""
    data = request.get_json()
    correo = data.get("correo")
    nuevo_nivel = data.get("nivel")

    if not correo or not nuevo_nivel:
        return jsonify({"error": "Datos insuficientes"}), 400

    usuario = Usuario.query.filter_by(correo=correo).first()
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    perfil = PerfilUsuario.query.filter_by(usuario_id=usuario.id).first()
    if not perfil:
        return jsonify({"error": "Perfil no encontrado"}), 404

    perfil.nivel_actual = nuevo_nivel
    db.session.commit()

    return jsonify({
        "mensaje": f"Nivel actualizado correctamente a {nuevo_nivel}",
        "nivel": nuevo_nivel
    }), 200


@usuario_bp.route("/cambiar-curso", methods=["PATCH"])
def cambiar_curso():
    """Cambia el curso/idioma del usuario"""
    data = request.get_json()
    usuario_id = data.get("usuario_id")
    nuevo_idioma = data.get("idioma")
    nuevo_nivel = data.get("nivel", "A1")  # Nivel por defecto al cambiar
    
    if not usuario_id or not nuevo_idioma:
        return jsonify({"error": "Datos insuficientes"}), 400
    
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404
    
    perfil = usuario.perfil
    if not perfil:
        return jsonify({"error": "Perfil no encontrado"}), 404
    
    # Validar que el idioma esté disponible
    idiomas_disponibles = ["Inglés"]  # Por ahora solo inglés
    if nuevo_idioma not in idiomas_disponibles:
        return jsonify({
            "error": f"El curso de {nuevo_idioma} está en desarrollo",
            "disponibles": idiomas_disponibles
        }), 400
    
    perfil.idioma = nuevo_idioma
    perfil.nivel_actual = nuevo_nivel
    # Reiniciar progreso al cambiar de curso
    perfil.total_xp = 0
    perfil.dias_racha = 0
    
    db.session.commit()
    
    return jsonify({
        "mensaje": f"Curso cambiado a {nuevo_idioma}",
        "idioma": nuevo_idioma,
        "nivel": nuevo_nivel
    }), 200