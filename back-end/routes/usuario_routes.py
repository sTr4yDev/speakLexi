from flask import Blueprint, request, jsonify
from config.database import db
from models.usuario import Usuario, PerfilUsuario
from services.gestor_usuarios import GestorUsuarios

usuario_bp = Blueprint("usuario_bp", __name__, url_prefix="/api/usuario")

# ✅ Manejo de solicitudes preflight (CORS)
@usuario_bp.before_request
def handle_preflight():
    """Permite las peticiones OPTIONS para CORS"""
    if request.method == "OPTIONS":
        return "", 204


# 🧠 PERFIL DE USUARIO ----------------------------------------------------------

@usuario_bp.route("/perfil/<int:usuario_id>", methods=["GET"])
def obtener_perfil(usuario_id):
    """Obtiene el perfil completo del usuario"""
    gestor = GestorUsuarios()
    respuesta, codigo = gestor.obtener_perfil(usuario_id)
    return jsonify(respuesta), codigo


@usuario_bp.route("/perfil/<int:usuario_id>", methods=["PUT"])
def actualizar_perfil(usuario_id):
    """Actualiza los datos personales del perfil del usuario"""
    data = request.get_json()

    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    perfil = usuario.perfil
    if not perfil:
        return jsonify({"error": "Perfil no encontrado"}), 404

    # Actualizar campos básicos del usuario
    if "nombre" in data:
        usuario.nombre = data["nombre"]
    if "primer_apellido" in data:
        usuario.primer_apellido = data["primer_apellido"]
    if "segundo_apellido" in data:
        usuario.segundo_apellido = data["segundo_apellido"]

    # Actualizar correo si es diferente
    if "correo" in data and data["correo"] != usuario.correo:
        existente = Usuario.query.filter_by(correo=data["correo"]).first()
        if existente:
            return jsonify({"error": "El correo electrónico ya está registrado"}), 400
        usuario.correo = data["correo"]
        usuario.correo_verificado = False

    # Actualizar nombre completo en el perfil
    if any(k in data for k in ["nombre", "primer_apellido", "segundo_apellido"]):
        perfil.nombre_completo = f"{usuario.nombre} {usuario.primer_apellido} {usuario.segundo_apellido or ''}".strip()

    try:
        db.session.commit()
        print(f"✅ Perfil actualizado para usuario ID: {usuario_id}")
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
        print(f"❌ Error al actualizar perfil: {e}")
        return jsonify({"error": f"Error al actualizar: {str(e)}"}), 500


# 🧩 CURSO / NIVEL --------------------------------------------------------------

@usuario_bp.route("/actualizar-nivel", methods=["PATCH"])
def actualizar_nivel():
    """Actualiza el nivel del usuario después del test o asignación manual"""
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

    print(f"✅ Nivel actualizado para {correo}: {nuevo_nivel}")

    return jsonify({
        "mensaje": f"Nivel actualizado correctamente a {nuevo_nivel}",
        "nivel": nuevo_nivel
    }), 200


@usuario_bp.route("/cambiar-curso", methods=["PATCH"])
def cambiar_curso():
    """Cambia el idioma y/o nivel actual del usuario"""
    data = request.get_json()
    usuario_id = data.get("usuario_id")
    nuevo_idioma = data.get("idioma")
    nuevo_nivel = data.get("nivel")

    if not usuario_id:
        return jsonify({"error": "Falta el ID del usuario"}), 400
    
    if not nuevo_idioma:
        return jsonify({"error": "Falta el idioma"}), 400

    # ✅ Llamar al método con los parámetros correctos
    gestor = GestorUsuarios()
    respuesta, codigo = gestor.cambiar_curso(
        usuario_id,
        nuevo_idioma=nuevo_idioma,
        nuevo_nivel=nuevo_nivel
    )
    return jsonify(respuesta), codigo


# 🧱 CUENTAS --------------------------------------------------------------------

@usuario_bp.route("/desactivar/<int:usuario_id>", methods=["POST"])
def desactivar_cuenta(usuario_id):
    """Desactiva la cuenta del usuario (soft delete)"""
    gestor = GestorUsuarios()

    data = request.get_json()
    password = data.get("password")
    confirmacion = data.get("confirmacion")

    if not password:
        return jsonify({"error": "Se requiere la contraseña"}), 400
    if confirmacion != "ELIMINAR":
        return jsonify({"error": "Debes escribir ELIMINAR para confirmar"}), 400

    respuesta, codigo = gestor.desactivar_cuenta(usuario_id, password)
    return jsonify(respuesta), codigo


@usuario_bp.route("/reactivar/<int:usuario_id>", methods=["POST"])
def reactivar_cuenta(usuario_id):
    """Reactiva una cuenta desactivada"""
    gestor = GestorUsuarios()

    data = request.get_json()
    password = data.get("password")

    if not password:
        return jsonify({"error": "Se requiere la contraseña"}), 400

    respuesta, codigo = gestor.reactivar_cuenta(usuario_id, password)
    return jsonify(respuesta), codigo


@usuario_bp.route("/eliminar-permanente/<int:usuario_id>", methods=["DELETE"])
def eliminar_permanente(usuario_id):
    """Elimina definitivamente una cuenta (solo admin o cron job)"""
    gestor = GestorUsuarios()
    # TODO: verificar permisos admin antes de eliminar
    respuesta, codigo = gestor.eliminar_cuenta_permanente(usuario_id)
    return jsonify(respuesta), codigo
