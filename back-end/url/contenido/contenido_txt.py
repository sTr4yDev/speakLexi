# download_project_content.py
import requests
import os
import argparse
import json
from datetime import datetime
from colorama import Fore, Style, init
import time
import re

init(autoreset=True)

def sanitize_filename(filename):
    """Limpia el nombre de archivo para que sea válido en sistemas de archivos"""
    return re.sub(r'[<>:"/\\|?*]', '_', filename)

def download_file_content(url, max_retries=3):
    """Descarga el contenido de un archivo con reintentos"""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                return response.text
            elif response.status_code == 404:
                return f"# ERROR: Archivo no encontrado (404)\n# URL: {url}"
            elif response.status_code == 403:
                time.sleep(2)  # Esperar por rate limiting
                continue
            else:
                return f"# ERROR: Código {response.status_code}\n# URL: {url}"
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
            return f"# ERROR: {str(e)}\n# URL: {url}"
    
    return f"# ERROR: Fallo después de {max_retries} intentos\n# URL: {url}"

def get_project_structure(user, repo, branch="main"):
    """Obtiene la estructura del proyecto desde GitHub API"""
    url = f"https://api.github.com/repos/{user}/{repo}/git/trees/{branch}?recursive=1"
    
    token = os.getenv("GITHUB_TOKEN")
    headers = {"Authorization": f"token {token}"} if token else {}
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"{Fore.RED}❌ Error {response.status_code} al acceder al repositorio.{Style.RESET_ALL}")
        return []
    
    return response.json().get('tree', [])

def analyze_architecture(backend_files, frontend_files):
    """Analiza y documenta la arquitectura y conexiones entre frontend y backend"""
    
    architecture_content = []
    architecture_content.append("# ARQUITECTURA DEL PROYECTO - SpeakLexi")
    architecture_content.append(f"# Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Resumen de componentes
    architecture_content.append("## RESUMEN DE COMPONENTES")
    architecture_content.append(f"- Backend: {len(backend_files)} archivos")
    architecture_content.append(f"- Frontend: {len(frontend_files)} archivos")
    architecture_content.append("")
    
    # Análisis de endpoints y APIs
    architecture_content.append("## CONEXIONES BACKEND-FRONTEND")
    architecture_content.append("")
    
    # Buscar archivos de configuración y rutas en backend
    api_routes = []
    for file_info in backend_files:
        if any(keyword in file_info['path'].lower() for keyword in ['route', 'controller', 'api', 'endpoint']):
            api_routes.append(file_info)
    
    if api_routes:
        architecture_content.append("### ENDPOINTS DEL BACKEND")
        for route in api_routes:
            architecture_content.append(f"- **{route['path']}**")
        architecture_content.append("")
    
    # Buscar servicios y llamadas API en frontend
    api_calls = []
    for file_info in frontend_files:
        if any(keyword in file_info['path'].lower() for keyword in ['service', 'api', 'fetch', 'axios', 'http']):
            api_calls.append(file_info)
    
    if api_calls:
        architecture_content.append("### LLAMADAS API DESDE FRONTEND")
        for call in api_calls:
            architecture_content.append(f"- **{call['path']}**")
        architecture_content.append("")
    
    # Estructura de carpetas
    architecture_content.append("## ESTRUCTURA DE CARPETAS")
    
    backend_dirs = set()
    frontend_dirs = set()
    
    for file_info in backend_files:
        dir_path = os.path.dirname(file_info['path'])
        if dir_path:
            backend_dirs.add(dir_path)
    
    for file_info in frontend_files:
        dir_path = os.path.dirname(file_info['path'])
        if dir_path:
            frontend_dirs.add(dir_path)
    
    if backend_dirs:
        architecture_content.append("### BACKEND")
        for dir_path in sorted(backend_dirs):
            architecture_content.append(f"- `{dir_path}/`")
        architecture_content.append("")
    
    if frontend_dirs:
        architecture_content.append("### FRONTEND")
        for dir_path in sorted(frontend_dirs):
            architecture_content.append(f"- `{dir_path}/`")
        architecture_content.append("")
    
    # Flujo de datos
    architecture_content.append("## FLUJO DE DATOS")
    architecture_content.append("```")
    architecture_content.append("Frontend → API Calls → Backend Endpoints → Database/External Services")
    architecture_content.append("Backend → Responses → Frontend Components → User Interface")
    architecture_content.append("```")
    architecture_content.append("")
    
    # Tecnologías identificadas
    architecture_content.append("## TECNOLOGÍAS IDENTIFICADAS")
    
    backend_tech = set()
    frontend_tech = set()
    
    # Analizar extensiones de archivos para identificar tecnologías
    for file_info in backend_files:
        ext = os.path.splitext(file_info['path'])[1].lower()
        if ext == '.py':
            backend_tech.add('Python')
        elif ext == '.js':
            backend_tech.add('Node.js')
        elif ext == '.java':
            backend_tech.add('Java')
        elif ext == '.php':
            backend_tech.add('PHP')
    
    for file_info in frontend_files:
        ext = os.path.splitext(file_info['path'])[1].lower()
        if ext in ['.jsx', '.tsx']:
            frontend_tech.add('React')
        elif ext == '.vue':
            frontend_tech.add('Vue.js')
        elif ext == '.svelte':
            frontend_tech.add('Svelte')
        elif ext in ['.css', '.scss', '.sass']:
            frontend_tech.add('CSS/SCSS')
        elif ext == '.ts':
            frontend_tech.add('TypeScript')
    
    if backend_tech:
        architecture_content.append("### BACKEND")
        for tech in sorted(backend_tech):
            architecture_content.append(f"- {tech}")
        architecture_content.append("")
    
    if frontend_tech:
        architecture_content.append("### FRONTEND")
        for tech in sorted(frontend_tech):
            architecture_content.append(f"- {tech}")
        architecture_content.append("")
    
    return "\n".join(architecture_content)

def download_project_content(user, repo, branch="main", output_dir="project_content"):
    """Descarga el contenido completo del proyecto"""
    
    # Crear directorio de salida
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Obtener estructura del proyecto
    tree = get_project_structure(user, repo, branch)
    if not tree:
        return
    
    # Patrones para ignorar
    ignore_patterns = [
        'node_modules/', '__pycache__/', '.next/', 'venv/', 'env/', '.git/',
        'dist/', 'build/', '.env', 'package-lock.json', 'yarn.lock',
        '.vercel/', 'out/', '.gitignore', '.DS_Store', 'thumbs.db',
        '*.pyc', '*.log', '*.tmp'
    ]
    
    # Extensiones de archivo a procesar
    text_extensions = {
        '.py', '.tsx', '.ts', '.jsx', '.js', '.css', '.md', '.txt', 
        '.json', '.yml', '.yaml', '.xml', '.html', '.htm', '.sql',
        '.sh', '.bat', '.ps1', '.config', '.toml', '.ini'
    }
    
    backend_files = []
    frontend_files = []
    
    print(f"\n🔍 Escaneando proyecto: {Fore.CYAN}{repo}{Style.RESET_ALL}")
    print(f"📁 Generando archivos en: {output_dir}/\n")
    
    total_files = 0
    for item in tree:
        path = item['path']
        
        # Ignorar archivos no deseados
        if any(pattern in path for pattern in ignore_patterns):
            continue
        
        # Solo procesar archivos de texto
        file_ext = os.path.splitext(path)[1].lower()
        if file_ext not in text_extensions:
            continue
        
        total_files += 1
        raw_url = f"https://raw.githubusercontent.com/{user}/{repo}/{branch}/{path}"
        
        # Clasificar archivos
        if path.startswith('back-end/') or path.startswith('backend/'):
            backend_files.append({'path': path, 'url': raw_url})
            print(f"{Fore.GREEN}🐍 Backend:{Style.RESET_ALL} {path}")
        elif path.startswith('front-end/') or path.startswith('frontend/'):
            frontend_files.append({'path': path, 'url': raw_url})
            print(f"{Fore.MAGENTA}⚛️  Frontend:{Style.RESET_ALL} {path}")
        else:
            # Intentar clasificar por contenido o ubicación
            if any(keyword in path.lower() for keyword in ['api', 'server', 'controller', 'route', 'model']):
                backend_files.append({'path': path, 'url': raw_url})
                print(f"{Fore.GREEN}🐍 Backend:{Style.RESET_ALL} {path}")
            elif any(keyword in path.lower() for keyword in ['component', 'page', 'view', 'ui', 'src/']):
                frontend_files.append({'path': path, 'url': raw_url})
                print(f"{Fore.MAGENTA}⚛️  Frontend:{Style.RESET_ALL} {path}")
    
    print(f"\n📊 Total de archivos a procesar: {total_files}")
    
    # Crear archivos consolidados
    create_consolidated_files(backend_files, frontend_files, output_dir)
    
    return {
        "backend": backend_files,
        "frontend": frontend_files
    }

def create_consolidated_files(backend, frontend, output_dir):
    """Crea archivos consolidados: BACKEND, FRONTEND y ARQUITECTURA"""
    print(f"\n📦 Creando archivos consolidados...")
    
    # Backend consolidado
    if backend:
        with open(os.path.join(output_dir, 'BACKEND_COMPLETO.txt'), 'w', encoding='utf-8') as f:
            f.write("# BACKEND COMPLETO - SpeakLexi\n")
            f.write(f"# Total archivos: {len(backend)}\n")
            f.write(f"# Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            for file_info in backend:
                f.write(f"\n{'='*80}\n")
                f.write(f"# ARCHIVO: {file_info['path']}\n")
                f.write(f"# URL: {file_info['url']}\n")
                f.write(f"{'='*80}\n\n")
                content = download_file_content(file_info['url'])
                f.write(content)
                f.write("\n\n")
        print("  ✅ BACKEND_COMPLETO.txt")
    
    # Frontend consolidado
    if frontend:
        with open(os.path.join(output_dir, 'FRONTEND_COMPLETO.txt'), 'w', encoding='utf-8') as f:
            f.write("# FRONTEND COMPLETO - SpeakLexi\n")
            f.write(f"# Total archivos: {len(frontend)}\n")
            f.write(f"# Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            for file_info in frontend:
                f.write(f"\n{'='*80}\n")
                f.write(f"# ARCHIVO: {file_info['path']}\n")
                f.write(f"# URL: {file_info['url']}\n")
                f.write(f"{'='*80}\n\n")
                content = download_file_content(file_info['url'])
                f.write(content)
                f.write("\n\n")
        print("  ✅ FRONTEND_COMPLETO.txt")
    
    # Archivo de arquitectura
    if backend or frontend:
        architecture_content = analyze_architecture(backend, frontend)
        with open(os.path.join(output_dir, 'ARQUITECTURA.txt'), 'w', encoding='utf-8') as f:
            f.write(architecture_content)
        print("  ✅ ARQUITECTURA.txt")
    
    # Metadata JSON simplificada
    metadata = {
        "project": "SpeakLexi",
        "backend_files": len(backend),
        "frontend_files": len(frontend),
        "total_files": len(backend) + len(frontend),
        "generated": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "files": {
            "backend": [f["path"] for f in backend],
            "frontend": [f["path"] for f in frontend]
        }
    }
    
    with open(os.path.join(output_dir, 'metadata.json'), 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print("  ✅ metadata.json")

def main():
    parser = argparse.ArgumentParser(description="Descarga el contenido completo de un repositorio GitHub")
    parser.add_argument("user", help="Usuario o organización de GitHub")
    parser.add_argument("repo", help="Nombre del repositorio")
    parser.add_argument("--branch", default="main", help="Rama del repositorio")
    parser.add_argument("--output", default="project_content", help="Directorio de salida")
    
    args = parser.parse_args()
    
    start_time = time.time()
    
    try:
        result = download_project_content(
            args.user, 
            args.repo, 
            args.branch, 
            args.output
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n{'='*60}")
        print("🎉 DESCARGA COMPLETADA")
        print(f"{'='*60}")
        print(f"📁 Contenido guardado en: {args.output}/")
        print(f"⏱️  Tiempo total: {duration:.2f} segundos")
        print(f"📊 Archivos procesados:")
        print(f"   🐍 Backend: {len(result['backend'])} archivos")
        print(f"   ⚛️  Frontend: {len(result['frontend'])} archivos")
        print(f"   📦 Total: {len(result['backend']) + len(result['frontend'])} archivos")
        print(f"\n📋 Archivos generados:")
        print(f"   📄 BACKEND_COMPLETO.txt  - Todo el código backend")
        print(f"   📄 FRONTEND_COMPLETO.txt - Todo el código frontend")
        print(f"   📄 ARQUITECTURA.txt      - Análisis de conexiones y estructura")
        print(f"   📄 metadata.json         - Metadatos del proyecto")
        print(f"\n💡 Ahora puedes compartir los .txt con cualquier IA")
        print(f"{'='*60}")
        
    except Exception as e:
        print(f"{Fore.RED}❌ Error durante la descarga: {str(e)}{Style.RESET_ALL}")

if __name__ == "__main__":
    main()