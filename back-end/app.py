from flask import Flask, redirect
from flask_cors import CORS
from config.settings import Config
from config.database import init_db
from extensions import db, bcrypt, jwt, mail
from flask_jwt_extended import JWTManager  # ✅ Asegura que JWTManager esté disponible
import logging
from logging.handlers import RotatingFileHandler
import os

# Importar blueprints
from routes.auth import auth_bp
from routes.usuario_routes import usuario_bp
from routes.leccion_routes import leccion_bp
from routes.multimedia_routes import multimedia_bp

def create_app(config_class=Config):
    """Factory para crear la aplicación Flask"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # FIX CRÍTICO: Deshabilitar trailing slash redirect
    app.url_map.strict_slashes = False
    
    # ========================================
    # CONFIGURACIÓN CORS
    # ========================================
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization", "x-user-id"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # ========================================
    # INICIALIZAR EXTENSIONES
    # ========================================
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

    # ========================================
    # CONFIGURAR JWT (EVITA "Subject must be a string")
    # ========================================
    @jwt.user_identity_loader
    def user_identity_lookup(identity):
        """Convierte cualquier identidad numérica en string para evitar errores con JWT"""
        return str(identity)

    # ========================================
    # LOGGING
    # ========================================
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        file_handler = RotatingFileHandler(
            'logs/speaklexi.log',
            maxBytes=10240000,
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('SpeakLexi startup')
    
    # ========================================
    # BEFORE REQUEST FIXES
    # ========================================
    @app.before_request
    def handle_request_fixes():
        from flask import request
        
        # Flask-CORS ya maneja OPTIONS, no se necesita interceptar
        if request.path != '/' and request.path.endswith('/'):
            return redirect(request.path[:-1], code=308)
    
    # ========================================
    # REGISTRAR BLUEPRINTS
    # ========================================
    app.register_blueprint(auth_bp)
    app.register_blueprint(usuario_bp)
    app.register_blueprint(leccion_bp)
    app.register_blueprint(multimedia_bp)
    
    # ========================================
    # CREAR TABLAS Y DATOS INICIALES
    # ========================================
    with app.app_context():
        init_db()
    
    # ========================================
    # ENDPOINTS BÁSICOS
    # ========================================
    @app.route('/')
    def index():
        return {
            'mensaje': 'API SpeakLexi funcionando correctamente',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'usuario': '/api/usuario',
                'lecciones': '/api/lecciones',
                'multimedia': '/api/multimedia'
            }
        }
    
    @app.route('/health')
    def health():
        """Endpoint de health check"""
        return {'status': 'healthy', 'database': 'connected'}
    
    @app.errorhandler(404)
    def not_found(error):
        return {
            'error': 'Endpoint no encontrado',
            'mensaje': str(error)
        }, 404
    
    return app

# Crear la aplicación
app = create_app()

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
