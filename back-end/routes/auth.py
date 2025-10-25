from flask import Blueprint, request, jsonify
from services.gestor_usuarios import GestorUsuarios

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# ✅ Manejo de preflight requests (CORS)
@auth_bp.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return "", 204


@auth_bp.route("/login", methods=["POST"])
def login():
    """Endpoint de inicio de sesión"""
    data = request.get_json()
    correo = data.get("correo")
    password = data.get("password")

    if not correo or not password:
        return jsonify({"error": "Correo y contraseña son requeridos"}), 400

    gestor = GestorUsuarios()
    respuesta, codigo = gestor.autenticar_usuario(correo, password)
    
    # ✅ Asegurarnos de que siempre devuelva el usuario_id
    # incluso cuando la cuenta está desactivada
    if codigo in [403] and respuesta.get("codigo") == "CUENTA_DESACTIVADA":
        from models.usuario import Usuario
        usuario = Usuario.query.filter_by(correo=correo).first()
        if usuario:
            respuesta["usuario_id"] = usuario.id
    
    return jsonify(respuesta), codigo


@auth_bp.route("/register", methods=["POST"])
def registro():
    """Endpoint de registro de usuario"""
    data = request.get_json()
    
    nombre = data.get("nombre")
    primer_apellido = data.get("primer_apellido")
    segundo_apellido = data.get("segundo_apellido")
    correo = data.get("correo")
    password = data.get("password")
    idioma = data.get("idioma", "Inglés")
    nivel_actual = data.get("nivel_actual", "A1")

    if not all([nombre, primer_apellido, correo, password]):
        return jsonify({"error": "Datos incompletos"}), 400

    gestor = GestorUsuarios()
    respuesta, codigo = gestor.registrar_usuario(
        nombre, primer_apellido, segundo_apellido, 
        correo, password, idioma, nivel_actual
    )
    
    return jsonify(respuesta), codigo


@auth_bp.route("/verificar-email", methods=["POST"])
def verificar_email():
    """Endpoint para verificar correo electrónico"""
    data = request.get_json()
    correo = data.get("correo")
    codigo = data.get("codigo")

    if not correo or not codigo:
        return jsonify({"error": "Correo y código son requeridos"}), 400

    gestor = GestorUsuarios()
    respuesta, status = gestor.verificar_correo(correo, codigo)
    
    return jsonify(respuesta), status


@auth_bp.route("/reenviar-codigo", methods=["POST"])
def reenviar_codigo():
    """Endpoint para reenviar código de verificación"""
    data = request.get_json()
    correo = data.get("correo")

    if not correo:
        return jsonify({"error": "Correo es requerido"}), 400

    gestor = GestorUsuarios()
    respuesta, status = gestor.reenviar_codigo(correo)
    
    return jsonify(respuesta), status


# ========================================
# RECUPERACIÓN DE CONTRASEÑA
# ========================================

@auth_bp.route("/recuperar-password", methods=["POST"])
def recuperar_password():
    """Solicita recuperación de contraseña"""
    data = request.get_json()
    correo = data.get("correo")
    
    if not correo:
        return jsonify({"error": "Correo es requerido"}), 400
    
    gestor = GestorUsuarios()
    respuesta, codigo = gestor.solicitar_recuperacion_password(correo)
    
    return jsonify(respuesta), codigo


@auth_bp.route("/validar-token-recuperacion", methods=["POST"])
def validar_token():
    """Valida un token de recuperación"""
    data = request.get_json()
    token = data.get("token")
    
    if not token:
        return jsonify({"error": "Token es requerido"}), 400
    
    gestor = GestorUsuarios()
    respuesta, codigo = gestor.validar_token_recuperacion(token)
    
    return jsonify(respuesta), codigo


@auth_bp.route("/restablecer-password", methods=["POST"])
def restablecer_password():
    """Restablece la contraseña con el token"""
    data = request.get_json()
    token = data.get("token")
    nueva_password = data.get("nueva_password")
    
    if not token or not nueva_password:
        return jsonify({"error": "Token y nueva contraseña son requeridos"}), 400
    
    if len(nueva_password) < 8:
        return jsonify({"error": "La contraseña debe tener al menos 8 caracteres"}), 400
    
    gestor = GestorUsuarios()
    respuesta, codigo = gestor.restablecer_password(token, nueva_password)
    
    return jsonify(respuesta), codigo