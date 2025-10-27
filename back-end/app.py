"""
Aplicación principal de SpeakLexi
Plataforma de aprendizaje de idiomas
"""

from flask import Flask
from flask_cors import CORS
from config.database import db
from extensions import mail
from routes.auth import auth_bp
from routes.usuario_routes import usuario_bp
from models.usuario import Usuario, PerfilUsuario
import os


def create_app():
    """
    Factory function para crear y configurar la aplicación Flask
    
    Returns:
        Flask: Instancia configurada de la aplicación
    """
    app = Flask(__name__)

    # Cargar configuración desde el archivo settings.py
    app.config.from_pyfile('config/settings.py')

    # Habilitar CORS para permitir comunicación con el frontend
    cors_origins = app.config.get('CORS_ORIGINS', ["http://localhost:3000"])
    CORS(app, resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  # ✅ Agregado PATCH
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Inicializar extensiones
    db.init_app(app)
    mail.init_app(app)

    # Registrar los blueprints de rutas
    app.register_blueprint(auth_bp)
    app.register_blueprint(usuario_bp)

    # Crear las tablas si no existen
    with app.app_context():
        try:
            db.create_all()
            print("✅ Tablas creadas correctamente en la base de datos SpeakLexi")
            
            # Verificar conexión
            db.session.execute(db.text('SELECT 1'))
            print(f"✅ Conexión exitosa a: {app.config['DB_NAME']}")
            
        except Exception as e:
            print(f"❌ Error al inicializar la base de datos: {str(e)}")

    # Rutas de prueba
    @app.route('/')
    def index():
        return {
            'message': '🎓 Bienvenido a SpeakLexi API',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'auth': '/api/auth',
                'usuarios': '/api/usuarios'
            }
        }

    @app.route('/health')
    def health():
        """Endpoint para verificar el estado del servidor"""
        try:
            # Verificar conexión a la base de datos
            db.session.execute(db.text('SELECT 1'))
            db_status = 'connected'
        except:
            db_status = 'disconnected'
        
        return {
            'status': 'healthy',
            'database': db_status,
            'mail': 'configured' if app.config.get('MAIL_USERNAME') else 'not configured'
        }

    return app


if __name__ == "__main__":
    app = create_app()
    
    # Obtener puerto desde variables de entorno o usar 5000 por defecto
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True') == 'True'
    
    print("\n" + "="*60)
    print("🚀 Iniciando SpeakLexi Backend")
    print("="*60)
    print(f"📍 URL: http://localhost:{port}")
    print(f"🔧 Modo Debug: {'Activado' if debug else 'Desactivado'}")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)