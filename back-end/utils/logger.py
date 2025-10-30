"""
Sistema de logging mejorado para SpeakLexi
Facilita el debugging y seguimiento de errores
"""

import logging
import os
from datetime import datetime
from typing import Optional
from logging.handlers import RotatingFileHandler


# Colores para terminal
class LogColors:
    """Códigos de color ANSI para terminal"""
    RESET = '\033[0m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    GRAY = '\033[90m'


class ColoredFormatter(logging.Formatter):
    """Formateador con colores para la consola"""
    
    COLORS = {
        'DEBUG': LogColors.GRAY,
        'INFO': LogColors.CYAN,
        'WARNING': LogColors.YELLOW,
        'ERROR': LogColors.RED,
        'CRITICAL': LogColors.MAGENTA
    }
    
    def format(self, record):
        # Agregar color al nivel
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = f"{self.COLORS[levelname]}{levelname}{LogColors.RESET}"
        
        return super().format(record)


def configurar_logger(
    nombre: str = 'speaklexi',
    nivel: str = 'INFO',
    archivo_log: Optional[str] = 'logs/speaklexi.log'
) -> logging.Logger:
    """
    Configura el sistema de logging
    
    Args:
        nombre: Nombre del logger
        nivel: Nivel de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        archivo_log: Ruta del archivo de log (None para desactivar)
    
    Returns:
        Logger configurado
    """
    # Crear logger
    logger = logging.getLogger(nombre)
    logger.setLevel(getattr(logging, nivel.upper()))
    
    # Limpiar handlers existentes
    logger.handlers.clear()
    
    # Formato para logs
    formato_consola = '%(levelname)s | %(name)s | %(message)s'
    formato_archivo = '%(asctime)s | %(levelname)s | %(name)s | %(funcName)s:%(lineno)d | %(message)s'
    
    # Handler para consola con colores
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(ColoredFormatter(formato_consola))
    logger.addHandler(console_handler)
    
    # Handler para archivo (si está configurado)
    if archivo_log:
        # Crear directorio si no existe
        os.makedirs(os.path.dirname(archivo_log), exist_ok=True)
        
        file_handler = RotatingFileHandler(
            archivo_log,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(logging.Formatter(formato_archivo))
        logger.addHandler(file_handler)
    
    return logger


# Logger global para la aplicación
logger = configurar_logger()


# ==========================================
# FUNCIONES DE CONVENIENCIA
# ==========================================

def log_info(mensaje: str, **contexto):
    """
    Log de información con contexto adicional
    
    Args:
        mensaje: Mensaje a loguear
        **contexto: Datos adicionales de contexto
    
    Ejemplo:
        log_info("Usuario creado", usuario_id=123, email="user@example.com")
    """
    if contexto:
        contexto_str = " | ".join(f"{k}={v}" for k, v in contexto.items())
        mensaje = f"{mensaje} | {contexto_str}"
    logger.info(mensaje)


def log_warning(mensaje: str, **contexto):
    """Log de advertencia con contexto"""
    if contexto:
        contexto_str = " | ".join(f"{k}={v}" for k, v in contexto.items())
        mensaje = f"{mensaje} | {contexto_str}"
    logger.warning(mensaje)


def log_error(mensaje: str, exc: Optional[Exception] = None, **contexto):
    """
    Log de error con contexto y excepción
    
    Args:
        mensaje: Mensaje de error
        exc: Excepción capturada (opcional)
        **contexto: Datos adicionales
    
    Ejemplo:
        try:
            # código que puede fallar
        except Exception as e:
            log_error("Error al procesar", exc=e, usuario_id=123)
    """
    if contexto:
        contexto_str = " | ".join(f"{k}={v}" for k, v in contexto.items())
        mensaje = f"{mensaje} | {contexto_str}"
    
    if exc:
        logger.error(f"{mensaje} | Exception: {str(exc)}", exc_info=True)
    else:
        logger.error(mensaje)


def log_debug(mensaje: str, **contexto):
    """Log de debug con contexto"""
    if contexto:
        contexto_str = " | ".join(f"{k}={v}" for k, v in contexto.items())
        mensaje = f"{mensaje} | {contexto_str}"
    logger.debug(mensaje)


def log_critico(mensaje: str, exc: Optional[Exception] = None, **contexto):
    """Log de error crítico"""
    if contexto:
        contexto_str = " | ".join(f"{k}={v}" for k, v in contexto.items())
        mensaje = f"{mensaje} | {contexto_str}"
    
    if exc:
        logger.critical(f"{mensaje} | Exception: {str(exc)}", exc_info=True)
    else:
        logger.critical(mensaje)


# ==========================================
# DECORADOR PARA LOGGING AUTOMÁTICO
# ==========================================

def log_function_call(func):
    """
    Decorador para loguear llamadas a funciones
    
    Ejemplo:
        @log_function_call
        def mi_funcion(arg1, arg2):
            # código
    """
    def wrapper(*args, **kwargs):
        func_name = func.__name__
        log_debug(f"Llamando {func_name}", args=str(args)[:100], kwargs=str(kwargs)[:100])
        
        try:
            resultado = func(*args, **kwargs)
            log_debug(f"✓ {func_name} completado")
            return resultado
        except Exception as e:
            log_error(f"✗ Error en {func_name}", exc=e)
            raise
    
    return wrapper


# ==========================================
# LOGGING DE REQUESTS HTTP
# ==========================================

def log_request(request, usuario_id: Optional[int] = None):
    """
    Log de request HTTP
    
    Args:
        request: Objeto request de Flask
        usuario_id: ID del usuario (opcional)
    """
    contexto = {
        'metodo': request.method,
        'ruta': request.path,
        'ip': request.remote_addr
    }
    
    if usuario_id:
        contexto['usuario_id'] = usuario_id
    
    log_info("Request HTTP", **contexto)


def log_response(request, status_code: int, tiempo_ms: Optional[float] = None):
    """
    Log de response HTTP
    
    Args:
        request: Objeto request de Flask
        status_code: Código de estado HTTP
        tiempo_ms: Tiempo de respuesta en milisegundos (opcional)
    """
    contexto = {
        'metodo': request.method,
        'ruta': request.path,
        'status': status_code
    }
    
    if tiempo_ms:
        contexto['tiempo_ms'] = f"{tiempo_ms:.2f}"
    
    # Nivel de log según status code
    if status_code >= 500:
        log_error("Response HTTP", **contexto)
    elif status_code >= 400:
        log_warning("Response HTTP", **contexto)
    else:
        log_info("Response HTTP", **contexto)


# ==========================================
# LOGGING DE OPERACIONES DE BD
# ==========================================

def log_db_operation(operacion: str, modelo: str, **contexto):
    """
    Log de operación de base de datos
    
    Args:
        operacion: Tipo de operación (CREATE, READ, UPDATE, DELETE)
        modelo: Nombre del modelo
        **contexto: Datos adicionales
    
    Ejemplo:
        log_db_operation("CREATE", "Leccion", leccion_id=123, titulo="Mi lección")
    """
    log_info(f"DB {operacion}", modelo=modelo, **contexto)


def log_db_error(operacion: str, modelo: str, exc: Exception, **contexto):
    """
    Log de error en operación de BD
    
    Args:
        operacion: Tipo de operación
        modelo: Nombre del modelo
        exc: Excepción capturada
        **contexto: Datos adicionales
    """
    log_error(f"DB {operacion} ERROR", exc=exc, modelo=modelo, **contexto)


# ==========================================
# MENSAJES DE INICIO/CIERRE
# ==========================================

def log_startup(app_name: str, version: str, debug: bool = False):
    """
    Log de inicio de aplicación
    
    Args:
        app_name: Nombre de la aplicación
        version: Versión
        debug: Modo debug activado
    """
    logger.info("=" * 60)
    logger.info(f"🚀 {app_name} v{version} - Iniciando")
    logger.info("=" * 60)
    logger.info(f"Modo: {'DESARROLLO' if debug else 'PRODUCCIÓN'}")
    logger.info(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)


def log_shutdown(app_name: str):
    """Log de cierre de aplicación"""
    logger.info("=" * 60)
    logger.info(f"🛑 {app_name} - Cerrando")
    logger.info("=" * 60)


# ==========================================
# EJEMPLO DE USO
# ==========================================

if __name__ == "__main__":
    # Ejemplos de uso
    log_info("Aplicación iniciada")
    log_debug("Este es un mensaje de debug")
    log_warning("Esto es una advertencia", usuario_id=123)
    
    try:
        # Simular error
        raise ValueError("Error de ejemplo")
    except Exception as e:
        log_error("Ocurrió un error", exc=e, contexto="ejemplo")
    
    log_db_operation("CREATE", "Usuario", usuario_id=123, email="test@example.com")
    
    logger.info("Ejemplos completados")