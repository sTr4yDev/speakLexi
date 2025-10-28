"""
Gestor de Multimedia - SpeakLexi
Maneja toda la lógica de negocio relacionada con recursos multimedia
"""

from config.database import db
from models.multimedia import (
    Multimedia, TipoMultimedia, EstadoMultimedia,
    ConfiguracionMultimedia, CONFIGURACION_POR_DEFECTO
)
from models.leccion import Leccion
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import uuid
from pathlib import Path


class GestorMultimedia:
    """Gestiona operaciones CRUD y procesamiento de archivos multimedia"""
    
    def __init__(self):
        """Inicializa el gestor con configuraciones por defecto"""
        self._configuracion_inicializada = False
    
    def _asegurar_configuracion(self):
        """Inicializa la configuración solo cuando se necesita (lazy initialization)"""
        if not self._configuracion_inicializada:
            self._inicializar_configuracion()
            self._configuracion_inicializada = True
    
    def _inicializar_configuracion(self):
        """Carga configuración o crea valores por defecto"""
        for clave, valor in CONFIGURACION_POR_DEFECTO.items():
            config = ConfiguracionMultimedia.query.filter_by(clave=clave).first()
            if not config:
                ConfiguracionMultimedia.establecer_valor(
                    clave, 
                    valor, 
                    f"Configuración {clave}"
                )
    
    def subir_archivo(self, archivo, datos_adicionales, usuario_id):
        """
        Procesa y almacena un archivo multimedia.
        
        Args:
            archivo: Objeto de archivo (FileStorage de Flask)
            datos_adicionales (dict): Información adicional
                {
                    'descripcion': str,
                    'alt_text': str,
                    'categoria': str,
                    'etiquetas': list,
                    'transcripcion': str (opcional para audio/video)
                }
            usuario_id (int): ID del usuario que sube el archivo
        
        Returns:
            tuple: (dict con recurso creado, código HTTP)
        """
        self._asegurar_configuracion()
        
        try:
            # Validar archivo
            if not archivo:
                return {"error": "No se proporcionó ningún archivo"}, 400
            
            nombre_original = secure_filename(archivo.filename)
            if not nombre_original:
                return {"error": "Nombre de archivo inválido"}, 400
            
            # Detectar tipo MIME y tipo de recurso
            mime_type = archivo.content_type or 'application/octet-stream'
            tipo = self._detectar_tipo_multimedia(mime_type)
            
            if not tipo:
                return {
                    "error": f"Tipo de archivo no soportado: {mime_type}"
                }, 400
            
            # Validar tipo específico
            if not Multimedia.validar_tipo_archivo(mime_type, tipo):
                return {
                    "error": f"El tipo MIME {mime_type} no coincide con el tipo {tipo.value}"
                }, 400
            
            # Validar tamaño del archivo
            archivo.seek(0, os.SEEK_END)
            tamano = archivo.tell()
            archivo.seek(0)
            
            tamano_maximo = self._obtener_tamano_maximo(tipo)
            if tamano > tamano_maximo:
                tamano_mb = tamano / (1024 * 1024)
                max_mb = tamano_maximo / (1024 * 1024)
                return {
                    "error": f"Archivo muy grande ({tamano_mb:.2f} MB). Máximo: {max_mb:.2f} MB"
                }, 400
            
            # Generar nombre único
            nombre_almacenado = Multimedia.generar_nombre_unico(nombre_original)
            
            # Obtener ruta de almacenamiento
            ruta_base = ConfiguracionMultimedia.obtener_valor(
                'ruta_almacenamiento',
                'uploads/multimedia'
            )
            
            # Crear directorio si no existe
            ruta_completa = Path(ruta_base) / tipo.value
            ruta_completa.mkdir(parents=True, exist_ok=True)
            
            # Ruta del archivo
            ruta_archivo = ruta_completa / nombre_almacenado
            
            # Guardar archivo
            archivo.save(str(ruta_archivo))
            
            # Crear registro en base de datos
            nuevo_multimedia = Multimedia(
                nombre_archivo=nombre_original,
                nombre_almacenado=nombre_almacenado,
                tipo=tipo,
                mime_type=mime_type,
                categoria=datos_adicionales.get('categoria'),
                url=f"/{ruta_base}/{tipo.value}/{nombre_almacenado}",
                ruta_local=str(ruta_archivo),
                tamano=tamano,
                estado=EstadoMultimedia.DISPONIBLE,
                descripcion=datos_adicionales.get('descripcion'),
                alt_text=datos_adicionales.get('alt_text'),
                transcripcion=datos_adicionales.get('transcripcion'),
                etiquetas=datos_adicionales.get('etiquetas', []),
                meta_data={},
                subido_por=usuario_id
            )
            
            # Procesar metadata según tipo
            if tipo == TipoMultimedia.IMAGEN:
                dimensiones = self._obtener_dimensiones_imagen(ruta_archivo)
                nuevo_multimedia.dimensiones = dimensiones
                
                # Generar thumbnail si está configurado
                if ConfiguracionMultimedia.obtener_valor('generar_thumbnails') == 'true':
                    url_thumb = self._generar_thumbnail(ruta_archivo, nombre_almacenado, tipo)
                    nuevo_multimedia.url_thumbnail = url_thumb
            
            elif tipo in [TipoMultimedia.AUDIO, TipoMultimedia.VIDEO]:
                duracion = self._obtener_duracion_media(ruta_archivo)
                nuevo_multimedia.duracion = duracion
                
                if tipo == TipoMultimedia.VIDEO:
                    dimensiones = self._obtener_dimensiones_video(ruta_archivo)
                    nuevo_multimedia.dimensiones = dimensiones
            
            db.session.add(nuevo_multimedia)
            db.session.commit()
            
            return {
                "mensaje": "Archivo subido exitosamente",
                "multimedia": nuevo_multimedia.to_dict()
            }, 201
            
        except Exception as e:
            db.session.rollback()
            # Limpiar archivo si existe
            if 'ruta_archivo' in locals() and Path(ruta_archivo).exists():
                Path(ruta_archivo).unlink()
            
            return {"error": f"Error al subir archivo: {str(e)}"}, 500
    
    def obtener_recurso(self, multimedia_id, incluir_metadata=False):
        """
        Obtiene un recurso multimedia por su ID.
        
        Args:
            multimedia_id (int): ID del recurso
            incluir_metadata (bool): Si incluir metadata completa
        
        Returns:
            tuple: (dict con recurso o error, código HTTP)
        """
        multimedia = Multimedia.query.get(multimedia_id)
        
        if not multimedia:
            return {"error": "Recurso multimedia no encontrado"}, 404
        
        # Incrementar contador de uso
        multimedia.incrementar_uso()
        db.session.commit()
        
        return {
            "multimedia": multimedia.to_dict(incluir_metadata=incluir_metadata)
        }, 200
    
    def listar_recursos(self, filtros=None, pagina=1, por_pagina=20):
        """
        Lista recursos multimedia con filtros y paginación.
        
        Args:
            filtros (dict): Filtros opcionales
                {
                    'tipo': str,
                    'categoria': str,
                    'estado': str,
                    'buscar': str,
                    'etiqueta': str
                }
            pagina (int): Número de página
            por_pagina (int): Recursos por página
        
        Returns:
            tuple: (dict con recursos paginados, código HTTP)
        """
        try:
            query = Multimedia.query
            
            # Aplicar filtros
            if filtros:
                if filtros.get('tipo'):
                    try:
                        tipo = TipoMultimedia[filtros['tipo'].upper()]
                        query = query.filter_by(tipo=tipo)
                    except KeyError:
                        pass
                
                if filtros.get('categoria'):
                    query = query.filter_by(categoria=filtros['categoria'])
                
                if filtros.get('estado'):
                    try:
                        estado = EstadoMultimedia[filtros['estado'].upper()]
                        query = query.filter_by(estado=estado)
                    except KeyError:
                        pass
                
                if filtros.get('buscar'):
                    termino = f"%{filtros['buscar']}%"
                    query = query.filter(
                        or_(
                            Multimedia.nombre_archivo.ilike(termino),
                            Multimedia.descripcion.ilike(termino)
                        )
                    )
                
                if filtros.get('etiqueta'):
                    query = query.filter(
                        Multimedia.etiquetas.contains([filtros['etiqueta']])
                    )
            
            # Ordenar por fecha de creación
            query = query.order_by(Multimedia.creado_en.desc())
            
            # Paginar
            paginacion = query.paginate(
                page=pagina,
                per_page=por_pagina,
                error_out=False
            )
            
            return {
                "recursos": [recurso.to_dict() for recurso in paginacion.items],
                "total": paginacion.total,
                "pagina": paginacion.page,
                "paginas_totales": paginacion.pages,
                "tiene_siguiente": paginacion.has_next,
                "tiene_anterior": paginacion.has_prev
            }, 200
            
        except Exception as e:
            return {"error": f"Error al listar recursos: {str(e)}"}, 500
    
    def actualizar_recurso(self, multimedia_id, datos_actualizados):
        """
        Actualiza información de un recurso multimedia.
        
        Args:
            multimedia_id (int): ID del recurso
            datos_actualizados (dict): Datos a actualizar
        
        Returns:
            tuple: (dict con recurso actualizado, código HTTP)
        """
        try:
            multimedia = Multimedia.query.get(multimedia_id)
            
            if not multimedia:
                return {"error": "Recurso no encontrado"}, 404
            
            # Campos editables
            campos_editables = [
                'descripcion', 'alt_text', 'transcripcion',
                'etiquetas', 'categoria'
            ]
            
            for campo in campos_editables:
                if campo in datos_actualizados:
                    setattr(multimedia, campo, datos_actualizados[campo])
            
            multimedia.actualizado_en = datetime.utcnow()
            db.session.commit()
            
            return {
                "mensaje": "Recurso actualizado exitosamente",
                "multimedia": multimedia.to_dict()
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {"error": f"Error al actualizar recurso: {str(e)}"}, 500
    
    def eliminar_recurso(self, multimedia_id, eliminar_archivo=True):
        """
        Elimina un recurso multimedia.
        
        Args:
            multimedia_id (int): ID del recurso
            eliminar_archivo (bool): Si eliminar archivo físico
        
        Returns:
            tuple: (dict con resultado, código HTTP)
        """
        try:
            multimedia = Multimedia.query.get(multimedia_id)
            
            if not multimedia:
                return {"error": "Recurso no encontrado"}, 404
            
            # Verificar si está en uso
            if multimedia.lecciones.count() > 0:
                return {
                    "error": "El recurso está siendo usado en lecciones y no puede eliminarse"
                }, 400
            
            # Eliminar archivo físico si existe
            if eliminar_archivo and multimedia.ruta_local:
                ruta = Path(multimedia.ruta_local)
                if ruta.exists():
                    ruta.unlink()
                
                # Eliminar thumbnail si existe
                if multimedia.url_thumbnail:
                    ruta_thumb = Path(multimedia.url_thumbnail.lstrip('/'))
                    if ruta_thumb.exists():
                        ruta_thumb.unlink()
            
            db.session.delete(multimedia)
            db.session.commit()
            
            return {
                "mensaje": "Recurso eliminado exitosamente",
                "multimedia_id": multimedia_id
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {"error": f"Error al eliminar recurso: {str(e)}"}, 500
    
    def asociar_con_leccion(self, multimedia_id, leccion_id, orden=0):
        """
        Asocia un recurso multimedia con una lección.
        
        Args:
            multimedia_id (int): ID del recurso
            leccion_id (int): ID de la lección
            orden (int): Orden del recurso en la lección
        
        Returns:
            tuple: (dict con resultado, código HTTP)
        """
        try:
            multimedia = Multimedia.query.get(multimedia_id)
            leccion = Leccion.query.get(leccion_id)
            
            if not multimedia:
                return {"error": "Recurso multimedia no encontrado"}, 404
            
            if not leccion:
                return {"error": "Lección no encontrada"}, 404
            
            # Verificar si ya está asociado
            if multimedia in leccion.recursos_multimedia:
                return {
                    "mensaje": "El recurso ya está asociado con esta lección"
                }, 200
            
            leccion.recursos_multimedia.append(multimedia)
            multimedia.incrementar_uso()
            db.session.commit()
            
            return {
                "mensaje": "Recurso asociado exitosamente con la lección",
                "multimedia_id": multimedia_id,
                "leccion_id": leccion_id
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {"error": f"Error al asociar recurso: {str(e)}"}, 500
    
    def desasociar_de_leccion(self, multimedia_id, leccion_id):
        """
        Desasocia un recurso multimedia de una lección.
        
        Args:
            multimedia_id (int): ID del recurso
            leccion_id (int): ID de la lección
        
        Returns:
            tuple: (dict con resultado, código HTTP)
        """
        try:
            multimedia = Multimedia.query.get(multimedia_id)
            leccion = Leccion.query.get(leccion_id)
            
            if not multimedia or not leccion:
                return {"error": "Recurso o lección no encontrados"}, 404
            
            if multimedia in leccion.recursos_multimedia:
                leccion.recursos_multimedia.remove(multimedia)
                db.session.commit()
            
            return {
                "mensaje": "Recurso desasociado exitosamente",
                "multimedia_id": multimedia_id,
                "leccion_id": leccion_id
            }, 200
            
        except Exception as e:
            db.session.rollback()
            return {"error": f"Error al desasociar recurso: {str(e)}"}, 500
    
    # ========== MÉTODOS AUXILIARES ==========
    
    def _detectar_tipo_multimedia(self, mime_type):
        """
        Detecta el tipo de multimedia basado en MIME type.
        
        Args:
            mime_type (str): Tipo MIME
        
        Returns:
            TipoMultimedia o None
        """
        if mime_type.startswith('image/'):
            return TipoMultimedia.IMAGEN
        elif mime_type.startswith('audio/'):
            return TipoMultimedia.AUDIO
        elif mime_type.startswith('video/'):
            return TipoMultimedia.VIDEO
        elif mime_type in ['application/pdf', 'text/plain']:
            return TipoMultimedia.DOCUMENTO
        return None
    
    def _obtener_tamano_maximo(self, tipo):
        """
        Obtiene el tamaño máximo permitido para un tipo.
        
        Args:
            tipo (TipoMultimedia): Tipo de multimedia
        
        Returns:
            int: Tamaño máximo en bytes
        """
        claves = {
            TipoMultimedia.IMAGEN: 'max_tamano_imagen',
            TipoMultimedia.AUDIO: 'max_tamano_audio',
            TipoMultimedia.VIDEO: 'max_tamano_video',
            TipoMultimedia.DOCUMENTO: 'max_tamano_documento'
        }
        
        clave = claves.get(tipo, 'max_tamano_imagen')
        valor = ConfiguracionMultimedia.obtener_valor(clave, '5242880')
        
        return int(valor)
    
    def _obtener_dimensiones_imagen(self, ruta_archivo):
        """
        Obtiene dimensiones de una imagen.
        
        Args:
            ruta_archivo (Path): Ruta del archivo
        
        Returns:
            dict: {'ancho': int, 'alto': int} o None
        """
        try:
            try:
                from PIL import Image
            except ImportError:
                # PIL no está instalado, retornar None
                return None
            
            with Image.open(ruta_archivo) as img:
                return {
                    'ancho': img.width,
                    'alto': img.height
                }
        except Exception:
            return None
    
    def _obtener_dimensiones_video(self, ruta_archivo):
        """
        Obtiene dimensiones de un video.
        
        Args:
            ruta_archivo (Path): Ruta del archivo
        
        Returns:
            dict: {'ancho': int, 'alto': int} o None
        """
        # Requiere ffmpeg-python o similar
        # Implementación simplificada
        return None
    
    def _obtener_duracion_media(self, ruta_archivo):
        """
        Obtiene duración de audio/video.
        
        Args:
            ruta_archivo (Path): Ruta del archivo
        
        Returns:
            int: Duración en segundos o None
        """
        # Requiere ffmpeg-python o similar
        # Implementación simplificada
        return None
    
    def _generar_thumbnail(self, ruta_archivo, nombre_almacenado, tipo):
        """
        Genera thumbnail para imagen o video.
        
        Args:
            ruta_archivo (Path): Ruta del archivo original
            nombre_almacenado (str): Nombre del archivo
            tipo (TipoMultimedia): Tipo de multimedia
        
        Returns:
            str: URL del thumbnail o None
        """
        try:
            if tipo != TipoMultimedia.IMAGEN:
                return None
            
            from PIL import Image
            
            ancho = int(ConfiguracionMultimedia.obtener_valor('thumbnail_ancho', '300'))
            alto = int(ConfiguracionMultimedia.obtener_valor('thumbnail_alto', '300'))
            
            # Crear directorio de thumbnails
            ruta_base = ConfiguracionMultimedia.obtener_valor(
                'ruta_almacenamiento',
                'uploads/multimedia'
            )
            ruta_thumbs = Path(ruta_base) / 'thumbnails'
            ruta_thumbs.mkdir(parents=True, exist_ok=True)
            
            # Generar thumbnail
            nombre_thumb = f"thumb_{nombre_almacenado}"
            ruta_thumb = ruta_thumbs / nombre_thumb
            
            with Image.open(ruta_archivo) as img:
                img.thumbnail((ancho, alto), Image.Resampling.LANCZOS)
                img.save(ruta_thumb, quality=85)
            
            return f"/{ruta_base}/thumbnails/{nombre_thumb}"
            
        except Exception:
            return None
    
    # ========== ESTADÍSTICAS ==========
    
    def obtener_estadisticas(self):
        """
        Obtiene estadísticas generales de multimedia.
        
        Returns:
            tuple: (dict con estadísticas, código HTTP)
        """
        try:
            total = Multimedia.query.count()
            
            por_tipo = {}
            for tipo in TipoMultimedia:
                count = Multimedia.query.filter_by(tipo=tipo).count()
                por_tipo[tipo.value] = count
            
            por_estado = {}
            for estado in EstadoMultimedia:
                count = Multimedia.query.filter_by(estado=estado).count()
                por_estado[estado.value] = count
            
            # Tamaño total
            tamano_total = db.session.query(
                db.func.sum(Multimedia.tamano)
            ).scalar() or 0
            
            # Recursos más usados
            mas_usados = Multimedia.query.order_by(
                Multimedia.veces_usado.desc()
            ).limit(10).all()
            
            return {
                "total_recursos": total,
                "por_tipo": por_tipo,
                "por_estado": por_estado,
                "tamano_total_bytes": tamano_total,
                "tamano_total_mb": round(tamano_total / (1024 * 1024), 2),
                "mas_usados": [
                    {
                        "id": r.id,
                        "nombre": r.nombre_archivo,
                        "tipo": r.tipo.value,
                        "veces_usado": r.veces_usado
                    }
                    for r in mas_usados
                ]
            }, 200
            
        except Exception as e:
            return {"error": f"Error al obtener estadísticas: {str(e)}"}, 500


# Instancia global del gestor (SIN inicializar configuración hasta que se use)
gestor_multimedia = GestorMultimedia()