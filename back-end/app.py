from flask import Flask
from flask_cors import CORS
from config.database import db
from extensions import mail
from routes.auth import auth_bp
from routes.usuario_routes import usuario_bp
from models.usuario import Usuario, PerfilUsuario


def create_app():
    app = Flask(__name__)

    # Cargar configuración
    app.config.from_pyfile('config/settings.py')

    # ✅ CORS - Permitir localhost:3000
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
            "allow_headers": ["Content-Type"]
        }
    })

    # Inicializar extensiones
    db.init_app(app)
    mail.init_app(app)

    # Registrar blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(usuario_bp)

    # Crear tablas
    with app.app_context():
        db.create_all()
        print("✅ Tablas creadas correctamente en la base de datos SpeakLexi")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
