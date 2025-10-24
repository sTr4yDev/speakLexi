from config.database import db
from models.usuario import Usuario, PerfilUsuario
from services.correo_service import enviar_codigo_verificacion
from sqlalchemy.exc import IntegrityError
from datetime import datetime
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
        usuario = Usuario.query.filter_by(correo=correo).first()
        if not usuario or not usuario.check_password(password):
            return {"error": "Credenciales inválidas"}, 401
        return {
            "mensaje": "Inicio de sesión exitoso",
            "id_usuario": usuario.id,
            "id_publico": usuario.id_publico
        }, 200

    def verificar_correo(self, correo, codigo):
        usuario = Usuario.query.filter_by(correo=correo).first()
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404

        if usuario.correo_verificado:
            return {"mensaje": "El correo ya está verificado"}, 200

        if usuario.codigo_verificacion == codigo:
            usuario.correo_verificado = True
            usuario.codigo_verificacion = None
            db.session.commit()
            return {"mensaje": "Correo verificado correctamente"}, 200

        return {"error": "Código incorrecto"}, 400

    def reenviar_codigo(self, correo):
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
