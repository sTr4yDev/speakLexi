"""
Script para crear perfiles faltantes de usuarios insertados manualmente
Ejecutar: python crear_perfiles_faltantes.py
"""

from app import app
from config.database import db
from models.usuario import Usuario, PerfilUsuario
from datetime import datetime

def crear_perfiles_faltantes():
    """Crea PerfilUsuario para todos los usuarios que no lo tengan"""
    
    with app.app_context():
        # Buscar usuarios sin perfil
        usuarios_sin_perfil = Usuario.query.filter(
            ~Usuario.perfil.has()  # No tiene perfil asociado
        ).all()
        
        if not usuarios_sin_perfil:
            print("✅ Todos los usuarios ya tienen perfil")
            return
        
        print(f"📋 Encontrados {len(usuarios_sin_perfil)} usuarios sin perfil")
        
        creados = 0
        errores = 0
        
        for usuario in usuarios_sin_perfil:
            try:
                # Construir nombre completo
                nombre_completo = f"{usuario.nombre} {usuario.primer_apellido}"
                if usuario.segundo_apellido:
                    nombre_completo += f" {usuario.segundo_apellido}"
                
                # Crear perfil con valores por defecto
                nuevo_perfil = PerfilUsuario(
                    usuario_id=usuario.id,
                    nombre_completo=nombre_completo.strip(),
                    id_publico=usuario.id_publico or f"USER_{usuario.id}",
                    idioma="Inglés",  # Valor por defecto
                    nivel_actual="A1",  # Valor por defecto
                    curso_actual="Inglés - A1",
                    total_xp=0,
                    dias_racha=0,
                    ultima_actividad=datetime.utcnow()
                )
                
                db.session.add(nuevo_perfil)
                creados += 1
                
                print(f"✅ Perfil creado para: {usuario.correo} (ID: {usuario.id})")
                
            except Exception as e:
                errores += 1
                print(f"❌ Error con usuario {usuario.id} ({usuario.correo}): {e}")
                db.session.rollback()
        
        # Guardar cambios
        try:
            db.session.commit()
            print(f"\n🎉 Proceso completado:")
            print(f"   - Perfiles creados: {creados}")
            print(f"   - Errores: {errores}")
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error al guardar cambios: {e}")

def verificar_perfiles():
    """Verifica el estado actual de usuarios y perfiles"""
    
    with app.app_context():
        total_usuarios = Usuario.query.count()
        total_perfiles = PerfilUsuario.query.count()
        usuarios_sin_perfil = Usuario.query.filter(~Usuario.perfil.has()).count()
        
        print("\n📊 Estado actual:")
        print(f"   - Total usuarios: {total_usuarios}")
        print(f"   - Total perfiles: {total_perfiles}")
        print(f"   - Usuarios sin perfil: {usuarios_sin_perfil}")
        
        if usuarios_sin_perfil > 0:
            print("\n⚠️  Hay usuarios sin perfil que necesitan ser corregidos")
        else:
            print("\n✅ Todos los usuarios tienen perfil")

if __name__ == "__main__":
    print("🔧 CORRECCIÓN DE PERFILES FALTANTES\n")
    
    # Verificar estado inicial
    verificar_perfiles()
    
    # Crear perfiles faltantes
    print("\n" + "="*50)
    crear_perfiles_faltantes()
    
    # Verificar estado final
    print("\n" + "="*50)
    verificar_perfiles()