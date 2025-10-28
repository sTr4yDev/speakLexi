from config.database import db
from models.usuario import Usuario, PerfilUsuario
from services.correo_service import (
    enviar_codigo_verificacion,
    enviar_recuperacion_password
)
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
import random
import secrets

class GestorUsuarios:
    # ========================================
    # REGISTRO Y VERIFICACIÓN
    # ========================================
    def registrar_usuario(self, nombre, primer_apellido, segundo_apellido, correo, password, idioma, nivel_actual):
        """Registra un nuevo usuario y envía código de verificación"""
        # Evitar duplicados por correo
        if Usuario.query.filter_by(correo=correo).first():
            return {"error": "El correo electrónico ya está registrado."}, 400

        try:
            # Crear usuario principal
            nuevo_usuario = Usuario(
                nombre=nombre,
                primer_apellido=primer_apellido,
                segundo_apellido=segundo_apellido,
                correo=correo
            )
            nuevo_usuario.set_password(password)

            # Generar ID público único
            nuevo_usuario.id_publico = self.generar_id_publico(
                nombre, primer_apellido, segundo_apellido, idioma, nivel_actual
            )

            # Crear código de verificación (válido por 10 minutos)
            codigo = str(random.randint(100000, 999999))
            nuevo_usuario.codigo_verificacion = codigo
            nuevo_usuario.expira_verificacion = datetime.utcnow() # <-- CORRECCIÓN: Usar utcnow(), no now() si la lógica lo requiere

            # Crear perfil asociado
            nombre_completo = f"{nombre} {primer_apellido} {segundo_apellido or ''}".strip()
            nuevo_perfil = PerfilUsuario(
                nombre_completo=nombre_completo,
                id_publico=nuevo_usuario.id_publico,
                idioma=idioma,
                nivel_actual=nivel_actual
            )
            nuevo_usuario.perfil = nuevo_perfil
            nuevo_perfil.usuario = nuevo_usuario  # vínculo explícito

            # Guardar en BD
            db.session.add(nuevo_usuario)
            db.session.commit()

            # Enviar correo de verificación
            enviar_codigo_verificacion(correo, codigo)

            return {
                "mensaje": "Usuario registrado correctamente. Código de verificación enviado.",
                "id_publico": nuevo_usuario.id_publico
            }, 201

        except IntegrityError:
            db.session.rollback()
            # Loguear el error podría ser útil aquí
            print(f"❌ Error de integridad al registrar {correo}")
            return {"error": "Error de integridad en la base de datos (posiblemente ID público duplicado)."}, 500
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error interno al registrar usuario {correo}: {str(e)}") # Loguear el error
            return {"error": f"Error interno del servidor"}, 500

    def verificar_correo(self, correo, codigo):
        """Verifica el correo electrónico con el código de 6 dígitos"""
        usuario = Usuario.query.filter_by(correo=correo).first()
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404

        if usuario.correo_verificado:
            return {"mensaje": "El correo ya está verificado"}, 200

        # Verificar expiración (10 minutos)
        if usuario.expira_verificacion:
            tiempo_transcurrido = datetime.utcnow() - usuario.expira_verificacion
            if tiempo_transcurrido > timedelta(minutes=10):
                return {"error": "Código expirado. Solicita uno nuevo."}, 400
        else:
             # Si no hay fecha de expiración, considerar el código inválido o manejar según lógica
             return {"error": "No se pudo verificar la expiración del código."}, 400


        # Verificar código
        if usuario.codigo_verificacion == codigo:
            usuario.correo_verificado = True
            usuario.codigo_verificacion = None
            usuario.expira_verificacion = None # Limpiar también la expiración
            try:
                db.session.commit()
                return {"mensaje": "Correo verificado correctamente"}, 200
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error al guardar verificación para {correo}: {str(e)}")
                return {"error": "Error al guardar la verificación"}, 500
        else:
            return {"error": "Código incorrecto"}, 400

    def reenviar_codigo(self, correo):
        """Reenvía el código de verificación"""
        usuario = Usuario.query.filter_by(correo=correo).first()
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404

        if usuario.correo_verificado:
            return {"mensaje": "El correo ya fue verificado"}, 200

        # Generar nuevo código y actualizar expiración
        codigo = str(random.randint(100000, 999999))
        usuario.codigo_verificacion = codigo
        usuario.expira_verificacion = datetime.utcnow()
        try:
            db.session.commit()
            # Enviar correo (solo después de confirmar que se guardó en BD)
            enviar_codigo_verificacion(correo, codigo)
            return {"mensaje": "Código reenviado exitosamente"}, 200
        except Exception as e:
             db.session.rollback()
             print(f"❌ Error al reenviar código para {correo}: {str(e)}")
             return {"error": "Error al procesar el reenvío del código"}, 500

    # ========================================
    # AUTENTICACIÓN
    # ========================================
    def autenticar_usuario(self, correo, password):
        """Autentica un usuario y retorna su información completa si es exitoso"""
        usuario = Usuario.query.filter_by(correo=correo).first()
        
        # Verificar usuario y contraseña
        if not usuario or not usuario.check_password(password):
            return {"error": "Credenciales inválidas"}, 401

        # Verificar estado de la cuenta
        if usuario.estado_cuenta == 'desactivado':
            dias_restantes = 0 # Valor por defecto
            if usuario.fecha_desactivacion:
                # Asegurarse que fecha_desactivacion es datetime
                if isinstance(usuario.fecha_desactivacion, datetime):
                    dias_transcurridos = (datetime.utcnow() - usuario.fecha_desactivacion).days
                    dias_restantes = max(0, 30 - dias_transcurridos) # Evitar negativos
                else:
                    # Loguear advertencia si la fecha no es válida
                    print(f"⚠️ Fecha de desactivación inválida para usuario {usuario.id}")

            return {
                "error": "Tu cuenta ha sido desactivada",
                "codigo": "CUENTA_DESACTIVADA",
                "dias_restantes": dias_restantes,
                 "usuario_id": usuario.id # Incluir ID para reactivación
            }, 403 # Usar 403 Forbidden es más apropiado aquí

        if usuario.estado_cuenta == 'eliminado':
            return {"error": "Esta cuenta ha sido eliminada permanentemente", "codigo": "CUENTA_ELIMINADA"}, 403 # Usar 403

        # Verificar si el correo está verificado
        if not usuario.correo_verificado:
            return {"error": "Debes verificar tu correo electrónico antes de iniciar sesión", "codigo": "EMAIL_NOT_VERIFIED"}, 403 # Usar 403

        # Si todo está OK, construir la respuesta exitosa
        perfil = usuario.perfil # Acceder a la relación
        datos_usuario_respuesta = {
            "id": usuario.id,
            "id_publico": usuario.id_publico,
            "nombre": usuario.nombre,
            "primer_apellido": usuario.primer_apellido,
            "segundo_apellido": usuario.segundo_apellido,
            "correo": usuario.correo,
            "rol": usuario.rol,
            "correo_verificado": usuario.correo_verificado,
            "estado_cuenta": usuario.estado_cuenta,
            "perfil": None # Inicializar perfil
        }
        if perfil:
            datos_usuario_respuesta["perfil"] = {
                "nombre_completo": perfil.nombre_completo,
                "idioma": perfil.idioma,
                "nivel_actual": perfil.nivel_actual,
                "curso_actual": perfil.curso_actual,
                "total_xp": perfil.total_xp,
                "dias_racha": perfil.dias_racha,
                "ultima_actividad": perfil.ultima_actividad.isoformat() if perfil.ultima_actividad else None
            }
            
        return {
            "mensaje": "Inicio de sesión exitoso",
            "usuario": datos_usuario_respuesta
            # NO devolver el token aquí, eso se hace en la ruta (routes/auth.py)
        }, 200

    # ========================================
    # PERFIL DE USUARIO
    # ========================================
    # --- MÉTODO AÑADIDO ---
    def obtener_perfil(self, id_usuario):
        """Obtiene el perfil completo de un usuario por su ID"""
        try:
            usuario = Usuario.query.get(id_usuario)
            if not usuario:
                # Devolver el diccionario de error y el código HTTP
                return {"error": "Usuario no encontrado"}, 404

            perfil = PerfilUsuario.query.filter_by(usuario_id=usuario.id).first()
            # Si un usuario DEBE tener perfil, considerar 404 si no existe
            if not perfil:
                 return {"error": "Perfil de usuario no encontrado"}, 404

            # Construir la respuesta (similar a la ruta, pero sin jsonify)
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
                    "ultima_actividad": perfil.ultima_actividad.isoformat() if perfil.ultima_actividad else None
                    # Añade otros campos necesarios del perfil
                }
            }
            # Devolver el diccionario de datos y el código HTTP
            return datos_respuesta, 200

        except Exception as e:
            print(f"❌ Error obteniendo perfil para ID {id_usuario}: {str(e)}") # Log del error
            # Devolver el diccionario de error y el código HTTP
            return {"error": "Error interno al obtener el perfil"}, 500
    # --- FIN MÉTODO AÑADIDO ---

    # ========================================
    # CAMBIO DE CURSO/IDIOMA
    # ========================================
    def cambiar_curso(self, usuario_id, nuevo_idioma, nuevo_nivel=None):
        """
        Cambia el idioma y/o nivel del usuario.
        Mantiene el progreso actual.
        """
        try:
            usuario = Usuario.query.get(usuario_id)
            if not usuario:
                return {"error": "Usuario no encontrado"}, 404

            perfil = usuario.perfil
            if not perfil:
                return {"error": "Perfil no encontrado"}, 404

            # Validar que el idioma esté disponible (ejemplo)
            idiomas_disponibles = ["Inglés", "Español", "Francés", "Alemán"] # Actualiza según tus cursos
            if nuevo_idioma not in idiomas_disponibles:
                return {"error": f"Idioma '{nuevo_idioma}' no disponible actualmente"}, 400

            idioma_anterior = perfil.idioma

            # Actualizar idioma
            perfil.idioma = nuevo_idioma
            
            # Actualizar nivel si se proporciona
            if nuevo_nivel:
                # Podrías validar el formato del nivel aquí si es necesario
                perfil.nivel_actual = nuevo_nivel
            
            # Considera si necesitas actualizar 'curso_actual' u otros campos relacionados
            
            # Actualizar última actividad podría ser relevante aquí también
            perfil.ultima_actividad = datetime.utcnow() # O usar now() si prefieres hora local del servidor
            
            db.session.commit()
            
            print(f"✅ Curso cambiado para usuario {usuario_id}: {idioma_anterior} → {nuevo_idioma}")
            
            # Devolver estado actualizado del perfil
            return {
                "mensaje": f"Curso cambiado exitosamente a {nuevo_idioma}",
                "perfil": {
                    "idioma": perfil.idioma,
                    "nivel_actual": perfil.nivel_actual,
                    "total_xp": perfil.total_xp,
                    "dias_racha": perfil.dias_racha,
                    "curso_actual": perfil.curso_actual
                    # Incluye otros campos relevantes si es necesario
                }
            }, 200
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al cambiar curso para usuario {usuario_id}: {e}")
            return {"error": "Error interno al cambiar el curso"}, 500

    # ========================================
    # SOFT DELETE Y RECUPERACIÓN DE CUENTA
    # ========================================
    def desactivar_cuenta(self, usuario_id, password):
        """Desactiva temporalmente la cuenta del usuario (soft delete)"""
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404

        # Verificar contraseña antes de desactivar
        if not usuario.check_password(password):
            return {"error": "Contraseña incorrecta"}, 401 # Usar 401 Unauthorized

        # Verificar si ya está desactivada o eliminada
        if usuario.estado_cuenta == 'desactivado':
             return {"mensaje": "La cuenta ya se encuentra desactivada"}, 200 # O 400 Bad Request?
        if usuario.estado_cuenta == 'eliminado':
             return {"error": "La cuenta ha sido eliminada permanentemente"}, 410 # 410 Gone

        # Actualizar estado y fecha
        usuario.estado_cuenta = 'desactivado'
        usuario.fecha_desactivacion = datetime.utcnow()
        try:
            db.session.commit()
            # Podrías invalidar tokens JWT existentes aquí si es necesario
            return {"mensaje": "Cuenta desactivada correctamente. Tienes 30 días para reactivarla."}, 200
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al desactivar cuenta {usuario_id}: {e}")
            return {"error": "Error al guardar el estado de desactivación"}, 500

    def reactivar_cuenta(self, usuario_id, password):
        """Reactiva una cuenta desactivada si está dentro del período de 30 días"""
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404

        if usuario.estado_cuenta != 'desactivado':
            # Si está activa, no hay nada que hacer. Si está eliminada, no se puede reactivar.
            estado_actual = usuario.estado_cuenta
            if estado_actual == 'activo':
                 return {"mensaje": "La cuenta ya está activa"}, 200
            elif estado_actual == 'eliminado':
                 return {"error": "Esta cuenta ha sido eliminada permanentemente y no puede reactivarse"}, 410 # Gone
            else:
                 return {"error": f"La cuenta está en un estado desconocido ('{estado_actual}') y no puede reactivarse"}, 400

        # Verificar contraseña
        if not usuario.check_password(password):
            return {"error": "Contraseña incorrecta"}, 401

        # Verificar período de reactivación (30 días)
        if usuario.fecha_desactivacion:
            if isinstance(usuario.fecha_desactivacion, datetime):
                 dias_transcurridos = (datetime.utcnow() - usuario.fecha_desactivacion).days
                 if dias_transcurridos > 30:
                     # Considera cambiar el estado a 'eliminado' aquí o tener un proceso batch
                     return {"error": "El período de 30 días para reactivar la cuenta ha expirado"}, 410 # Gone
            else:
                 print(f"⚠️ Fecha de desactivación inválida al intentar reactivar usuario {usuario_id}")
                 return {"error": "No se pudo verificar el período de reactivación"}, 500
        else:
             # Si no hay fecha, algo está mal, no debería poder reactivarse
             print(f"⚠️ Intento de reactivar cuenta {usuario_id} sin fecha de desactivación")
             return {"error": "Falta información para verificar el período de reactivación"}, 500


        # Reactivar cuenta
        usuario.estado_cuenta = 'activo'
        usuario.fecha_desactivacion = None # Limpiar fecha
        try:
            db.session.commit()
            return {"mensaje": "Cuenta reactivada correctamente"}, 200
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al reactivar cuenta {usuario_id}: {e}")
            return {"error": "Error al guardar el estado de reactivación"}, 500

    def eliminar_cuenta_permanente(self, usuario_id):
        """
        Elimina la cuenta permanentemente. Idealmente llamado por un proceso batch
        o una ruta de admin protegida, no directamente por el usuario final.
        """
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404

        # Opcional: Verificar si debe estar desactivada por 30 días antes de eliminar
        # if usuario.estado_cuenta != 'desactivado' or not usuario.fecha_desactivacion or \
        #    (datetime.utcnow() - usuario.fecha_desactivacion).days <= 30:
        #     return {"error": "La cuenta no cumple los requisitos para eliminación permanente"}, 400

        try:
            # Eliminar perfil asociado primero si existe y la relación no lo hace automáticamente
            if usuario.perfil:
                 db.session.delete(usuario.perfil)
            # Eliminar usuario
            db.session.delete(usuario)
            db.session.commit()
            print(f"🗑️ Cuenta eliminada permanentemente: ID {usuario_id}")
            return {"mensaje": "Cuenta eliminada permanentemente"}, 200
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al eliminar permanentemente cuenta {usuario_id}: {e}")
            return {"error": "Error durante la eliminación permanente"}, 500

    # ========================================
    # RECUPERACIÓN DE CONTRASEÑA
    # ========================================
    def solicitar_recuperacion_password(self, correo):
        """Genera un token seguro y envía correo para restablecer contraseña"""
        usuario = Usuario.query.filter_by(correo=correo).first()
        # Siempre devolver éxito para no revelar si un correo existe o no
        if not usuario:
            print(f"ℹ️ Solicitud de recuperación para correo no existente: {correo}")
            return {"mensaje": "Si tu correo electrónico está registrado, recibirás instrucciones para restablecer tu contraseña."}, 200

        # Generar token seguro y fecha de expiración (ej. 1 hora)
        token = secrets.token_urlsafe(32)
        usuario.token_recuperacion = token
        usuario.expira_token_recuperacion = datetime.utcnow() + timedelta(hours=1)
        
        try:
            db.session.commit()
            # Enviar correo SÓLO si se guardó el token
            enviar_recuperacion_password(correo, token)
            print(f"🔑 Token de recuperación generado para {correo}")
            return {"mensaje": "Si tu correo electrónico está registrado, recibirás instrucciones para restablecer tu contraseña."}, 200
        except Exception as e:
             db.session.rollback()
             print(f"❌ Error al solicitar recuperación para {correo}: {str(e)}")
             # Aún así, devolver mensaje genérico al usuario
             return {"mensaje": "Ocurrió un error al procesar tu solicitud. Intenta de nuevo más tarde."}, 500


    def validar_token_recuperacion(self, token):
        """Valida si un token de recuperación es válido y no ha expirado"""
        # Buscar usuario por el token
        usuario = Usuario.query.filter_by(token_recuperacion=token).first()
        
        # Verificar si el token existe y no ha expirado
        if not usuario or not usuario.expira_token_recuperacion or \
           usuario.expira_token_recuperacion < datetime.utcnow():
            return {"error": "El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo."}, 400 # Bad Request
            
        # Si es válido, devolver éxito y quizás el correo (aunque no es estrictamente necesario)
        return {"mensaje": "Token válido"}, 200

    def restablecer_password(self, token, nueva_password):
        """Restablece la contraseña usando un token válido"""
        # Buscar usuario por el token
        usuario = Usuario.query.filter_by(token_recuperacion=token).first()
        
        # Validar token (igual que en validar_token_recuperacion)
        if not usuario or not usuario.expira_token_recuperacion or \
           usuario.expira_token_recuperacion < datetime.utcnow():
            return {"error": "El enlace de recuperación es inválido o ha expirado."}, 400

        # Validar longitud mínima de la nueva contraseña (ej. 8 caracteres)
        if len(nueva_password) < 8:
            return {"error": "La nueva contraseña debe tener al menos 8 caracteres"}, 400

        # Establecer la nueva contraseña hasheada
        try:
            usuario.set_password(nueva_password)
            # Invalidar el token de recuperación usado
            usuario.token_recuperacion = None
            usuario.expira_token_recuperacion = None
            db.session.commit()
            print(f"✅ Contraseña restablecida para usuario {usuario.id}")
            # Podrías enviar un correo de confirmación aquí
            return {"mensaje": "Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión."}, 200
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al restablecer contraseña para token {token[:5]}...: {str(e)}")
            return {"error": "Error al guardar la nueva contraseña"}, 500

    # ========================================
    # UTILIDAD INTERNA
    # ========================================
    def generar_id_publico(self, nombre, primer_apellido, segundo_apellido, idioma, nivel):
        """
        Genera un ID público único y legible.
        Formato: YY+IDIOMA(3)+INICIALES(3)+NIVEL(2) + [Contador si hay colisión]
        Ejemplo: 25INGPRAA1
        """
        año = str(datetime.now().year)[-2:]
        idioma_codigo = idioma[:3].upper() if idioma else "XXX"
        
        # Tomar iniciales asegurándose de que existan
        i1 = primer_apellido[0].upper() if primer_apellido else ""
        i2 = segundo_apellido[0].upper() if segundo_apellido else ""
        i3 = nombre[0].upper() if nombre else ""
        iniciales = f"{i1}{i2}{i3}"[:3].ljust(3, 'X') # Asegura 3 caracteres

        nivel_codigo = nivel.upper() if nivel else "XX"

        base_id = f"{año}{idioma_codigo}{iniciales}{nivel_codigo}"
        
        # Manejo básico de colisiones (añadir contador)
        contador = 0
        id_publico_final = base_id
        # Verificar si ya existe en Usuario o PerfilUsuario
        while Usuario.query.filter_by(id_publico=id_publico_final).first() or \
              PerfilUsuario.query.filter_by(id_publico=id_publico_final).first():
            contador += 1
            id_publico_final = f"{base_id}{contador}"
            # Limitar el contador para evitar bucles infinitos en casos extremos
            if contador > 99:
                 print(f"⚠️ Posible problema generando ID público único para base {base_id}")
                 # Podría lanzar una excepción o generar un ID totalmente aleatorio como fallback
                 id_publico_final = f"{base_id}{secrets.token_hex(2).upper()}"
                 break # Salir del bucle con el fallback

        return id_publico_final
