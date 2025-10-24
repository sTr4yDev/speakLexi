from flask import Flask
from flask_cors import CORS
from config.database import db
from extensions import mail
from routes.auth import auth_bp
from routes.usuario_routes import usuario_bp
from models.usuario import Usuario, PerfilUsuario


def create_app():
    app = Flask(__name__)

    # Cargar configuración desde el archivo settings.py
    app.config.from_pyfile('config/settings.py')

    # Habilitar CORS para permitir comunicación con el frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Inicializar extensiones
    db.init_app(app)
    mail.init_app(app)

    # Registrar los blueprints de rutas
    app.register_blueprint(auth_bp)
    app.register_blueprint(usuario_bp)

    # Crear las tablas si no existen
    with app.app_context():
        db.create_all()
        print("✅ Tablas creadas correctamente en la base de datos SpeakLexi")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
