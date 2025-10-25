from config.database import db
from models.usuario import Usuario, PerfilUsuario
from services.correo_service import enviar_codigo_verificacion, enviar_recuperacion_password
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
            nuevo_usuario.expira_verificacion = datetime.utcnow()

            # Crear perfil asociado
            nombre_completo = f"{nombre} {primer_apellido} {segundo_apellido or ''}".strip()
            nuevo_perfil = PerfilUsuario(
                nombre_completo=nombre_completo,
                id_publico=nuevo_usuario.id_publico,
                idioma=idioma,
                nivel_actual=nivel_actual
            )
            nuevo_usuario.perfil = nuevo_perfil
            nuevo_perfil.usuario = nuevo_usuario

            # Guardar en BD
            db.session.add(nuevo_usuario)
            db.session.commit()

            # Enviar correo de verificación
            enviar_codigo_verificacion(correo, codigo)

            print(f"✅ Usuario registrado: {correo}")

            return {
                "mensaje": "Usuario registrado correctamente. Código de verificación enviado.",
                "id_publico": nuevo_usuario.id_publico
            }, 201

        except IntegrityError:
            db.session.rollback()
            return {"error": "Error de integridad en la base de datos."}, 500
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al registrar: {e}")
            return {"error": f"Error interno: {str(e)}"}, 500

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

        # Verificar código
        if usuario.codigo_verificacion == codigo:
            usuario.correo_verificado = True
            usuario.codigo_verificacion = None
            db.session.commit()
            
            print(f"✅ Correo verificado: {correo}")
            
            return {"mensaje": "Correo verificado correctamente"}, 200

        return {"error": "Código incorrecto"}, 400

    def reenviar_codigo(self, correo):
        """Reenvía el código de verificación"""
        usuario = Usuario.query.filter_by(correo=correo).first()
        
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404

        if usuario.correo_verificado:
            return {"mensaje": "El correo ya fue verificado"}, 200

        # Generar nuevo código
        codigo = str(random.randint(100000, 999999))
        usuario.codigo_verificacion = codigo
        usuario.expira_verificacion = datetime.utcnow()
        db.session.commit()

        enviar_codigo_verificacion(correo, codigo)
        
        print(f"✅ Código reenviado a: {correo}")
        
        return {"mensaje": "Código reenviado exitosamente"}, 200

    # ========================================
    # AUTENTICACIÓN
    # ========================================
    
    def autenticar_usuario(self, correo, password):
        """Autentica un usuario y retorna su información completa"""
        usuario = Usuario.query.filter_by(correo=correo).first()
        
        if not usuario:
            print(f"❌ Usuario no encontrado: {correo}")
            return {"error": "Credenciales inválidas"}, 401
        
        # ✅ VERIFICAR ESTADO DE LA CUENTA
        if usuario.estado_cuenta == 'desactivado':
            dias_restantes = None
            if usuario.fecha_desactivacion:
                dias_transcurridos = (datetime.utcnow() - usuario.fecha_desactivacion).days
                dias_restantes = 30 - dias_transcurridos
            
            print(f"⚠️ Cuenta desactivada: {correo} (días restantes: {dias_restantes})")
            
            return {
                "error": "Tu cuenta ha sido desactivada",
                "codigo": "CUENTA_DESACTIVADA",
                "dias_restantes": dias_restantes if dias_restantes and dias_restantes > 0 else 0,
                "mensaje_adicional": "Puedes reactivarla ingresando tu contraseña" if dias_restantes and dias_restantes > 0 else "El período de recuperación ha expirado",
                "usuario": {
                    "id": usuario.id,
                    "correo": usuario.correo
                }
            }, 403
        
        if usuario.estado_cuenta == 'eliminado':
            print(f"❌ Cuenta eliminada: {correo}")
            return {
                "error": "Esta cuenta ha sido eliminada",
                "codigo": "CUENTA_ELIMINADA"
            }, 403
        
        # Verificar que el correo esté verificado
        if not usuario.correo_verificado:
            print(f"⚠️ Usuario no verificado: {correo}")
            return {
                "error": "Debes verificar tu correo antes de iniciar sesión",
                "codigo": "EMAIL_NOT_VERIFIED"
            }, 403
        
        # Verificar contraseña
        if not usuario.check_password(password):
            print(f"❌ Contraseña incorrecta para: {correo}")
            return {"error": "Credenciales inválidas"}, 401
        
        # Login exitoso
        print(f"✅ Login exitoso: {correo} (rol: {usuario.rol})")
        
        # Construir respuesta completa
        perfil = usuario.perfil
        
        respuesta = {
            "mensaje": "Inicio de sesión exitoso",
            "token": "fake_jwt_token_for_demo",  # TODO: Implementar JWT real
            "usuario": {
                "id": usuario.id,
                "id_publico": usuario.id_publico,
                "nombre": usuario.nombre,
                "primer_apellido": usuario.primer_apellido,
                "segundo_apellido": usuario.segundo_apellido,
                "correo": usuario.correo,
                "rol": usuario.rol,
                "correo_verificado": usuario.correo_verificado,
                "estado_cuenta": usuario.estado_cuenta,
                "creado_en": usuario.creado_en.isoformat() if usuario.creado_en else None
            }
        }
        
        # Agregar información del perfil si existe
        if perfil:
            respuesta["usuario"]["perfil"] = {
                "nombre_completo": perfil.nombre_completo,
                "idioma": perfil.idioma,
                "nivel_actual": perfil.nivel_actual,
                "curso_actual": perfil.curso_actual,
                "total_xp": perfil.total_xp,
                "dias_racha": perfil.dias_racha,
                "ultima_actividad": perfil.ultima_actividad.isoformat() if perfil.ultima_actividad else None
            }
        
        return respuesta, 200

    # ========================================
    # PERFIL DE USUARIO
    # ========================================
    
    def obtener_perfil(self, id_usuario):
        """Obtiene el perfil completo de un usuario"""
        usuario = Usuario.query.get(id_usuario)
        
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404
        
        perfil = usuario.perfil
        
        if not perfil:
            return {"error": "Perfil no encontrado"}, 404
        
        return {
            "usuario": {
                "id": usuario.id,
                "id_publico": usuario.id_publico,
                "nombre": usuario.nombre,
                "primer_apellido": usuario.primer_apellido,
                "segundo_apellido": usuario.segundo_apellido,
                "correo": usuario.correo,
                "rol": usuario.rol,
                "correo_verificado": usuario.correo_verificado,
                "estado_cuenta": usuario.estado_cuenta,
                "creado_en": usuario.creado_en.isoformat() if usuario.creado_en else None
            },
            "perfil": {
                "nombre_completo": perfil.nombre_completo,
                "idioma": perfil.idioma,
                "nivel_actual": perfil.nivel_actual,
                "curso_actual": perfil.curso_actual,
                "total_xp": perfil.total_xp,
                "dias_racha": perfil.dias_racha,
                "ultima_actividad": perfil.ultima_actividad.isoformat() if perfil.ultima_actividad else None
            }
        }, 200

    # ========================================
    # SOFT DELETE (DESACTIVACIÓN)
    # ========================================
    
    def desactivar_cuenta(self, usuario_id, password):
        """Desactiva la cuenta del usuario (soft delete)"""
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404
        
        # Verificar contraseña
        if not usuario.check_password(password):
            return {"error": "Contraseña incorrecta"}, 401
        
        # Desactivar cuenta
        usuario.estado_cuenta = 'desactivado'
        usuario.fecha_desactivacion = datetime.utcnow()
        
        db.session.commit()
        
        print(f"✅ Cuenta desactivada: {usuario.correo}")
        
        return {
            "mensaje": "Cuenta desactivada correctamente",
            "info": "Tu cuenta estará desactivada por 30 días. Después de ese período será eliminada permanentemente."
        }, 200

    def reactivar_cuenta(self, usuario_id, password):
        """Reactiva una cuenta desactivada"""
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404
        
        if usuario.estado_cuenta != 'desactivado':
            return {"error": "La cuenta no está desactivada"}, 400
        
        # Verificar contraseña
        if not usuario.check_password(password):
            return {"error": "Contraseña incorrecta"}, 401
        
        # Verificar que no han pasado más de 30 días
        if usuario.fecha_desactivacion:
            dias_transcurridos = (datetime.utcnow() - usuario.fecha_desactivacion).days
            if dias_transcurridos > 30:
                return {"error": "El período de recuperación ha expirado"}, 400
        
        # Reactivar cuenta
        usuario.estado_cuenta = 'activo'
        usuario.fecha_desactivacion = None
        
        db.session.commit()
        
        print(f"✅ Cuenta reactivada: {usuario.correo}")
        
        return {"mensaje": "Cuenta reactivada correctamente"}, 200

    def eliminar_cuenta_permanente(self, usuario_id):
        """Elimina la cuenta definitivamente (solo para cuentas desactivadas > 30 días)"""
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404
        
        if usuario.estado_cuenta != 'desactivado':
            return {"error": "Solo se pueden eliminar cuentas desactivadas"}, 400
        
        # Verificar que han pasado 30 días
        if usuario.fecha_desactivacion:
            dias_transcurridos = (datetime.utcnow() - usuario.fecha_desactivacion).days
            if dias_transcurridos < 30:
                return {
                    "error": f"Faltan {30 - dias_transcurridos} días para poder eliminar la cuenta"
                }, 400
        
        try:
            correo = usuario.correo
            db.session.delete(usuario)
            db.session.commit()
            
            print(f"✅ Cuenta eliminada permanentemente: {correo}")
            
            return {"mensaje": "Cuenta eliminada permanentemente"}, 200
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al eliminar: {e}")
            return {"error": f"Error al eliminar: {str(e)}"}, 500

    # ========================================
    # RECUPERACIÓN DE CONTRASEÑA
    # ========================================
    
    def solicitar_recuperacion_password(self, correo):
        """Genera token y envía correo de recuperación"""
        usuario = Usuario.query.filter_by(correo=correo).first()
        
        if not usuario:
            # Por seguridad, no revelar si el correo existe
            return {
                "mensaje": "Si el correo existe, recibirás instrucciones para recuperar tu contraseña"
            }, 200
        
        # Generar token seguro (32 bytes = 43 caracteres en base64)
        token = secrets.token_urlsafe(32)
        
        # Guardar token con expiración de 1 hora
        usuario.token_recuperacion = token
        usuario.expira_token_recuperacion = datetime.utcnow() + timedelta(hours=1)
        
        try:
            db.session.commit()
            
            # Enviar correo con enlace
            enviar_recuperacion_password(correo, token)
            
            print(f"✅ Token de recuperación generado para: {correo}")
            
            return {
                "mensaje": "Si el correo existe, recibirás instrucciones para recuperar tu contraseña"
            }, 200
        
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al procesar solicitud: {e}")
            return {"error": "Error al procesar la solicitud"}, 500
    
    def validar_token_recuperacion(self, token):
        """Valida que el token sea válido y no haya expirado"""
        usuario = Usuario.query.filter_by(token_recuperacion=token).first()
        
        if not usuario:
            return {"error": "Token inválido o expirado"}, 400
        
        if usuario.expira_token_recuperacion < datetime.utcnow():
            return {"error": "El token ha expirado. Solicita uno nuevo."}, 400
        
        return {"mensaje": "Token válido", "correo": usuario.correo}, 200
    
    def restablecer_password(self, token, nueva_password):
        """Restablece la contraseña usando el token"""
        usuario = Usuario.query.filter_by(token_recuperacion=token).first()
        
        if not usuario:
            return {"error": "Token inválido o expirado"}, 400
        
        if usuario.expira_token_recuperacion < datetime.utcnow():
            return {"error": "El token ha expirado. Solicita uno nuevo."}, 400
        
        try:
            # Cambiar contraseña
            usuario.set_password(nueva_password)
            
            # Invalidar token
            usuario.token_recuperacion = None
            usuario.expira_token_recuperacion = None
            
            db.session.commit()
            
            print(f"✅ Contraseña restablecida para: {usuario.correo}")
            
            return {"mensaje": "Contraseña restablecida correctamente"}, 200
        
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al restablecer contraseña: {e}")
            return {"error": "Error al restablecer la contraseña"}, 500

    # ========================================
    # UTILIDADES
    # ========================================
    
    def generar_id_publico(self, nombre, primer_apellido, segundo_apellido, idioma, nivel):
        """Genera un ID público con patrón: YY+IDIOMA+INICIALES+NIVEL"""
        año = str(datetime.now().year)[-2:]
        idioma_codigo = idioma[:3].upper()
        iniciales = (
            (primer_apellido[0] if primer_apellido else '') +
            (segundo_apellido[0] if segundo_apellido else '') +
            (nombre[0] if nombre else '')
        ).upper()
        return f"{año}{idioma_codigo}{iniciales}{nivel.upper()}"