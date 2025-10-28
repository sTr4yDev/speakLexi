# services/gestor_usuarios.py - Método registrar_usuario actualizado

def registrar_usuario(self, nombre, primer_apellido, segundo_apellido, correo, password, idioma="Inglés", nivel_actual="A1"):
    """
    Registra un nuevo usuario ESTUDIANTE.
    Crea:
    1. Usuario con rol='alumno'
    2. PerfilUsuario (base común)
    3. PerfilEstudiante (específico para estudiantes)
    """
    from models.usuario import Usuario, PerfilUsuario, PerfilEstudiante
    from config.database import db
    from datetime import datetime, timedelta
    import random
    import string
    
    try:
        # Validar que el correo no esté registrado
        usuario_existente = Usuario.query.filter_by(correo=correo).first()
        if usuario_existente:
            return {"error": "El correo ya está registrado"}, 400
        
        # Generar ID público
        id_publico = self._generar_id_publico()
        
        # Generar código de verificación
        codigo_verificacion = ''.join(random.choices(string.digits, k=6))
        expira_verificacion = datetime.now() + timedelta(hours=24)
        
        # 1. Crear usuario
        nuevo_usuario = Usuario(
            nombre=nombre,
            primer_apellido=primer_apellido,
            segundo_apellido=segundo_apellido,
            correo=correo,
            rol='alumno',  # Siempre alumno en el registro público
            id_publico=id_publico,
            codigo_verificacion=codigo_verificacion,
            expira_verificacion=expira_verificacion,
            correo_verificado=False,
            estado_cuenta='activo'
        )
        nuevo_usuario.set_password(password)
        db.session.add(nuevo_usuario)
        db.session.flush()  # Para obtener el ID
        
        # 2. Crear perfil base (común para todos)
        nombre_completo = f"{nombre} {primer_apellido}"
        if segundo_apellido:
            nombre_completo += f" {segundo_apellido}"
        
        perfil_base = PerfilUsuario(
            usuario_id=nuevo_usuario.id,
            nombre_completo=nombre_completo,
            id_publico=id_publico
        )
        db.session.add(perfil_base)
        
        # 3. Crear perfil específico de ESTUDIANTE
        perfil_estudiante = PerfilEstudiante(
            usuario_id=nuevo_usuario.id,
            nivel_actual=nivel_actual,
            idioma_aprendizaje=idioma,
            total_xp=0,
            nivel_usuario=1,
            dias_racha=0,
            racha_maxima=0,
            lecciones_completadas=0,
            tiempo_estudio_total=0,
            meta_diaria=30,
            notificaciones_habilitadas=True
        )
        db.session.add(perfil_estudiante)
        
        db.session.commit()
        
        # Enviar correo de verificación (si tienes configurado)
        try:
            self._enviar_correo_verificacion(correo, codigo_verificacion)
        except Exception as e:
            print(f"⚠️ Error al enviar correo de verificación: {e}")
            # No fallar el registro si el correo no se envía
        
        return {
            "mensaje": "Usuario registrado exitosamente. Por favor verifica tu correo electrónico.",
            "usuario": {
                "id": nuevo_usuario.id,
                "id_publico": id_publico,
                "correo": correo,
                "nombre_completo": nombre_completo
            }
        }, 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al registrar usuario: {e}")
        return {"error": f"Error al registrar usuario: {str(e)}"}, 500


def _generar_id_publico(self):
    """Genera un ID público único para el usuario"""
    import random
    import string
    from models.usuario import Usuario
    
    while True:
        # Formato: USR-XXXXX (5 caracteres alfanuméricos)
        caracteres = string.ascii_uppercase + string.digits
        codigo = ''.join(random.choices(caracteres, k=5))
        id_publico = f"USR-{codigo}"
        
        # Verificar que no exista
        if not Usuario.query.filter_by(id_publico=id_publico).first():
            return id_publico


def _enviar_correo_verificacion(self, correo, codigo):
    """
    Envía el correo de verificación al usuario.
    Implementa según tu servicio de correo (SMTP, SendGrid, etc.)
    """
    # TODO: Implementar envío de correo
    # Ejemplo básico con SMTP:
    # from flask_mail import Message
    # msg = Message(
    #     'Verifica tu cuenta en SpeakLexi',
    #     recipients=[correo],
    #     body=f'Tu código de verificación es: {codigo}'
    # )
    # mail.send(msg)
    pass