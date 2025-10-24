from flask import Blueprint, request, jsonify
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
