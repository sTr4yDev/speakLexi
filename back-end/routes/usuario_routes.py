from flask import Blueprint, request, jsonify
# IMPORTACIÓN CORREGIDA/NECESARIA
from flask_jwt_extended import jwt_required, get_jwt_identity 
from config.database import db
from models.usuario import Usuario, PerfilUsuario

# Crear el Blueprint para las rutas de usuario
usuario_bp = Blueprint("usuario_bp", __name__, url_prefix="/api/usuario")

# ========================================
# ACTUALIZAR NIVEL (RUTA PÚBLICA o PROTEGIDA?)
# ========================================
# NOTA: Esta ruta actualmente NO está protegida por @jwt_required().
# Si debería estarlo, simplemente descomenta la línea @jwt_required() debajo.
@usuario_bp.route("/actualizar-nivel", methods=["PATCH"])
# @jwt_required() # <--- Descomenta si esta ruta requiere autenticación
def actualizar_nivel():
    """
    Endpoint que actualiza el nivel del usuario
    tras completar el test o elegir manualmente.
    """
    data = request.get_json()
    correo = data.get("correo") # Considera usar get_jwt_identity() si proteges la ruta
    nuevo_nivel = data.get("nivel")

    if not correo or not nuevo_nivel:
        return jsonify({"error": "Datos insuficientes (correo y nivel requeridos)"}), 400

    # Busca al usuario por correo
    usuario = Usuario.query.filter_by(correo=correo).first()
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # Busca el perfil asociado al usuario
    perfil = PerfilUsuario.query.filter_by(usuario_id=usuario.id).first()
    if not perfil:
        # Podrías considerar crear un perfil si no existe, o devolver error
        return jsonify({"error": "Perfil de usuario no encontrado"}), 404

    # Actualiza el nivel y guarda en la base de datos
    perfil.nivel_actual = nuevo_nivel
    try:
        db.session.commit()
        return jsonify({
            "mensaje": f"Nivel actualizado correctamente a {nuevo_nivel}",
            "nivel": nuevo_nivel
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al actualizar nivel para {correo}: {e}") # Log del error
        return jsonify({"error": "Error al guardar cambios en la base de datos"}), 500

# ========================================
# OBTENER PERFIL POR ID (RUTA PROTEGIDA)
# ========================================
@usuario_bp.route("/perfil/<int:usuario_id>", methods=["GET"])
@jwt_required() # <-- Requiere un token JWT válido
def obtener_perfil_por_id(usuario_id):
    """
    Obtiene el perfil completo de un usuario específico por su ID.
    Accesible solo para usuarios autenticados.
    """
    # Opcional: Podrías verificar si el usuario autenticado tiene permiso
    # para ver este perfil específico (ej. si es admin o el mismo usuario)
    # current_user_identity = get_jwt_identity() # Devuelve string (por el loader) o int
    # try:
    #     current_user_id = int(current_user_identity)
    # except (ValueError, TypeError):
    #     return jsonify({"error": "Token inválido"}), 400
    #
    # if current_user_id != usuario_id and not es_admin(current_user_id):
    #     return jsonify({"error": "No autorizado para ver este perfil"}), 403

    try:
        # Busca el usuario por ID
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        # Busca el perfil asociado (usando la relación es más eficiente)
        perfil = usuario.perfil
        # Si el perfil es obligatorio y no existe, devolver 404
        if not perfil:
             return jsonify({"error": "Perfil de usuario no encontrado"}), 404
             
        # Construye la respuesta con datos del usuario y del perfil
        datos_respuesta = {
            # Datos del modelo Usuario
            "id": usuario.id,
            "id_publico": usuario.id_publico,
            "nombre": usuario.nombre,
            "primer_apellido": usuario.primer_apellido,
            "segundo_apellido": usuario.segundo_apellido,
            "correo": usuario.correo,
            "rol": usuario.rol, 
            "correo_verificado": usuario.correo_verificado,
            "estado_cuenta": usuario.estado_cuenta,
            "creado_en": usuario.creado_en.isoformat() if usuario.creado_en else None,
            "actualizado_en": usuario.actualizado_en.isoformat() if usuario.actualizado_en else None,
            "perfil": { # Datos del modelo PerfilUsuario
                "nombre_completo": perfil.nombre_completo,
                "idioma": perfil.idioma,
                "nivel_actual": perfil.nivel_actual,
                "curso_actual": perfil.curso_actual,
                "total_xp": perfil.total_xp,
                "dias_racha": perfil.dias_racha,
                "ultima_actividad": perfil.ultima_actividad.isoformat() if perfil.ultima_actividad else None,
                # Añade otros campos del PerfilUsuario que necesites
                # "avatar_url": perfil.avatar_url 
            }
        }
            
        return jsonify(datos_respuesta), 200
        
    except Exception as e:
        print(f"❌ Error en obtener_perfil_por_id ({usuario_id}): {e}") # Log del error
        return jsonify({"error": "Error interno al obtener el perfil"}), 500

# ========================================
# OBTENER PERFIL DEL USUARIO ACTUAL (RUTA PROTEGIDA) - CORREGIDO
# ========================================
@usuario_bp.route("/perfil", methods=["GET"])
@jwt_required() # <-- Requiere un token JWT válido
def obtener_perfil_actual():
    """
    Obtiene el perfil completo del usuario actualmente autenticado 
    (basado en el token JWT).
    """
    # --- INICIO DE LA CORRECCIÓN ---
    try:
        # Obtiene la identidad del token (puede ser string o int dependiendo del loader)
        identity = get_jwt_identity()
        
        # Intenta convertir la identidad a entero para usarla como ID
        usuario_id_actual = int(identity)
        
        # Llama a la función que obtiene el perfil por ID
        return obtener_perfil_por_id(usuario_id_actual)
        
    except (ValueError, TypeError):
        # Si la identidad no se puede convertir a int, el token es inválido
        print(f"⚠️ Error: Token contenía identidad no numérica: {identity}")
        return jsonify({"error": "Token inválido: Identificador de usuario no válido"}), 400 # 400 Bad Request
    except Exception as e:
        # Captura cualquier otro error inesperado
        print(f"❌ Error inesperado en obtener_perfil_actual: {e}") 
        return jsonify({"error": "Error interno al procesar la solicitud de perfil"}), 500
    # --- FIN DE LA CORRECCIÓN ---

# ========================================
# OTRAS RUTAS DE USUARIO (Ejemplos, ajustar según necesidad)
# ========================================

# @usuario_bp.route("/perfil", methods=["PUT"])
# @jwt_required()
# def actualizar_perfil_actual():
#     """ Actualiza el perfil del usuario autenticado """
#     try:
#         identity = get_jwt_identity()
#         usuario_id = int(identity)
#         data = request.get_json()
#         # ... Lógica para buscar usuario/perfil y actualizar con 'data' ...
#         # ... db.session.commit() ...
#         return jsonify({"mensaje": "Perfil actualizado"}), 200
#     except (ValueError, TypeError):
#          return jsonify({"error": "Token inválido"}), 400
#     except Exception as e:
#          db.session.rollback()
#          print(f"Error al actualizar perfil {usuario_id}: {e}")
#          return jsonify({"error": "Error interno al actualizar perfil"}), 500

# @usuario_bp.route("/desactivar", methods=["POST"]) # O DELETE?
# @jwt_required()
# def desactivar_cuenta_actual():
#     """ Desactiva (soft delete) la cuenta del usuario autenticado """
#     try:
#         identity = get_jwt_identity()
#         usuario_id = int(identity)
#         data = request.get_json()
#         password = data.get("password")
#         if not password:
#             return jsonify({"error": "Contraseña requerida para desactivar"}), 400
#         # ... Usar GestorUsuarios.desactivar_cuenta(usuario_id, password) ...
#         # respuesta, codigo = gestor.desactivar_cuenta(usuario_id, password)
#         # return jsonify(respuesta), codigo
#         return jsonify({"mensaje": "Ruta de desactivación pendiente"}), 501 # Not Implemented
#     except (ValueError, TypeError):
#          return jsonify({"error": "Token inválido"}), 400
#     except Exception as e:
#          print(f"Error al desactivar cuenta {usuario_id}: {e}")
#          return jsonify({"error": "Error interno al desactivar cuenta"}), 500

# Considera si /reactivar necesita JWT o no (probablemente no)

# @usuario_bp.route("/cambiar-curso", methods=["PATCH"])
# @jwt_required()
# def cambiar_curso_actual():
#     """ Cambia el idioma/nivel del usuario autenticado """
#     try:
#         identity = get_jwt_identity()
#         usuario_id = int(identity)
#         data = request.get_json()
#         idioma = data.get("idioma")
#         nivel = data.get("nivel") # Opcional?
#         if not idioma:
#              return jsonify({"error": "Nuevo idioma requerido"}), 400
#         # ... Usar GestorUsuarios.cambiar_curso(usuario_id, idioma, nivel) ...
#         # respuesta, codigo = gestor.cambiar_curso(usuario_id, idioma, nivel)
#         # return jsonify(respuesta), codigo
#         return jsonify({"mensaje": "Ruta de cambio de curso pendiente"}), 501 # Not Implemented
#     except (ValueError, TypeError):
#          return jsonify({"error": "Token inválido"}), 400
#     except Exception as e:
#          db.session.rollback() # Si cambiar_curso hace commit
#          print(f"Error al cambiar curso para {usuario_id}: {e}")
#          return jsonify({"error": "Error interno al cambiar curso"}), 500

