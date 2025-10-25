# En la consola de Python o crear un archivo test_routes.py
from app import create_app

app = create_app()

with app.app_context():
    print("Rutas disponibles:")
    for rule in app.url_map.iter_rules():
        if '/api/usuario' in str(rule):
            print(f"  {rule.methods} {rule}")

# back-end/url/test_routes.py