from flask import Blueprint, request, jsonify
from services.gestor_usuarios import GestorUsuarios

# ========================================
# BLUEPRINT DE AUTENTICACIÓN
# ========================================
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
gestor = GestorUsuarios()

# ========================================
# MANEJO DE PREFLIGHT REQUESTS (CORS)
# ========================================
@auth_bp.before_request
def handle_preflight():
    """Permite manejar solicitudes OPTIONS de CORS"""
    if request.method == "OPTIONS":
        return "", 204


# ========================================
# REGISTRO Y VERIFICACIÓN
# ========================================

@auth_bp.route("/register", methods=["POST"])
def registrar():
    """Registra un nuevo usuario"""
    data = request.get_json()

    nombre = data.get("nombre")
    primer_apellido = data.get("primer_apellido")
    segundo_apellido = data.get("segundo_apellido")
    correo = data.get("correo")
    password = data.get("password")
    idioma = data.get("idioma", "Inglés")
    nivel_actual = data.get("nivel_actual", "A1")

    if not all([nombre, primer_apellido, correo, password]):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    # Solo inglés está disponible por ahora
    if idioma.lower() != "inglés":
        return jsonify({
            "mensaje": f"El curso de {idioma.capitalize()} está en desarrollo. Actualmente solo está disponible el curso de Inglés."
        }), 200

    respuesta, codigo = gestor.registrar_usuario(
        nombre, primer_apellido, segundo_apellido,
        correo, password, idioma, nivel_actual
    )
    return jsonify(respuesta), codigo


@auth_bp.route("/verificar-email", methods=["POST"])
def verificar_email():
    """Verifica el correo con código de 6 dígitos"""
    data = request.get_json()
    correo = data.get("correo")
    codigo = data.get("codigo")

    if not correo or not codigo:
        return jsonify({"error": "Correo y código son requeridos"}), 400

    respuesta, codigo_http = gestor.verificar_correo(correo, codigo)
    return jsonify(respuesta), codigo_http


@auth_bp.route("/reenviar-codigo", methods=["POST"])
def reenviar_codigo():
    """Reenvía el código de verificación"""
    data = request.get_json()
    correo = data.get("correo")

    if not correo:
        return jsonify({"error": "Correo requerido"}), 400

    respuesta, codigo_http = gestor.reenviar_codigo(correo)
    return jsonify(respuesta), codigo_http


# ========================================
# AUTENTICACIÓN
# ========================================

@auth_bp.route("/login", methods=["POST"])
def login():
    """Inicia sesión y devuelve datos del usuario"""
    data = request.get_json()
    correo = data.get("correo")
    password = data.get("password")
    
    if not correo or not password:
        return jsonify({"error": "Faltan credenciales"}), 400
    
    respuesta, codigo = gestor.autenticar_usuario(correo, password)

    # ✅ Si la cuenta está desactivada, devolver también el ID del usuario
    if codigo == 403 and respuesta.get("codigo") == "CUENTA_DESACTIVADA":
        try:
            from models.usuario import Usuario
            usuario = Usuario.query.filter_by(correo=correo).first()
            if usuario:
                respuesta["usuario_id"] = usuario.id
        except Exception:
            pass

    return jsonify(respuesta), codigo


# ========================================
# PERFIL DE USUARIO
# ========================================

@auth_bp.route("/perfil/<int:id_usuario>", methods=["GET"])
def obtener_perfil(id_usuario):
    """Obtiene el perfil completo del usuario"""
    print(f"📡 Solicitando perfil del usuario ID: {id_usuario}")
    respuesta, codigo = gestor.obtener_perfil(id_usuario)
    return jsonify(respuesta), codigo


# ========================================
# RECUPERACIÓN DE CONTRASEÑA
# ========================================

@auth_bp.route("/recuperar-password", methods=["POST"])
def recuperar_password():
    """Inicia el proceso de recuperación de contraseña"""
    data = request.get_json()
    correo = data.get("correo")
    
    if not correo:
        return jsonify({"error": "Correo requerido"}), 400
    
    respuesta, codigo = gestor.solicitar_recuperacion_password(correo)
    return jsonify(respuesta), codigo


@auth_bp.route("/validar-token-recuperacion", methods=["POST"])
def validar_token():
    """Valida que el token de recuperación sea válido"""
    data = request.get_json()
    token = data.get("token")
    
    if not token:
        return jsonify({"error": "Token requerido"}), 400
    
    respuesta, codigo = gestor.validar_token_recuperacion(token)
    return jsonify(respuesta), codigo


@auth_bp.route("/restablecer-password", methods=["POST"])
def restablecer_password():
    """Restablece la contraseña usando el token"""
    data = request.get_json()
    token = data.get("token")
    nueva_password = data.get("nueva_password")
    
    if not token or not nueva_password:
        return jsonify({"error": "Token y nueva contraseña son requeridos"}), 400
    
    # ✅ Validación mínima de longitud
    if len(nueva_password) < 8:
        return jsonify({"error": "La contraseña debe tener al menos 8 caracteres"}), 400
    
    respuesta, codigo = gestor.restablecer_password(token, nueva_password)
    return jsonify(respuesta), codigo


# ========================================
# RUTA DE PRUEBA
# ========================================

@auth_bp.route("/test", methods=["GET"])
def test():
    """Ruta de prueba para verificar que el blueprint funciona"""
    return jsonify({"mensaje": "Blueprint de auth funcionando correctamente"}), 200
