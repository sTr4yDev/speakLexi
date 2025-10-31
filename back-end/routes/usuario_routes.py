from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity 
from config.database import db
from models.usuario import Usuario, PerfilUsuario, PerfilEstudiante, PerfilProfesor, PerfilAdministrador

# Crear el Blueprint para las rutas de usuario
usuario_bp = Blueprint("usuario_bp", __name__, url_prefix="/api/usuario")

# ========================================
# 🆕 ACTUALIZAR NIVEL - ONBOARDING (SIN JWT)
# ========================================
@usuario_bp.route("/actualizar-nivel", methods=["PATCH"])
def actualizar_nivel_onboarding():
    """
    Endpoint especial para actualizar nivel durante el proceso de registro.
    No requiere JWT, pero sí correo del usuario.
    Solo funciona si el usuario NO ha iniciado sesión aún.
    """
    try:
        data = request.get_json()
        correo = data.get("correo")
        nuevo_nivel = data.get("nivel")

        if not correo or not nuevo_nivel:
            return jsonify({"error": "Correo y nivel son requeridos"}), 400

        # Buscar usuario por correo
        usuario = Usuario.query.filter_by(correo=correo).first()
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        # Verificar que sea estudiante
        if usuario.rol != 'alumno':
            return jsonify({"error": "Solo los estudiantes pueden actualizar su nivel"}), 403

        # Verificar que el correo esté verificado
        if not usuario.correo_verificado:
            return jsonify({
                "error": "Debes verificar tu correo antes de asignar un nivel"
            }), 403

        # Buscar perfil de estudiante
        perfil_estudiante = PerfilEstudiante.query.filter_by(usuario_id=usuario.id).first()
        if not perfil_estudiante:
            return jsonify({"error": "Perfil de estudiante no encontrado"}), 404

        # Actualizar nivel
        perfil_estudiante.nivel_actual = nuevo_nivel
        db.session.commit()
        
        return jsonify({
            "mensaje": f"Nivel actualizado correctamente a {nuevo_nivel}",
            "nivel": nuevo_nivel,
            "usuario_id": usuario.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al actualizar nivel (onboarding): {e}")
        return jsonify({"error": "Error al guardar cambios en la base de datos"}), 500


# ========================================
# ACTUALIZAR NIVEL (CON JWT - Para usuarios logueados)
# ========================================
@usuario_bp.route("/actualizar-nivel-autenticado", methods=["PATCH"])
@jwt_required()
def actualizar_nivel_autenticado():
    """
    Endpoint que actualiza el nivel del estudiante cuando ya está logueado.
    Requiere JWT.
    """
    try:
        identity = get_jwt_identity()
        usuario_id = int(identity)
        
        data = request.get_json()
        nuevo_nivel = data.get("nivel")

        if not nuevo_nivel:
            return jsonify({"error": "Nivel requerido"}), 400

        # Busca al usuario
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        # Verificar que sea estudiante
        if usuario.rol != 'alumno':
            return jsonify({"error": "Solo los estudiantes pueden actualizar su nivel"}), 403

        # Busca el perfil de estudiante
        perfil_estudiante = PerfilEstudiante.query.filter_by(usuario_id=usuario_id).first()
        if not perfil_estudiante:
            return jsonify({"error": "Perfil de estudiante no encontrado"}), 404

        # Actualiza el nivel
        perfil_estudiante.nivel_actual = nuevo_nivel
        db.session.commit()
        
        return jsonify({
            "mensaje": f"Nivel actualizado correctamente a {nuevo_nivel}",
            "nivel": nuevo_nivel
        }), 200
        
    except (ValueError, TypeError):
        return jsonify({"error": "Token inválido"}), 400
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al actualizar nivel: {e}")
        return jsonify({"error": "Error al guardar cambios en la base de datos"}), 500


# ========================================
# OBTENER PERFIL POR ID (ADAPTADO A ROLES)
# ========================================
@usuario_bp.route("/perfil/<int:usuario_id>", methods=["GET"])
@jwt_required()
def obtener_perfil_por_id(usuario_id):
    """
    Obtiene el perfil completo de un usuario específico por su ID.
    Devuelve información diferente según el rol del usuario.
    """
    try:
        # Busca el usuario por ID
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        # Busca el perfil base
        perfil_base = PerfilUsuario.query.filter_by(usuario_id=usuario_id).first()
        if not perfil_base:
            return jsonify({"error": "Perfil base no encontrado"}), 404
        
        # Construye respuesta base
        datos_respuesta = {
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
            "perfil_base": {
                "nombre_completo": perfil_base.nombre_completo,
                "foto_perfil": perfil_base.foto_perfil,
                "biografia": perfil_base.biografia
            }
        }
        
        # Agregar perfil específico según el rol
        if usuario.rol == 'alumno':
            perfil_estudiante = PerfilEstudiante.query.filter_by(usuario_id=usuario_id).first()
            if perfil_estudiante:
                datos_respuesta["perfil_estudiante"] = {
                    "nivel_actual": perfil_estudiante.nivel_actual,
                    "idioma_aprendizaje": perfil_estudiante.idioma_aprendizaje,
                    "total_xp": perfil_estudiante.total_xp,
                    "nivel_usuario": perfil_estudiante.nivel_usuario,
                    "dias_racha": perfil_estudiante.dias_racha,
                    "racha_maxima": perfil_estudiante.racha_maxima,
                    "lecciones_completadas": perfil_estudiante.lecciones_completadas,
                    "tiempo_estudio_total": perfil_estudiante.tiempo_estudio_total,
                    "meta_diaria": perfil_estudiante.meta_diaria,
                    "notificaciones_habilitadas": perfil_estudiante.notificaciones_habilitadas,
                    "ultima_actividad": perfil_estudiante.ultima_actividad.isoformat() if perfil_estudiante.ultima_actividad else None
                }
        
        elif usuario.rol == 'profesor':
            perfil_profesor = PerfilProfesor.query.filter_by(usuario_id=usuario_id).first()
            if perfil_profesor:
                datos_respuesta["perfil_profesor"] = {
                    "especialidad": perfil_profesor.especialidad,
                    "años_experiencia": perfil_profesor.años_experiencia,
                    "idiomas_ensena": perfil_profesor.idiomas_ensena,
                    "niveles_ensena": perfil_profesor.niveles_ensena,
                    "certificaciones": perfil_profesor.certificaciones,
                    "descripcion_profesional": perfil_profesor.descripcion_profesional,
                    "estudiantes_totales": perfil_profesor.estudiantes_totales,
                    "cursos_creados": perfil_profesor.cursos_creados,
                    "calificacion_promedio": float(perfil_profesor.calificacion_promedio) if perfil_profesor.calificacion_promedio else 0.0,
                    "total_resenas": perfil_profesor.total_resenas
                }
        
        elif usuario.rol in ('admin', 'mantenimiento'):
            perfil_admin = PerfilAdministrador.query.filter_by(usuario_id=usuario_id).first()
            if perfil_admin:
                datos_respuesta["perfil_admin"] = {
                    "departamento": perfil_admin.departamento,
                    "nivel_acceso": perfil_admin.nivel_acceso,
                    "permisos": perfil_admin.permisos,
                    "ultimo_acceso_admin": perfil_admin.ultimo_acceso_admin.isoformat() if perfil_admin.ultimo_acceso_admin else None
                }
            
        return jsonify(datos_respuesta), 200
        
    except Exception as e:
        print(f"❌ Error en obtener_perfil_por_id ({usuario_id}): {e}")
        return jsonify({"error": "Error interno al obtener el perfil"}), 500


# ========================================
# OBTENER PERFIL DEL USUARIO ACTUAL
# ========================================
@usuario_bp.route("/perfil", methods=["GET"])
@jwt_required()
def obtener_perfil_actual():
    """
    Obtiene el perfil completo del usuario actualmente autenticado.
    """
    try:
        identity = get_jwt_identity()
        usuario_id_actual = int(identity)
        return obtener_perfil_por_id(usuario_id_actual)
        
    except (ValueError, TypeError):
        print(f"⚠️ Error: Token contenía identidad no numérica: {identity}")
        return jsonify({"error": "Token inválido"}), 400
    except Exception as e:
        print(f"❌ Error inesperado en obtener_perfil_actual: {e}") 
        return jsonify({"error": "Error interno al procesar la solicitud"}), 500


# ========================================
# ACTUALIZAR PERFIL DEL USUARIO ACTUAL
# ========================================
@usuario_bp.route("/perfil", methods=["PUT", "PATCH"])
@jwt_required()
def actualizar_perfil_actual():
    """
    Actualiza el perfil del usuario autenticado.
    Permite actualizar tanto perfil base como perfil específico según rol.
    """
    try:
        identity = get_jwt_identity()
        usuario_id = int(identity)
        data = request.get_json()
        
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        # Actualizar perfil base
        perfil_base = PerfilUsuario.query.filter_by(usuario_id=usuario_id).first()
        if perfil_base:
            if 'biografia' in data:
                perfil_base.biografia = data['biografia']
            if 'foto_perfil' in data:
                perfil_base.foto_perfil = data['foto_perfil']
        
        # Actualizar perfil específico según rol
        if usuario.rol == 'alumno':
            perfil_estudiante = PerfilEstudiante.query.filter_by(usuario_id=usuario_id).first()
            if perfil_estudiante:
                if 'meta_diaria' in data:
                    perfil_estudiante.meta_diaria = data['meta_diaria']
                if 'notificaciones_habilitadas' in data:
                    perfil_estudiante.notificaciones_habilitadas = data['notificaciones_habilitadas']
                if 'idioma_aprendizaje' in data:
                    perfil_estudiante.idioma_aprendizaje = data['idioma_aprendizaje']
        
        elif usuario.rol == 'profesor':
            perfil_profesor = PerfilProfesor.query.filter_by(usuario_id=usuario_id).first()
            if perfil_profesor:
                if 'especialidad' in data:
                    perfil_profesor.especialidad = data['especialidad']
                if 'descripcion_profesional' in data:
                    perfil_profesor.descripcion_profesional = data['descripcion_profesional']
                if 'años_experiencia' in data:
                    perfil_profesor.años_experiencia = data['años_experiencia']
                if 'certificaciones' in data:
                    perfil_profesor.certificaciones = data['certificaciones']
        
        db.session.commit()
        return jsonify({"mensaje": "Perfil actualizado correctamente"}), 200
        
    except (ValueError, TypeError):
        return jsonify({"error": "Token inválido"}), 400
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al actualizar perfil {usuario_id}: {e}")
        return jsonify({"error": "Error interno al actualizar perfil"}), 500


# ========================================
# ACTUALIZAR XP DEL ESTUDIANTE
# ========================================
@usuario_bp.route("/actualizar-xp", methods=["PATCH"])
@jwt_required()
def actualizar_xp():
    """
    Actualiza los puntos XP del estudiante.
    Solo disponible para usuarios con rol 'alumno'.
    """
    try:
        identity = get_jwt_identity()
        usuario_id = int(identity)
        data = request.get_json()
        
        xp_ganado = data.get("xp", 0)
        if xp_ganado <= 0:
            return jsonify({"error": "XP debe ser mayor a 0"}), 400
        
        usuario = Usuario.query.get(usuario_id)
        if not usuario or usuario.rol != 'alumno':
            return jsonify({"error": "Solo estudiantes pueden ganar XP"}), 403
        
        perfil_estudiante = PerfilEstudiante.query.filter_by(usuario_id=usuario_id).first()
        if not perfil_estudiante:
            return jsonify({"error": "Perfil de estudiante no encontrado"}), 404
        
        # Actualizar XP
        perfil_estudiante.total_xp += xp_ganado
        
        # Calcular nivel basado en XP (ejemplo simple)
        nuevo_nivel = (perfil_estudiante.total_xp // 100) + 1
        perfil_estudiante.nivel_usuario = nuevo_nivel
        
        db.session.commit()
        
        return jsonify({
            "mensaje": "XP actualizado correctamente",
            "total_xp": perfil_estudiante.total_xp,
            "nivel_usuario": perfil_estudiante.nivel_usuario,
            "xp_ganado": xp_ganado
        }), 200
        
    except (ValueError, TypeError):
        return jsonify({"error": "Token inválido"}), 400
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al actualizar XP: {e}")
        return jsonify({"error": "Error al actualizar XP"}), 500


# ========================================
# ACTUALIZAR RACHA DEL ESTUDIANTE
# ========================================
@usuario_bp.route("/actualizar-racha", methods=["PATCH"])
@jwt_required()
def actualizar_racha():
    """
    Actualiza la racha de días consecutivos del estudiante.
    """
    try:
        identity = get_jwt_identity()
        usuario_id = int(identity)
        
        from datetime import date
        
        usuario = Usuario.query.get(usuario_id)
        if not usuario or usuario.rol != 'alumno':
            return jsonify({"error": "Solo estudiantes tienen racha"}), 403
        
        perfil_estudiante = PerfilEstudiante.query.filter_by(usuario_id=usuario_id).first()
        if not perfil_estudiante:
            return jsonify({"error": "Perfil de estudiante no encontrado"}), 404
        
        hoy = date.today()
        ultima_actividad = perfil_estudiante.ultima_actividad
        
        # Lógica de racha
        if ultima_actividad is None:
            # Primera actividad
            perfil_estudiante.dias_racha = 1
        elif ultima_actividad == hoy:
            # Ya se registró actividad hoy
            pass
        elif (hoy - ultima_actividad).days == 1:
            # Día consecutivo
            perfil_estudiante.dias_racha += 1
        else:
            # Se rompió la racha
            perfil_estudiante.dias_racha = 1
        
        # Actualizar racha máxima
        if perfil_estudiante.dias_racha > perfil_estudiante.racha_maxima:
            perfil_estudiante.racha_maxima = perfil_estudiante.dias_racha
        
        perfil_estudiante.ultima_actividad = hoy
        db.session.commit()
        
        return jsonify({
            "mensaje": "Racha actualizada",
            "dias_racha": perfil_estudiante.dias_racha,
            "racha_maxima": perfil_estudiante.racha_maxima
        }), 200
        
    except (ValueError, TypeError):
        return jsonify({"error": "Token inválido"}), 400
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al actualizar racha: {e}")
        return jsonify({"error": "Error al actualizar racha"}), 500