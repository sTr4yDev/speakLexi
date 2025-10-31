from flask import Blueprint, request, jsonify
from models.usuario import Usuario
from flask_jwt_extended import create_access_token, create_refresh_token
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
@auth_bp.route("/registro", methods=["POST"])  # ✅ Cambiado a español
def registrar():
    """Registra un nuevo usuario (asume rol 'estudiante' por defecto)"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se recibieron datos JSON"}), 400

    nombre = data.get("nombre")
    primer_apellido = data.get("primer_apellido")
    segundo_apellido = data.get("segundo_apellido")
    correo = data.get("correo")
    password = data.get("password")
    # Datos opcionales para perfil estudiante
    idioma = data.get("idioma", "Inglés")
    nivel_actual = data.get("nivel_actual", "A1")
    
    # 🆕 Capturar el rol si viene (para desarrollo)
    rol = data.get("rol", "estudiante")

    # Validación básica
    campos_obligatorios = {
        'nombre': nombre,
        'primer_apellido': primer_apellido,
        'correo': correo,
        'password': password
    }
    campos_faltantes = [k for k, v in campos_obligatorios.items() if not v]
    if campos_faltantes:
        return jsonify({
            "error": f"Faltan datos obligatorios: {', '.join(campos_faltantes)}"
        }), 400

    # Validar longitud de contraseña
    if len(password) < 8:
        return jsonify({
            "error": "La contraseña debe tener al menos 8 caracteres"
        }), 400

    # Llamar al gestor para registrar
    try:
        respuesta, codigo = gestor.registrar_usuario(
            nombre, primer_apellido, segundo_apellido,
            correo, password,
            rol=rol,  # Pasar el rol
            datos_perfil={
                'idioma_aprendizaje': idioma,
                'nivel_actual': nivel_actual
            }
        )
        return jsonify(respuesta), codigo
    except Exception as e:
        print(f"❌ Error en registro: {str(e)}")
        return jsonify({
            "error": f"Error al registrar usuario: {str(e)}"
        }), 500

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
    """Inicia sesión, devuelve datos del usuario, perfil específico y token JWT"""
    data = request.get_json()
    correo = data.get("correo")
    password = data.get("password")

    if not correo or not password:
        return jsonify({"error": "Faltan credenciales (correo y contraseña)"}), 400

    # Autenticar usando el gestor
    respuesta_auth, codigo_auth = gestor.autenticar_usuario(correo, password)

    # --- MANEJO DE ERRORES DE AUTENTICACIÓN ---
    if codigo_auth != 200:
        # Si la cuenta está desactivada, añadir ID si es posible
        if codigo_auth == 403 and respuesta_auth.get("codigo") == "CUENTA_DESACTIVADA":
            try:
                usuario_desactivado = Usuario.query.filter_by(correo=correo).first()
                if usuario_desactivado:
                    respuesta_auth["usuario_id"] = usuario_desactivado.id
            except Exception as e:
                print(f"⚠️ Error al buscar ID de usuario desactivado {correo}: {e}")
                pass
        return jsonify(respuesta_auth), codigo_auth

    # --- LOGIN EXITOSO: Generar Token y Devolver Datos Completos ---
    try:
        usuario_data_completa = respuesta_auth.get('usuario')
        if not usuario_data_completa or 'id' not in usuario_data_completa:
            print(f"❌ Error crítico: Gestor.autenticar_usuario no devolvió 'usuario' con 'id'")
            return jsonify({
                "error": "Error interno del servidor al procesar la autenticación"
            }), 500

        usuario_id = usuario_data_completa['id']

        # Crear tokens JWT
        access_token = create_access_token(identity=str(usuario_id))
        refresh_token = create_refresh_token(identity=str(usuario_id))

        # Construir la respuesta final
        respuesta_final = {
            "mensaje": "Inicio de sesión exitoso",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "usuario": usuario_data_completa
        }

        return jsonify(respuesta_final), 200

    except Exception as e:
        print(f"❌ Error inesperado durante la generación del token: {e}")
        return jsonify({
            "error": f"Error interno del servidor: {str(e)}"
        }), 500

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