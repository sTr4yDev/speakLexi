"""
Aplicación principal de SpeakLexi
Plataforma de aprendizaje de idiomas
"""

from flask import Flask
from flask_cors import CORS
from config.database import db
from extensions import mail

# ========== IMPORTAR BLUEPRINTS ==========
from routes.auth import auth_bp
from routes.usuario_routes import usuario_bp
from routes.leccion_routes import leccion_bp  # ✅ NUEVO
from routes.multimedia_routes import multimedia_bp  # ✅ NUEVO

# ========== IMPORTAR MODELOS ==========
from models.usuario import Usuario, PerfilUsuario
from models.leccion import Leccion, Actividad  # ✅ NUEVO
from models.multimedia import Multimedia, ConfiguracionMultimedia  # ✅ NUEVO

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

    # ========== CONFIGURACIÓN DE CORS MEJORADA ==========
    cors_origins = app.config.get('CORS_ORIGINS', ["http://localhost:3000"])
    CORS(app, resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-User-ID"],  # ✅ Agregado X-User-ID
            "expose_headers": ["Content-Type"],
            "supports_credentials": True,
            "max_age": 3600  # Cache preflight por 1 hora
        }
    })

    # ========== CONFIGURACIÓN PARA ARCHIVOS ==========
    # Tamaño máximo: 50 MB
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

    # Inicializar extensiones
    db.init_app(app)
    mail.init_app(app)

    # ========== REGISTRAR BLUEPRINTS ==========
    print("📋 Registrando blueprints...")
    app.register_blueprint(auth_bp)
    print("  ✅ auth_bp registrado en /api/auth")
    
    app.register_blueprint(usuario_bp)
    print("  ✅ usuario_bp registrado en /api/usuario")
    
    app.register_blueprint(leccion_bp)  # ✅ NUEVO
    print("  ✅ leccion_bp registrado en /api/lecciones")
    
    app.register_blueprint(multimedia_bp)  # ✅ NUEVO
    print("  ✅ multimedia_bp registrado en /api/multimedia")

    # Crear las tablas si no existen
    with app.app_context():
        try:
            db.create_all()
            print("✅ Tablas creadas correctamente en la base de datos SpeakLexi")
            
            # Verificar conexión
            db.session.execute(db.text('SELECT 1'))
            print(f"✅ Conexión exitosa a: {app.config['DB_NAME']}")
            
            # Verificar que existan tablas del módulo 2
            inspector = db.inspect(db.engine)
            tablas = inspector.get_table_names()
            
            if 'lecciones' in tablas and 'multimedia' in tablas:
                print("✅ Tablas del Módulo 2 detectadas correctamente")
            else:
                print("⚠️  Advertencia: Algunas tablas del Módulo 2 no existen")
            
        except Exception as e:
            print(f"❌ Error al inicializar la base de datos: {str(e)}")

    # ========== RUTAS PRINCIPALES ==========
    
    @app.route('/')
    def index():
        return {
            'message': '🎓 Bienvenido a SpeakLexi API',
            'version': '2.0.0',  # ✅ Actualizada versión
            'status': 'running',
            'modulos': {
                'modulo_1': 'Autenticación y Usuarios',
                'modulo_2': 'Lecciones y Multimedia'
            },
            'endpoints': {
                'auth': '/api/auth',
                'usuarios': '/api/usuario',
                'lecciones': '/api/lecciones',  # ✅ NUEVO
                'multimedia': '/api/multimedia'  # ✅ NUEVO
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

    # ========== MANEJO GLOBAL DE ERRORES ==========
    
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Recurso no encontrado'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Error interno del servidor'}, 500

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return {'error': 'El archivo es demasiado grande (máximo 50MB)'}, 413

    return app


if __name__ == "__main__":
    app = create_app()
    
    # Obtener puerto desde variables de entorno o usar 5000 por defecto
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True') == 'True'
    
    print("\n" + "="*60)
    print("🚀 Iniciando SpeakLexi Backend v2.0")
    print("="*60)
    print(f"📍 URL: http://localhost:{port}")
    print(f"🔧 Modo Debug: {'Activado' if debug else 'Desactivado'}")
    print(f"📦 Módulos activos: Autenticación, Usuarios, Lecciones, Multimedia")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)