# get_all_urls_optimized.py
import requests
import os
import argparse
import json
from datetime import datetime
from colorama import Fore, Style, init

init(autoreset=True)

def get_tree(user, repo, branch="main"):
    """Obtiene todos los archivos del repositorio (modo recursivo)"""
    url = f"https://api.github.com/repos/{user}/{repo}/git/trees/{branch}?recursive=1"

    # Token opcional (para evitar límites de API)
    token = os.getenv("GITHUB_TOKEN")
    headers = {"Authorization": f"token {token}"} if token else {}

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"{Fore.RED}❌ Error {response.status_code} al acceder al repositorio.{Style.RESET_ALL}")
        if response.status_code == 403:
            print("⚠️ Límite de solicitudes alcanzado o repositorio privado.")
        print("Verifica que el repositorio sea público o usa un token con GITHUB_TOKEN.\n")
        return [], [], []

    tree = response.json()
    backend_urls, frontend_urls, docs_urls = [], [], []

    # Carpetas/archivos a IGNORAR
    ignore_patterns = [
        'node_modules/', '__pycache__/', '.next/', 'venv/', 'env/', '.git/',
        'dist/', 'build/', '.env', 'package-lock.json', 'yarn.lock',
        '.vercel/', 'out/'
    ]

    print(f"\n🔍 Escaneando proyecto: {Fore.CYAN}{repo}{Style.RESET_ALL}\n")

    for item in tree.get('tree', []):
        path = item['path']
        if any(pattern in path for pattern in ignore_patterns):
            continue

        raw_url = f"https://raw.githubusercontent.com/{user}/{repo}/{branch}/{path}"

        # Backend
        if path.startswith('back-end/') and path.endswith('.py'):
            print(f"{Fore.GREEN}🐍 Backend:{Style.RESET_ALL} {path}")
            backend_urls.append({'path': path, 'url': raw_url})

        # Frontend
        elif path.startswith('front-end/'):
            if any(path.endswith(ext) for ext in ['.tsx', '.ts', '.jsx', '.js', '.css']):
                if not any(cfg in path for cfg in ['next.config', 'postcss.config', 'tailwind.config']):
                    print(f"{Fore.MAGENTA}⚛️  Frontend:{Style.RESET_ALL} {path}")
                    frontend_urls.append({'path': path, 'url': raw_url})

        # Docs
        elif path.startswith('docs/'):
            if any(path.endswith(ext) for ext in ['.md', '.txt', '.pdf']):
                print(f"{Fore.CYAN}📘 Docs:{Style.RESET_ALL} {path}")
                docs_urls.append({'path': path, 'url': raw_url})

    # ==== Resumen ====
    print("\n" + "="*60)
    print(f"✅ Backend:  {len(backend_urls)} archivos")
    print(f"✅ Frontend: {len(frontend_urls)} archivos")
    print(f"✅ Docs:     {len(docs_urls)} archivos")
    print(f"✅ Total:    {len(backend_urls) + len(frontend_urls) + len(docs_urls)} archivos")
    print("="*60)

    # ==== Guardado de archivos ====
    save_urls("urls_backend.txt", backend_urls, "BACKEND - SpeakLexi (Python/Flask)")
    save_urls("urls_frontend.txt", frontend_urls, "FRONTEND - SpeakLexi (Next.js/React/TypeScript)")
    save_urls("urls_docs.txt", docs_urls, "DOCUMENTACIÓN - SpeakLexi")

    # ==== Archivo completo ====
    save_combined(backend_urls, frontend_urls, docs_urls)

    # ==== JSON Export ====
    with open('urls_all.json', 'w', encoding='utf-8') as jf:
        json.dump({
            "backend": backend_urls,
            "frontend": frontend_urls,
            "docs": docs_urls,
            "generated": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }, jf, indent=2, ensure_ascii=False)
    print("💾 JSON: urls_all.json")

    return backend_urls, frontend_urls, docs_urls


def save_urls(filename, urls, title):
    if not urls:
        return
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# {title}\n")
        f.write(f"# Total: {len(urls)} archivos\n")
        f.write(f"# Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        for item in urls:
            f.write(item['url'] + '\n')
    print(f"💾 {filename}")


def save_combined(backend, frontend, docs):
    total = len(backend) + len(frontend) + len(docs)
    with open('urls_completo.txt', 'w', encoding='utf-8') as f:
        f.write(f"# PROYECTO COMPLETO - SpeakLexi\n")
        f.write(f"# Backend: {len(backend)} archivos\n")
        f.write(f"# Frontend: {len(frontend)} archivos\n")
        f.write(f"# Docs: {len(docs)} archivos\n")
        f.write(f"# Total: {total} archivos\n")
        f.write(f"# Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        for section, data in [
            ("BACKEND", backend),
            ("FRONTEND", frontend),
            ("DOCS", docs)
        ]:
            f.write("# " + "="*58 + "\n")
            f.write(f"# {section}\n")
            f.write("# " + "="*58 + "\n\n")
            for item in data:
                f.write(item['url'] + '\n')
            f.write("\n")

    print("💾 Completo: urls_completo.txt")


# ==== MAIN ====
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Genera URLs RAW de un repositorio de GitHub (organizadas por área).")
    parser.add_argument("user", help="Usuario o organización de GitHub")
    parser.add_argument("repo", help="Nombre del repositorio")
    parser.add_argument("--branch", default="main", help="Rama del repositorio (por defecto: main)")
    args = parser.parse_args()

    backend, frontend, docs = get_tree(args.user, args.repo, args.branch)

    print("\n" + "="*60)
    print("🎯 Archivos generados:")
    print("   📄 urls_backend.txt  - Solo backend organizado")
    print("   📄 urls_frontend.txt - Solo frontend organizado")
    print("   📄 urls_docs.txt     - Solo documentación")
    print("   📄 urls_completo.txt - Todo junto")
    print("   📄 urls_all.json     - Exportación en JSON")
    print("\n💡 Usa un token de GitHub (export GITHUB_TOKEN=tu_token) si el repo es grande o privado 🚀")
    print("="*60)
