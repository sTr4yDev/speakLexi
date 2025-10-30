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
import { ArrowLeft, Save, Loader2, Plus, X, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
// FIX 1: Se importa el 'type Actividad' desde la API
import { cursosAPI, leccionesAPI, actividadesAPI, type Actividad } from "@/lib/api"
import { ActivityModal } from "@/components/admin/activity-modal"

// Tipos de actividades gamificadas
const TIPOS_ACTIVIDAD = [
  { value: 'multiple_choice', label: '🎯 Opción múltiple', icon: '🎯' },
  { value: 'fill_blank', label: '✏️ Completar espacios', icon: '✏️' },
  { value: 'matching', label: '🔗 Emparejar', icon: '🔗' },
  { value: 'translation', label: '🌐 Traducción', icon: '🌐' },
  { value: 'true_false', label: '✓✗ Verdadero/Falso', icon: '✓' },
  { value: 'word_order', label: '📝 Ordenar palabras', icon: '📝' },
]

interface Curso {
  id: number
  nombre: string
  nivel: string
  codigo: string
  idioma: string
}

// FIX 2: Se elimina la interfaz 'Actividad' local duplicada.
// Ya no es necesaria porque la importamos desde 'lib/api'.

export function CreateLessonForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)
  
  // Estados para modal de actividades
  const [modalActividadOpen, setModalActividadOpen] = useState(false)
  // FIX 3: Se usa el tipo importado 'Actividad['tipo']' para el estado del modal
  const [tipoActividadModal, setTipoActividadModal] = useState<Actividad['tipo'] | null>(null)
  const [actividadEditando, setActividadEditando] = useState<Actividad | null>(null)
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    // Paso 1: Básico + Curso
    curso_id: null as number | null,
    titulo: "",
    descripcion: "",
    // Pequeña mejora: Usar los tipos exactos de la API de Leccion
    nivel: "principiante" as 'principiante' | 'intermedio' | 'avanzado', 
    idioma: "ingles",
    categoria: "",
    duracion_estimada: 10,
    puntos_xp: 50,
    orden: 0,
    
    // Paso 2: Contenido
    contenido: {
      objetivos: [] as string[],
      vocabulario_clave: [] as string[],
      introduccion: "",
      ejemplos: [] as string[]
    },
    etiquetas: [] as string[],
    
    // Paso 3: Actividades gamificadas
    // Este array ahora usa correctamente el tipo 'Actividad' importado
    actividades: [] as Actividad[],
    
    // Paso 4: Multimedia
    multimedia_ids: [] as number[]
  })

  // Estados temporales para agregar items
  const [objetivoTemp, setObjetivoTemp] = useState("")
  const [vocabularioTemp, setVocabularioTemp] = useState("")
  const [etiquetaTemp, setEtiquetaTemp] = useState("")

  // Cargar cursos disponibles
  useEffect(() => {
    cargarCursos()
  }, [])

  const cargarCursos = async () => {
    try {
      setLoadingCursos(true)
      const data = await cursosAPI.listar({ activo: true })
      setCursos(data.cursos || [])
      
      if (data.cursos && data.cursos.length > 0) {
        toast.success(`${data.cursos.length} cursos cargados`)
      } else {
        toast.warning('No hay cursos disponibles')
      }
    } catch (error: any) {
      console.error('Error al cargar cursos:', error)
      toast.error(error.message || 'Error al cargar cursos')
    } finally {
      setLoadingCursos(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.curso_id) {
      toast.error("Debes seleccionar un curso")
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
      
      // Preparar datos de la lección
      const leccionData = {
        curso_id: formData.curso_id,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        contenido: JSON.stringify(formData.contenido), // FIX: Convertir a string
        nivel: formData.nivel,
        idioma: formData.idioma,
        categoria: formData.categoria,
        etiquetas: formData.etiquetas,
        duracion_estimada: formData.duracion_estimada,
        puntos_xp: formData.puntos_xp,
        orden: formData.orden,
        estado: 'borrador' as const // Usar 'as const' para tipado estricto
      }
      
      console.log('📤 Enviando lección:', leccionData)
      
      // ✅ USAR LA API EN LUGAR DE FETCH DIRECTO
      const response = await leccionesAPI.crear(leccionData)
      
      console.log('✅ Lección creada:', response)
      
      const leccionId = response.leccion?.id || response.id
      
      if (!leccionId) {
        throw new Error('No se recibió el ID de la lección creada')
      }

      // Crear actividades una por una
      console.log(`📤 Creando ${formData.actividades.length} actividades...`)
      
      for (const actividad of formData.actividades) {
        try {
          // Esta línea ahora es funcional gracias a la corrección de tipos
          await actividadesAPI.agregar(leccionId, actividad)
          console.log(`✅ Actividad "${actividad.pregunta}" creada`)
        } catch (actError: any) {
          console.error('Error al crear actividad:', actError)
          toast.error(`Error al crear actividad: ${actError.message}`)
        }
      }
      
      toast.success("✅ Lección creada exitosamente")
      router.push(`/admin/lecciones/${leccionId}/editar`)
      
    } catch (error: any) {
      console.error("❌ Error al crear lección:", error)
      toast.error(error.message || "Error al crear lección")
    } finally {
      setSaving(false)
    }
  }

  // Funciones auxiliares
  const agregarObjetivo = () => {
    if (objetivoTemp.trim()) {
      setFormData({
        ...formData,
        contenido: {
          ...formData.contenido,
          objetivos: [...formData.contenido.objetivos, objetivoTemp.trim()]
        }
      })
      setObjetivoTemp("")
    }
  }

  const eliminarObjetivo = (index: number) => {
    setFormData({
      ...formData,
      contenido: {
        ...formData.contenido,
        objetivos: formData.contenido.objetivos.filter((_, i) => i !== index)
      }
    })
  }

  const agregarVocabulario = () => {
    if (vocabularioTemp.trim()) {
      setFormData({
        ...formData,
        contenido: {
          ...formData.contenido,
          vocabulario_clave: [...formData.contenido.vocabulario_clave, vocabularioTemp.trim()]
        }
      })
      setVocabularioTemp("")
    }
  }

  const agregarEtiqueta = () => {
    if (etiquetaTemp.trim() && !formData.etiquetas.includes(etiquetaTemp.trim())) {
      setFormData({
        ...formData,
        etiquetas: [...formData.etiquetas, etiquetaTemp.trim()]
      })
      setEtiquetaTemp("")
    }
  }

  const handleGuardarActividad = (actividad: Actividad) => {
    if (indiceEditando !== null) {
      // Editar existente
      const nuevasActividades = [...formData.actividades]
      nuevasActividades[indiceEditando] = { ...actividad, orden: indiceEditando }
      setFormData({ ...formData, actividades: nuevasActividades })
      toast.success("Actividad actualizada")
    } else {
      // Agregar nueva
      setFormData({
        ...formData,
        actividades: [...formData.actividades, { ...actividad, orden: formData.actividades.length }]
      })
      toast.success("Actividad agregada")
    }
    
    // Cerrar modal
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
    setFormData({
      ...formData,
      actividades: formData.actividades.filter((_, i) => i !== index)
    })
    toast.success("Actividad eliminada")
  }

  const cursoSeleccionado = cursos.find(c => c.id === formData.curso_id)

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Indicador de pasos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
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
                  {idx < 3 && <div className="mx-4 h-1 w-12 bg-secondary" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PASO 1: Información Básica + Curso */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Paso 1: Información Básica</CardTitle>
              <CardDescription>Selecciona el curso y completa los datos principales</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Selector de Curso */}
              <div className="space-y-2 rounded-lg border-2 border-primary/50 bg-primary/5 p-4">
                <Label htmlFor="curso" className="text-lg font-semibold">
                  🎓 Curso de la Lección *
                </Label>
                <Select 
                  value={formData.curso_id?.toString() || ""}
                  onValueChange={(value) => {
                    const cursoId = parseInt(value)
                    const curso = cursos.find(c => c.id === cursoId)
                    setFormData({
                      ...formData, 
                      curso_id: cursoId,
                      idioma: curso?.idioma || formData.idioma,
                      nivel: curso?.nivel === 'A1' || curso?.nivel === 'A2' ? 'principiante' : 
                             curso?.nivel === 'B1' || curso?.nivel === 'B2' ? 'intermedio' : 'avanzado'
                    })
                  }}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecciona el curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCursos ? (
                      <SelectItem value="loading" disabled>Cargando cursos...</SelectItem>
                    ) : cursos.length === 0 ? (
                      <SelectItem value="empty" disabled>No hay cursos disponibles</SelectItem>
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
                  <div className="mt-2 text-sm text-muted-foreground">
                    ℹ️ Esta lección será parte de: <strong>{cursoSeleccionado.nombre}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título de la Lección *</Label>
                <Input 
                  id="titulo" 
                  placeholder="Ej: Saludos y Presentaciones"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe brevemente de qué trata esta lección..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nivel (según curso)</Label>
                  <Input value={formData.nivel} disabled className="bg-secondary" />
                </div>

                <div className="space-y-2">
                  <Label>Idioma (según curso)</Label>
                  <Input value={formData.idioma} disabled className="bg-secondary" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select 
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({...formData, categoria: value})}
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
                    <SelectItem value="comprension_auditiva">👂 Comprensión Auditiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="duracion">⏱️ Duración (min) *</Label>
                  <Input 
                    id="duracion" 
                    type="number" 
                    min="1"
                    value={formData.duracion_estimada}
                    onChange={(e) => setFormData({...formData, duracion_estimada: parseInt(e.target.value) || 1})}
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
                    onChange={(e) => setFormData({...formData, puntos_xp: parseInt(e.target.value) || 0})}
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
                    onChange={(e) => setFormData({...formData, orden: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  onClick={() => setStep(2)} 
                  className="flex-1"
                  disabled={!formData.curso_id || !formData.titulo || !formData.descripcion}
                >
                  Siguiente
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/lecciones">Cancelar</Link>
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
              <CardDescription>Objetivos, vocabulario y estructura</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>📌 Objetivos de Aprendizaje</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ej: Aprender saludos formales en inglés"
                    value={objetivoTemp}
                    onChange={(e) => setObjetivoTemp(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarObjetivo())}
                  />
                  <Button type="button" onClick={agregarObjetivo} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.contenido.objetivos.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.contenido.objetivos.map((obj, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-secondary rounded">
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
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarVocabulario())}
                  />
                  <Button type="button" onClick={agregarVocabulario} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.contenido.vocabulario_clave.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.contenido.vocabulario_clave.map((vocab, i) => (
                      <Badge key={i} variant="secondary">
                        {vocab}
                        <button type="button" onClick={() => {
                          setFormData({
                            ...formData,
                            contenido: {
                              ...formData.contenido,
                              vocabulario_clave: formData.contenido.vocabulario_clave.filter((_, idx) => idx !== i)
                            }
                          })
                        }} className="ml-1">
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
                  onChange={(e) => setFormData({
                    ...formData,
                    contenido: {...formData.contenido, introduccion: e.target.value}
                  })}
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
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarEtiqueta())}
                  />
                  <Button type="button" onClick={agregarEtiqueta} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.etiquetas.map((tag, i) => (
                      <Badge key={i} variant="outline">
                        {tag}
                        <button type="button" onClick={() => {
                          setFormData({...formData, etiquetas: formData.etiquetas.filter((_, idx) => idx !== i)})
                        }} className="ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
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
                <div className="grid gap-3 sm:grid-cols-2">
                  {TIPOS_ACTIVIDAD.map((tipo) => (
                    <Button
                      key={tipo.value}
                      type="button"
                      variant="outline"
                      className="justify-start h-auto p-4"
                      onClick={() => {
                        // El tipo 'tipo.value' ahora se valida contra 'Actividad['tipo']'
                        setTipoActividadModal(tipo.value as Actividad['tipo']) 
                        setActividadEditando(null)
                        setIndiceEditando(null)
                        setModalActividadOpen(true)
                      }}
                    >
                      <span className="text-2xl mr-3">{tipo.icon}</span>
                      <span>{tipo.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {formData.actividades.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Actividades Agregadas ({formData.actividades.length})</h3>
                  {formData.actividades.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg border p-3">
                      <span className="text-2xl">
                        {TIPOS_ACTIVIDAD.find(t => t.value === act.tipo)?.icon || '🎮'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{act.pregunta}</p>
                        <p className="text-sm text-muted-foreground">
                          {TIPOS_ACTIVIDAD.find(t => t.value === act.tipo)?.label} • {act.puntos} pts
                        </p>
                      </div>
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
                  ))}
                </div>
              )}

              {formData.actividades.length === 0 && (
                <div className="rounded-lg bg-yellow-50 p-4 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200">
                  ⚠️ Debes agregar al menos una actividad para continuar
                </div>
              )}

              <div className="flex gap-3">
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
              <CardDescription>Próximamente: subir imágenes, audios o videos</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  💡 La funcionalidad de multimedia se implementará próximamente
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando lección...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Crear Lección Completa
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