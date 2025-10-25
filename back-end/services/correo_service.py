from flask_mail import Message
from flask import current_app
from extensions import mail

def enviar_codigo_verificacion(correo_destino, codigo):
    try:
        msg = Message(
            subject="Verifica tu cuenta SpeakLexi",
            recipients=[correo_destino],
            body=f"Tu código de verificación es: {codigo}\n\nGracias por registrarte en SpeakLexi 🗣️"
        )
        mail.send(msg)
        print(f"📨 Código enviado a {correo_destino}: {codigo}")
        return True
    except Exception as e:
        print("❌ Error al enviar correo:", e)
        return False


def enviar_recuperacion_password(correo_destino, token):
    """Envía enlace de recuperación de contraseña con diseño HTML profesional"""
    try:
        # URL del frontend (ajustar según tu configuración)
        url_recuperacion = f"http://localhost:3000/restablecer-contrasena?token={token}"
        
        # Crear mensaje con HTML
        msg = Message(
            subject="Recuperación de Contraseña - SpeakLexi",
            recipients=[correo_destino]
        )
        
        # Cuerpo HTML del correo
        msg.html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #F9FAFB;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4F46E5; margin: 0;">🗣️ SpeakLexi</h1>
                    </div>
                    
                    <h2 style="color: #4F46E5; text-align: center;">Recuperación de Contraseña</h2>
                    
                    <p style="color: #374151; font-size: 16px;">Hola,</p>
                    
                    <p style="color: #374151; font-size: 16px;">
                        Recibimos una solicitud para restablecer la contraseña de tu cuenta en SpeakLexi.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{url_recuperacion}" 
                           style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    
                    <p style="color: #6B7280; font-size: 14px;">
                        O copia y pega este enlace en tu navegador:
                    </p>
                    <p style="background-color: #F3F4F6; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #4B5563;">
                        {url_recuperacion}
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                        <p style="color: #EF4444; font-size: 14px; font-weight: bold;">
                            ⚠️ Importante:
                        </p>
                        <ul style="color: #6B7280; font-size: 14px;">
                            <li>Este enlace expira en 1 hora</li>
                            <li>Si no solicitaste esto, ignora este correo</li>
                            <li>Tu contraseña no cambiará hasta que accedas al enlace</li>
                        </ul>
                    </div>
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 30px;">
                        © 2025 SpeakLexi - Plataforma de Aprendizaje de Idiomas
                    </p>
                </div>
            </body>
        </html>
        """
        
        # Texto plano como alternativa
        msg.body = f"""
        Recuperación de Contraseña - SpeakLexi
        
        Hola,
        
        Recibimos una solicitud para restablecer la contraseña de tu cuenta.
        
        Haz clic en el siguiente enlace para restablecer tu contraseña:
        {url_recuperacion}
        
        IMPORTANTE:
        - Este enlace expira en 1 hora
        - Si no solicitaste esto, ignora este correo
        - Tu contraseña no cambiará hasta que accedas al enlace
        
        Saludos,
        Equipo SpeakLexi
        """
        
        mail.send(msg)
        print(f"✅ Enlace de recuperación enviado a {correo_destino}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar correo de recuperación: {e}")
        return False