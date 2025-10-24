from config.database import db
from models.usuario import Usuario, PerfilUsuario
from services.correo_service import enviar_codigo_verificacion
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
import random


class GestorUsuarios:
    def registrar_usuario(self, nombre, primer_apellido, segundo_apellido, correo, password, idioma, nivel_actual):
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
            nuevo_usuario.id_publico = self.generar_id_publico(nombre, primer_apellido, segundo_apellido, idioma, nivel_actual)

            # Crear código de verificación
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
            return {"error": "Error de integridad en la base de datos."}, 500
        except Exception as e:
            db.session.rollback()
            return {"error": f"Error interno: {str(e)}"}, 500

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

    def autenticar_usuario(self, correo, password):
        """Autentica un usuario y devuelve sus datos completos"""
        usuario = Usuario.query.filter_by(correo=correo).first()

        # 1. Verificar que el usuario existe
        if not usuario:
            print(f"❌ Usuario no encontrado: {correo}")
            return {"error": "Credenciales inválidas"}, 401

        # ✅ NUEVO: 2. Verificar estado de la cuenta
        if usuario.estado_cuenta == 'desactivado':
            dias_restantes = None
            if usuario.fecha_desactivacion:
                dias_transcurridos = (datetime.utcnow() - usuario.fecha_desactivacion).days
                dias_restantes = 30 - dias_transcurridos

            return {
                "error": "Tu cuenta ha sido desactivada",
                "codigo": "CUENTA_DESACTIVADA",
                "dias_restantes": dias_restantes if dias_restantes and dias_restantes > 0 else 0,
                "mensaje_adicional": "Puedes reactivarla ingresando tu contraseña" if dias_restantes and dias_restantes > 0 else "El período de recuperación ha expirado"
            }, 403

        if usuario.estado_cuenta == 'eliminado':
            return {
                "error": "Esta cuenta ha sido eliminada",
                "codigo": "CUENTA_ELIMINADA"
            }, 403

        # 3. Verificar que el correo está verificado
        if not usuario.correo_verificado:
            print(f"⚠️ Usuario no verificado: {correo}")
            return {
                "error": "Debes verificar tu correo antes de iniciar sesión",
                "codigo": "EMAIL_NOT_VERIFIED"
            }, 403

        # 4. Verificar la contraseña
        if not usuario.check_password(password):
            print(f"❌ Contraseña incorrecta para: {correo}")
            return {"error": "Credenciales inválidas"}, 401

        print(f"✅ Login exitoso: {correo} (rol: {usuario.rol})")

        # 5. Retornar los datos del usuario
        return {
            "mensaje": "Inicio de sesión exitoso",
            "usuario": {
                "id": usuario.id,
                "id_publico": usuario.id_publico,
                "nombre": usuario.nombre,
                "correo": usuario.correo,
                "rol": usuario.rol,
                "idioma": usuario.perfil.idioma if usuario.perfil else None,
                "nivel_actual": usuario.perfil.nivel_actual if usuario.perfil else None
            }
        }, 200

    def verificar_correo(self, correo, codigo):
        """Verifica el correo electrónico con el código enviado"""
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

        if usuario.codigo_verificacion == codigo:
            usuario.correo_verificado = True
            usuario.codigo_verificacion = None
            db.session.commit()
            return {"mensaje": "Correo verificado correctamente"}, 200

        return {"error": "Código incorrecto"}, 400

    def reenviar_codigo(self, correo):
        """Reenvía el código de verificación"""
        usuario = Usuario.query.filter_by(correo=correo).first()
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404

        if usuario.correo_verificado:
            return {"mensaje": "El correo ya fue verificado"}, 200

        codigo = str(random.randint(100000, 999999))
        usuario.codigo_verificacion = codigo
        usuario.expira_verificacion = datetime.utcnow()
        db.session.commit()

        enviar_codigo_verificacion(correo, codigo)
        return {"mensaje": "Código reenviado exitosamente"}, 200

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

        return {
            "mensaje": "Cuenta desactivada correctamente",
            "info": "Tu cuenta estará desactivada por 30 días. Después de ese período será eliminada permanentemente."
        }, 200

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
            db.session.delete(usuario)
            db.session.commit()
            return {"mensaje": "Cuenta eliminada permanentemente"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": f"Error al eliminar: {str(e)}"}, 500

    def reactivar_cuenta(self, usuario_id, password):
        """Reactiva una cuenta desactivada (antes de los 30 días)"""
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

        return {"mensaje": "Cuenta reactivada correctamente"}, 200