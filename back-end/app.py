# back-end/app.py
from flask import Flask, redirect
from flask_cors import CORS
from config.settings import Config
from config.database import init_db
from extensions import db, bcrypt, jwt, mail
from flask_jwt_extended import JWTManager
import logging
from logging.handlers import RotatingFileHandler
import os

# ========================================
# ⭐ IMPORTAR TODOS LOS MODELOS
# ========================================
from models.usuario import Usuario, PerfilUsuario, PerfilEstudiante, PerfilProfesor, PerfilAdministrador
from models.leccion import Leccion, Actividad, leccion_multimedia
from models.multimedia import Multimedia, ConfiguracionMultimedia
from models.cursos import Curso, ProgresoCurso

# ========================================
# IMPORTAR BLUEPRINTS
# ========================================
from routes.auth import auth_bp
from routes.usuario_routes import usuario_bp
from routes.leccion_routes import leccion_bp
from routes.multimedia_routes import multimedia_bp
from routes.curso_routes import curso_bp


def create_app(config_class=Config):
    """Factory para crear la aplicación Flask"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # ========================================
    # 🔥 CONFIGURACIÓN CRÍTICA PARA MULTIMEDIA
    # ========================================
    app.url_map.strict_slashes = False
    
    # ✅ CONFIGURAR LÍMITE DE ARCHIVOS (50MB)
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
    
    # ✅ CONFIGURAR CARPETA DE UPLOADS
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads', 'multimedia')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_FOLDER, 'imagen'), exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_FOLDER, 'audio'), exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_FOLDER, 'video'), exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_FOLDER, 'documento'), exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_FOLDER, 'thumbnails'), exist_ok=True)
    
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    
    print(f"\n📁 CARPETAS DE MULTIMEDIA CREADAS EN: {UPLOAD_FOLDER}\n")
    
    # ========================================
    # CONFIGURACIÓN CORS
    # ========================================
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:3001"],
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
    # CONFIGURAR JWT
    # ========================================
    @jwt.user_identity_loader
    def user_identity_lookup(identity):
        return str(identity)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return Usuario.query.filter_by(id=int(identity)).one_or_none()

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
        
        if request.path != '/' and request.path.endswith('/'):
            return redirect(request.path[:-1], code=308)
    
    # ========================================
    # REGISTRAR BLUEPRINTS
    # ========================================
    app.register_blueprint(auth_bp)
    app.register_blueprint(usuario_bp)
    app.register_blueprint(leccion_bp)
    app.register_blueprint(multimedia_bp)
    app.register_blueprint(curso_bp)
    
    # Log de rutas registradas
    if app.debug:
        print("\n" + "="*60)
        print("📋 RUTAS REGISTRADAS:")
        print("="*60)
        for rule in app.url_map.iter_rules():
            if rule.endpoint != 'static':
                methods = ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
                print(f"{methods:20s} {rule}")
        print("="*60 + "\n")
    
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
            'version': '3.0.0',
            'modulos': {
                'autenticacion': '✅',
                'usuarios': '✅',
                'cursos': '✅',
                'lecciones': '✅',
                'actividades': '✅',
                'multimedia': '✅',
                'progreso': '✅'
            },
            'endpoints': {
                'auth': '/api/auth',
                'usuarios': '/api/usuario',
                'cursos': '/api/cursos',
                'lecciones': '/api/lecciones',
                'multimedia': '/api/multimedia'
            }
        }
    
    @app.route('/health')
    def health():
        """Endpoint de health check"""
        try:
            db.session.execute(db.text('SELECT 1'))
            
            total_usuarios = Usuario.query.count()
            total_cursos = Curso.query.count()
            total_lecciones = Leccion.query.count()
            total_actividades = Actividad.query.count()
            total_multimedia = Multimedia.query.count()
            
            return {
                'status': 'healthy',
                'database': 'connected',
                'version': '3.0.0',
                'recursos': {
                    'usuarios': total_usuarios,
                    'cursos': total_cursos,
                    'lecciones': total_lecciones,
                    'actividades': total_actividades,
                    'multimedia': total_multimedia
                }
            }
        except Exception as e:
            app.logger.error(f'Health check failed: {str(e)}')
            return {
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e)
            }, 503
    
    @app.errorhandler(404)
    def not_found(error):
        return {
            'success': False,
            'error': 'Endpoint no encontrado'
        }, 404
    
    @app.errorhandler(413)
    def file_too_large(error):
        return {
            'success': False,
            'error': 'Archivo muy grande. Máximo: 50MB'
        }, 413
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        app.logger.error(f'Internal error: {str(error)}')
        return {
            'success': False,
            'error': 'Error interno del servidor'
        }, 500
    
    return app


# ========================================
# CREAR LA APLICACIÓN
# ========================================
app = create_app()

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 INICIANDO SPEAKLEXI v3.0")
    print("="*60)
    print(f"🌐 Servidor: http://localhost:5000")
    print(f"📝 Documentación: http://localhost:5000/")
    print(f"💚 Health check: http://localhost:5000/health")
    print(f"📤 Subir Multimedia: POST /api/multimedia/upload")
    print("="*60)
    print("📦 Módulos Cargados:")
    print("   ✅ Autenticación (JWT)")
    print("   ✅ Usuarios y Perfiles")
    print("   ✅ Sistema de Cursos (A1-C2)")
    print("   ✅ Lecciones Dinámicas")
    print("   ✅ Actividades Gamificadas")
    print("   ✅ Multimedia (Imágenes/Audio/Video)")
    print("   ✅ Seguimiento de Progreso")
    print("="*60)
    print("👥 Usuarios Demo:")
    print("   📧 estudiante@speaklexi.com / estudiante123")
    print("   📧 profesor@speaklexi.com / profesor123")
    print("   📧 admin@speaklexi.com / admin123")
    print("="*60 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )