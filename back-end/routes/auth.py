from flask import Blueprint, request, jsonify
from services.gestor_usuarios import GestorUsuarios

# Cambiar el nombre del blueprint para que no colisione
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

gestor = GestorUsuarios()

@auth_bp.route("/register", methods=["POST"])
def registrar():
    data = request.get_json()
    nombre = data.get("nombre")
    primer_apellido = data.get("primer_apellido")
    segundo_apellido = data.get("segundo_apellido")
    correo = data.get("correo")
    password = data.get("password")
    idioma = data.get("idioma")
    nivel_actual = data.get("nivel_actual")

    if not all([nombre, primer_apellido, correo, password, idioma]):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    # Solo inglés está disponible por ahora
    if idioma.lower() != "inglés":
        return jsonify({
            "mensaje": f"El curso de {idioma.capitalize()} está en desarrollo. Actualmente solo está disponible el curso de Inglés."
        }), 200

    respuesta, codigo = gestor.registrar_usuario(
        nombre, primer_apellido, segundo_apellido, correo, password, idioma, nivel_actual
    )
    return jsonify(respuesta), codigo


@auth_bp.route("/verificar-email", methods=["POST"])
def verificar_email():
    data = request.get_json()
    correo = data.get("correo")
    codigo = data.get("codigo")
    respuesta, codigo_http = gestor.verificar_correo(correo, codigo)
    return jsonify(respuesta), codigo_http


@auth_bp.route("/reenviar-codigo", methods=["POST"])
def reenviar_codigo():
    data = request.get_json()
    correo = data.get("correo")
    respuesta, codigo_http = gestor.reenviar_codigo(correo)
    return jsonify(respuesta), codigo_http


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    correo = data.get("correo")
    password = data.get("password")
    respuesta, codigo = gestor.autenticar_usuario(correo, password)
    return jsonify(respuesta), codigo


@auth_bp.route("/perfil/<int:id_usuario>", methods=["GET"])
def perfil(id_usuario):
    respuesta, codigo = gestor.obtener_perfil(id_usuario)
    return jsonify(respuesta), codigo
