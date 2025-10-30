"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Loader2, Plus, X, Edit, Trash2, Upload, Image, Music, Video, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ActivityModal } from "@/components/admin/activity-modal"

// Tipos
type TipoActividad = 'multiple_choice' | 'fill_blank' | 'matching' | 'translation' | 'true_false' | 'word_order' | 'listen_repeat'
type NivelLeccion = 'principiante' | 'intermedio' | 'avanzado'

const TIPOS_ACTIVIDAD = [
  { value: 'multiple_choice', label: '🎯 Opción múltiple', icon: '🎯' },
  { value: 'fill_blank', label: '✏️ Completar espacios', icon: '✏️' },
  { value: 'matching', label: '🔗 Emparejar', icon: '🔗' },
  { value: 'translation', label: '🌐 Traducción', icon: '🌐' },
  { value: 'true_false', label: '✓✗ Verdadero/Falso', icon: '✓' },
  { value: 'word_order', label: '📝 Ordenar palabras', icon: '📝' },
] as const

interface Curso {
  id: number
  nombre: string
  nivel: string
  codigo: string
  idioma: string
}

interface Actividad {
  tipo: TipoActividad
  pregunta: string
  instrucciones?: string
  opciones: any
  respuesta_correcta: any
  retroalimentacion?: any
  pista?: string
  puntos: number
  orden: number
  multimedia_id?: number
}

interface ArchivoMultimedia {
  file: File
  id: string
  preview?: string
}

interface MultimediaSubido {
  id: number
  nombre_archivo: string
  tipo: string
  url: string
}

interface FormData {
  curso_id: number | null
  titulo: string
  descripcion: string
  nivel: NivelLeccion
  idioma: string
  categoria: string
  duracion_estimada: number
  puntos_xp: number
  orden: number
  contenido: {
    objetivos: string[]
    vocabulario_clave: string[]
    introduccion: string
    ejemplos: string[]
  }
  etiquetas: string[]
  actividades: Actividad[]
  multimedia_ids: number[]
}

export function CreateLessonForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)
  
  // Estados para modal de actividades
  const [modalActividadOpen, setModalActividadOpen] = useState(false)
  const [tipoActividadModal, setTipoActividadModal] = useState<TipoActividad | null>(null)
  const [actividadEditando, setActividadEditando] = useState<Actividad | null>(null)
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null)
  
  // Estados para multimedia
  const [archivosMultimedia, setArchivosMultimedia] = useState<ArchivoMultimedia[]>([])
  const [subiendoArchivos, setSubiendoArchivos] = useState(false)
  const [archivosSubidos, setArchivosSubidos] = useState<MultimediaSubido[]>([])
  
  // Estado del formulario
  const [formData, setFormData] = useState<FormData>({
    curso_id: null,
    titulo: "",
    descripcion: "",
    nivel: "principiante",
    idioma: "ingles",
    categoria: "",
    duracion_estimada: 10,
    puntos_xp: 50,
    orden: 0,
    contenido: {
      objetivos: [],
      vocabulario_clave: [],
      introduccion: "",
      ejemplos: []
    },
    etiquetas: [],
    actividades: [],
    multimedia_ids: []
  })

  // Estados temporales para inputs
  const [objetivoTemp, setObjetivoTemp] = useState("")
  const [vocabularioTemp, setVocabularioTemp] = useState("")
  const [etiquetaTemp, setEtiquetaTemp] = useState("")

  // Cargar cursos al montar el componente
  useEffect(() => {
    cargarCursos()
  }, [])

  const cargarCursos = async () => {
    try {
      setLoadingCursos(true)
      const response = await fetch('http://localhost:5000/api/cursos?activo=true', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Error al cargar cursos')
      
      const data = await response.json()
      setCursos(data.cursos || [])
      
      if (data.cursos?.length > 0) {
        toast.success(`${data.cursos.length} cursos cargados`)
      } else {
        toast.warning('No hay cursos disponibles. Crea un curso primero.')
      }
    } catch (error: any) {
      console.error('❌ Error:', error)
      toast.error(error.message || 'Error al cargar cursos')
    } finally {
      setLoadingCursos(false)
    }
  }

  // Mapear nivel del curso a nivel de lección
  const mapearNivelCursoALeccion = (nivelCurso: string): NivelLeccion => {
    if (['A1', 'A2'].includes(nivelCurso)) return 'principiante'
    if (['B1', 'B2'].includes(nivelCurso)) return 'intermedio'
    return 'avanzado'
  }

  // ========== MANEJO DE ARCHIVOS MULTIMEDIA ==========
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    
    const nuevosArchivos = Array.from(e.target.files).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }))
    
    setArchivosMultimedia(prev => [...prev, ...nuevosArchivos])
    toast.success(`${nuevosArchivos.length} archivo(s) seleccionado(s)`)
  }

  const eliminarArchivo = (id: string) => {
    setArchivosMultimedia(prev => prev.filter(a => a.id !== id))
    toast.success("Archivo eliminado")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith('image/')) return <Image className="h-5 w-5" />
    if (tipo.startsWith('audio/')) return <Music className="h-5 w-5" />
    if (tipo.startsWith('video/')) return <Video className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const subirArchivosMultimedia = async (leccionId: number): Promise<number[]> => {
    if (archivosMultimedia.length === 0) return []

    setSubiendoArchivos(true)
    const multimediaSubida: MultimediaSubido[] = []

    try {
      for (const archivoData of archivosMultimedia) {
        const formData = new FormData()
        formData.append('archivo', archivoData.file)
        formData.append('descripcion', `Archivo para lección ${leccionId}`)
        formData.append('categoria', 'leccion')

        const response = await fetch('http://localhost:5000/api/multimedia/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Error al subir archivo')
        }

        const data = await response.json()
        multimediaSubida.push(data.multimedia)

        // Asociar multimedia con la lección
        await fetch(`http://localhost:5000/api/multimedia/${data.multimedia.id}/asociar-leccion/${leccionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orden: multimediaSubida.length })
        })
      }

      setArchivosSubidos(multimediaSubida)
      return multimediaSubida.map(m => m.id)
    } catch (error: any) {
      console.error('❌ Error:', error)
      toast.error('Error al subir archivos: ' + error.message)
      return []
    } finally {
      setSubiendoArchivos(false)
    }
  }

  // ========== MANEJO DEL ENVÍO DEL FORMULARIO ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    if (!formData.curso_id) {
      toast.error("Debes seleccionar un curso")
      setStep(1)
      return
    }

    if (!formData.titulo.trim() || !formData.descripcion.trim()) {
      toast.error("El título y descripción son obligatorios")
      setStep(1)
      return
    }

    if (formData.actividades.length === 0) {
      toast.error("Debes agregar al menos una actividad gamificada")
      setStep(3)
      return
    }
    
    try {
      setSaving(true)
      
      // 1. Crear lección
      const leccionData = {
        curso_id: formData.curso_id,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        contenido: formData.contenido,
        nivel: formData.nivel,
        idioma: formData.idioma,
        categoria: formData.categoria,
        etiquetas: formData.etiquetas,
        duracion_estimada: formData.duracion_estimada,
        puntos_xp: formData.puntos_xp,
        orden: formData.orden,
        estado: "borrador" as const
      }
      
      const response = await fetch('http://localhost:5000/api/lecciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(leccionData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear lección')
      }
      
      const data = await response.json()
      const leccionId = data.leccion?.id || data.id
      
      if (!leccionId) {
        throw new Error('No se recibió el ID de la lección creada')
      }

      // 2. Crear actividades
      for (const [index, actividad] of formData.actividades.entries()) {
        try {
          await fetch(`http://localhost:5000/api/actividades/leccion/${leccionId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              ...actividad,
              orden: index + 1
            })
          })
        } catch (actError: any) {
          console.error('❌ Error al crear actividad:', actError)
          // Continuar con las demás actividades aunque falle una
        }
      }

      // 3. Subir archivos multimedia
      if (archivosMultimedia.length > 0) {
        const multimediaIds = await subirArchivosMultimedia(leccionId)
        if (multimediaIds.length > 0) {
          toast.success(`✅ ${multimediaIds.length} archivo(s) multimedia subido(s)`)
        }
      }
      
      toast.success("🎉 ¡Lección creada exitosamente!")
      router.push(`/lecciones/${leccionId}`)
      
    } catch (error: any) {
      console.error("❌ Error:", error)
      toast.error(error.message || "Error al crear lección")
    } finally {
      setSaving(false)
    }
  }

  // ========== FUNCIONES AUXILIARES ==========
  const agregarObjetivo = () => {
    if (objetivoTemp.trim()) {
      setFormData(prev => ({
        ...prev,
        contenido: {
          ...prev.contenido,
          objetivos: [...prev.contenido.objetivos, objetivoTemp.trim()]
        }
      }))
      setObjetivoTemp("")
    }
  }

  const eliminarObjetivo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contenido: {
        ...prev.contenido,
        objetivos: prev.contenido.objetivos.filter((_, i) => i !== index)
      }
    }))
  }

  const agregarVocabulario = () => {
    if (vocabularioTemp.trim()) {
      setFormData(prev => ({
        ...prev,
        contenido: {
          ...prev.contenido,
          vocabulario_clave: [...prev.contenido.vocabulario_clave, vocabularioTemp.trim()]
        }
      }))
      setVocabularioTemp("")
    }
  }

  const eliminarVocabulario = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contenido: {
        ...prev.contenido,
        vocabulario_clave: prev.contenido.vocabulario_clave.filter((_, i) => i !== index)
      }
    }))
  }

  const agregarEtiqueta = () => {
    if (etiquetaTemp.trim() && !formData.etiquetas.includes(etiquetaTemp.trim())) {
      setFormData(prev => ({
        ...prev,
        etiquetas: [...prev.etiquetas, etiquetaTemp.trim()]
      }))
      setEtiquetaTemp("")
    }
  }

  const eliminarEtiqueta = (index: number) => {
    setFormData(prev => ({
      ...prev,
      etiquetas: prev.etiquetas.filter((_, i) => i !== index)
    }))
  }

  const handleGuardarActividad = (actividad: Actividad) => {
    if (indiceEditando !== null) {
      // Editar actividad existente
      setFormData(prev => ({
        ...prev,
        actividades: prev.actividades.map((act, idx) => 
          idx === indiceEditando ? { ...actividad, orden: idx } : act
        )
      }))
      toast.success("Actividad actualizada")
    } else {
      // Agregar nueva actividad
      setFormData(prev => ({
        ...prev,
        actividades: [...prev.actividades, { ...actividad, orden: prev.actividades.length }]
      }))
      toast.success("Actividad agregada")
    }
    
    // Limpiar estado del modal
    setModalActividadOpen(false)
    setTipoActividadModal(null)
    setActividadEditando(null)
    setIndiceEditando(null)
  }

  const handleEditarActividad = (actividad: Actividad, index: number) => {
    setActividadEditando(actividad)
    setIndiceEditando(index)
    setTipoActividadModal(actividad.tipo)
    setModalActividadOpen(true)
  }

  const handleEliminarActividad = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actividades: prev.actividades.filter((_, i) => i !== index)
    }))
    toast.success("Actividad eliminada")
  }

  const cursoSeleccionado = cursos.find(c => c.id === formData.curso_id)

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Indicador de pasos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {[
                { num: 1, label: 'Información Básica' },
                { num: 2, label: 'Contenido' },
                { num: 3, label: 'Actividades' },
                { num: 4, label: 'Multimedia' }
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}>
                    {s.num}
                  </div>
                  <span className="ml-2 hidden sm:inline">{s.label}</span>
                  {idx < 3 && <div className="mx-4 h-1 w-12 bg-secondary hidden sm:block" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PASO 1: Información Básica */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Paso 1: Información Básica</CardTitle>
              <CardDescription>Selecciona el curso y completa los datos principales</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Selector de Curso */}
              <div className="space-y-2">
                <Label htmlFor="curso">🎓 Curso de la Lección *</Label>
                <Select 
                  value={formData.curso_id?.toString() || ""}
                  onValueChange={(value) => {
                    const cursoId = parseInt(value)
                    const curso = cursos.find(c => c.id === cursoId)
                    setFormData(prev => ({
                      ...prev, 
                      curso_id: cursoId,
                      idioma: curso?.idioma || prev.idioma,
                      nivel: curso ? mapearNivelCursoALeccion(curso.nivel) : prev.nivel
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCursos ? (
                      <SelectItem value="loading" disabled>
                        Cargando cursos...
                      </SelectItem>
                    ) : cursos.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No hay cursos disponibles
                      </SelectItem>
                    ) : (
                      cursos.map((curso) => (
                        <SelectItem key={curso.id} value={curso.id.toString()}>
                          {curso.codigo} - {curso.nombre} ({curso.nivel})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {cursoSeleccionado && (
                  <p className="text-sm text-muted-foreground">
                    Curso seleccionado: <strong>{cursoSeleccionado.nombre}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título de la Lección *</Label>
                <Input 
                  id="titulo" 
                  placeholder="Ej: Saludos y Presentaciones"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({...prev, titulo: e.target.value}))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe brevemente de qué trata esta lección..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({...prev, descripcion: e.target.value}))}
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nivel</Label>
                  <Input value={formData.nivel} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Input value={formData.idioma} disabled className="bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select 
                  value={formData.categoria}
                  onValueChange={(value) => setFormData(prev => ({...prev, categoria: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vocabulario">📚 Vocabulario</SelectItem>
                    <SelectItem value="gramatica">📖 Gramática</SelectItem>
                    <SelectItem value="pronunciacion">🗣️ Pronunciación</SelectItem>
                    <SelectItem value="conversacion">💬 Conversación</SelectItem>
                    <SelectItem value="lectura">📰 Lectura</SelectItem>
                    <SelectItem value="escritura">✍️ Escritura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="duracion">⏱️ Duración (min) *</Label>
                  <Input 
                    id="duracion" 
                    type="number" 
                    min="1"
                    value={formData.duracion_estimada}
                    onChange={(e) => setFormData(prev => ({...prev, duracion_estimada: parseInt(e.target.value) || 1}))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xp">⭐ Puntos XP *</Label>
                  <Input 
                    id="xp" 
                    type="number"
                    min="0"
                    value={formData.puntos_xp}
                    onChange={(e) => setFormData(prev => ({...prev, puntos_xp: parseInt(e.target.value) || 0}))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orden">🔢 Orden</Label>
                  <Input 
                    id="orden" 
                    type="number"
                    min="0"
                    value={formData.orden}
                    onChange={(e) => setFormData(prev => ({...prev, orden: parseInt(e.target.value) || 0}))}
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-col sm:flex-row">
                <Button 
                  type="button" 
                  onClick={() => setStep(2)} 
                  className="flex-1"
                  disabled={!formData.curso_id || !formData.titulo.trim() || !formData.descripcion.trim()}
                >
                  Siguiente
                </Button>
                <Button variant="outline" asChild className="sm:w-auto">
                  <Link href="/admin/lecciones">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancelar
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PASO 2: Contenido Detallado */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Paso 2: Contenido Pedagógico</CardTitle>
              <CardDescription>Objetivos, vocabulario y estructura de la lección</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>📌 Objetivos de Aprendizaje</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ej: Aprender saludos formales en inglés"
                    value={objetivoTemp}
                    onChange={(e) => setObjetivoTemp(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarObjetivo())}
                  />
                  <Button type="button" onClick={agregarObjetivo} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.contenido.objetivos.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.contenido.objetivos.map((obj, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <span className="flex-1 text-sm">{obj}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => eliminarObjetivo(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>📖 Vocabulario Clave</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ej: Hello, Good morning, How are you?"
                    value={vocabularioTemp}
                    onChange={(e) => setVocabularioTemp(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarVocabulario())}
                  />
                  <Button type="button" onClick={agregarVocabulario} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.contenido.vocabulario_clave.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.contenido.vocabulario_clave.map((vocab, i) => (
                      <Badge key={i} variant="secondary" className="flex items-center gap-1">
                        {vocab}
                        <button 
                          type="button" 
                          onClick={() => eliminarVocabulario(i)}
                          className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="introduccion">💡 Introducción</Label>
                <Textarea
                  id="introduccion"
                  placeholder="Breve introducción al tema de la lección..."
                  value={formData.contenido.introduccion}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contenido: {...prev.contenido, introduccion: e.target.value}
                  }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>🏷️ Etiquetas</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ej: saludos, presentaciones, básico"
                    value={etiquetaTemp}
                    onChange={(e) => setEtiquetaTemp(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarEtiqueta())}
                  />
                  <Button type="button" onClick={agregarEtiqueta} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.etiquetas.map((tag, i) => (
                      <Badge key={i} variant="outline" className="flex items-center gap-1">
                        {tag}
                        <button 
                          type="button" 
                          onClick={() => eliminarEtiqueta(i)}
                          className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 flex-col sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button type="button" onClick={() => setStep(3)} className="flex-1">
                  Siguiente: Agregar Actividades
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PASO 3: Actividades Gamificadas */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Paso 3: Actividades Gamificadas 🎮</CardTitle>
              <CardDescription>
                Agrega juegos y ejercicios interactivos (mínimo 1 requerido)
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="rounded-lg border-2 border-dashed border-primary/30 p-6">
                <h3 className="mb-4 font-semibold">Tipos de Actividades Disponibles</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {TIPOS_ACTIVIDAD.map((tipo) => (
                    <Button
                      key={tipo.value}
                      type="button"
                      variant="outline"
                      className="justify-start h-auto p-4"
                      onClick={() => {
                        setTipoActividadModal(tipo.value)
                        setActividadEditando(null)
                        setIndiceEditando(null)
                        setModalActividadOpen(true)
                      }}
                    >
                      <span className="text-2xl mr-3">{tipo.icon}</span>
                      <div className="text-left">
                        <div className="font-medium">{tipo.label.split(' ')[0]}</div>
                        <div className="text-xs text-muted-foreground">
                          {tipo.label.split(' ').slice(1).join(' ')}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {formData.actividades.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">Actividades Agregadas ({formData.actividades.length})</h3>
                  {formData.actividades.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg border p-4">
                      <span className="text-2xl">
                        {TIPOS_ACTIVIDAD.find(t => t.value === act.tipo)?.icon || '🎮'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{act.pregunta}</p>
                        <p className="text-sm text-muted-foreground">
                          {TIPOS_ACTIVIDAD.find(t => t.value === act.tipo)?.label} • {act.puntos} pts
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarActividad(act, idx)}
                          title="Editar actividad"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEliminarActividad(idx)}
                          title="Eliminar actividad"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                  ⚠️ Debes agregar al menos una actividad para continuar
                </div>
              )}

              <div className="flex gap-3 flex-col sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setStep(4)} 
                  className="flex-1"
                  disabled={formData.actividades.length === 0}
                >
                  Siguiente: Multimedia
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PASO 4: Multimedia */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Paso 4: Recursos Multimedia 📸🎵 (Opcional)</CardTitle>
              <CardDescription>
                Sube imágenes, audios o videos para enriquecer tu lección
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Área de subida de archivos */}
              <div>
                <Label htmlFor="file-upload" className="block mb-2">
                  📤 Subir Archivos Multimedia
                </Label>
                <div className="flex flex-col gap-4">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click para subir</span> o arrastra archivos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Imágenes, Audio, Video - Max 50MB por archivo
                      </p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*,audio/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Lista de archivos seleccionados */}
              {archivosMultimedia.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">
                    📁 Archivos seleccionados ({archivosMultimedia.length})
                  </h3>
                  <div className="space-y-2">
                    {archivosMultimedia.map((archivoData) => (
                      <div
                        key={archivoData.id}
                        className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        {archivoData.preview ? (
                          <img
                            src={archivoData.preview}
                            alt={archivoData.file.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : (
                          <div className="h-12 w-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded">
                            {getFileIcon(archivoData.file.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {archivoData.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(archivoData.file.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarArchivo(archivoData.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 flex-col sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={saving || subiendoArchivos}
                >
                  {(saving || subiendoArchivos) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {subiendoArchivos ? 'Subiendo archivos...' : 'Creando lección...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Crear Lección Completa
                      {archivosMultimedia.length > 0 && ` (+${archivosMultimedia.length} archivos)`}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {/* Modal de Actividades */}
      <ActivityModal
        open={modalActividadOpen}
        onOpenChange={setModalActividadOpen}
        tipoActividad={tipoActividadModal}
        onGuardar={handleGuardarActividad}
        actividadEditar={actividadEditando}
      />
    </>
  )
}