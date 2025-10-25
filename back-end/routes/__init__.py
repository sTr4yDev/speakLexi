from routes.auth import auth_bp
from routes.usuario_routes import usuario_bp

def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(usuario_bp)