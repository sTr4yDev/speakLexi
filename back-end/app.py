from flask import Flask
from flask_cors import CORS
from config.database import db
from config.settings import Config
from extensions import mail

def create_app():
    """Factory para crear la aplicación Flask"""
    app = Flask(__name__)
    
    # Cargar configuración
    app.config.from_object(Config)
    
    # ✅ CONFIGURACIÓN DE CORS - INCLUYE PATCH
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": ["http://localhost:3000"],
                 "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # ✅ PATCH agregado
                 "allow_headers": ["Content-Type", "Authorization"],
                 "supports_credentials": True,
                 "expose_headers": ["Content-Type", "Authorization"],
                 "max_age": 3600
             }
         })
    
    # Inicializar extensiones
    db.init_app(app)
    mail.init_app(app)
    
    # Registrar blueprints
    from routes.auth import auth_bp
    from routes.usuario_routes import usuario_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(usuario_bp)
    
    # Crear tablas si no existen
    with app.app_context():
        db.create_all()
        print("✅ Base de datos inicializada")
    
    # Agregar headers CORS manualmente en cada respuesta (refuerzo adicional)
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    return app


if __name__ == '__main__':
    app = create_app()
    print("=" * 60)
    print("🚀 Servidor Flask iniciado en http://localhost:5000")
    print("📡 CORS habilitado para http://localhost:3000")
    print("✅ Métodos permitidos: GET, POST, PUT, DELETE, PATCH, OPTIONS")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)