from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import db
from models.usuario import Usuario, PerfilUsuario

usuario_bp = Blueprint("usuario_bp", __name__, url_prefix="/api/usuario")

@usuario_bp.route("/actualizar-nivel", methods=["PATCH"])
def actualizar_nivel():
    """
    Endpoint que actualiza el nivel del usuario
    tras completar el test o elegir manualmente.
    """
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


@usuario_bp.route("/perfil/<int:usuario_id>", methods=["GET"])
@jwt_required()
def obtener_perfil(usuario_id):
    """
    Obtiene el perfil de un usuario por su ID
    """
    try:
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        perfil = PerfilUsuario.query.filter_by(usuario_id=usuario_id).first()
        
        datos_usuario = {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "rol": usuario.rol.value if hasattr(usuario.rol, 'value') else usuario.rol,
            "activo": usuario.activo,
            "verificado": usuario.verificado,
            "creado_en": usuario.creado_en.isoformat() if hasattr(usuario, 'creado_en') else None
        }
        
        if perfil:
            datos_usuario["perfil"] = {
                "nivel_actual": perfil.nivel_actual,
                "puntos": perfil.puntos,
                "racha_dias": perfil.racha_dias,
                "avatar": perfil.avatar,
                "idioma_interfaz": perfil.idioma_interfaz,
                "recibir_notificaciones": perfil.recibir_notificaciones
            }
        
        return jsonify(datos_usuario), 200
        
    except Exception as e:
        return jsonify({"error": f"Error al obtener perfil: {str(e)}"}), 500


@usuario_bp.route("/perfil", methods=["GET"])
@jwt_required()
def obtener_perfil_actual():
    """
    Obtiene el perfil del usuario autenticado
    """
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        perfil = PerfilUsuario.query.filter_by(usuario_id=usuario_id).first()
        
        datos_usuario = {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "rol": usuario.rol.value if hasattr(usuario.rol, 'value') else usuario.rol,
            "activo": usuario.activo,
            "verificado": usuario.verificado,
            "creado_en": usuario.creado_en.isoformat() if hasattr(usuario, 'creado_en') else None
        }
        
        if perfil:
            datos_usuario["perfil"] = {
                "nivel_actual": perfil.nivel_actual,
                "puntos": perfil.puntos,
                "racha_dias": perfil.racha_dias,
                "avatar": perfil.avatar,
                "idioma_interfaz": perfil.idioma_interfaz,
                "recibir_notificaciones": perfil.recibir_notificaciones
            }
        
        return jsonify(datos_usuario), 200
        
    except Exception as e:
        return jsonify({"error": f"Error al obtener perfil: {str(e)}"}), 500