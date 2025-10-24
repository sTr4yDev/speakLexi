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
