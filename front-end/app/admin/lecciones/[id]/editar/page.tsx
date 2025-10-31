"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Loader2, Plus, X, Upload, Eye } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Leccion {
  id: number
  curso_id: number
  titulo: string
  descripcion: string
  contenido: {
    objetivos: string[]
    vocabulario_clave: string[]
    introduccion: string
    ejemplos: string[]
  }
  nivel: string
  idioma: string
  categoria: string
  duracion_estimada: number
  puntos_xp: number
  orden: number
  estado: string
  etiquetas: string[]
}

interface Curso {
  id: number
  nombre: string
  codigo: string
  nivel: string
}

export default function EditLessonPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [leccion, setLeccion] = useState<Leccion | null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [formData, setFormData] = useState<Leccion | null>(null)
  
  // Estados temporales para inputs
  const [objetivoTemp, setObjetivoTemp] = useState("")
  const [vocabularioTemp, setVocabularioTemp] = useState("")
  const [etiquetaTemp, setEtiquetaTemp] = useState("")
  const [ejemploTemp, setEjemploTemp] = useState("")

  useEffect(() => {
    if (params.id) {
      cargarDatos()
    }
  }, [params.id])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Cargar cursos
      const cursosResponse = await fetch('http://localhost:5000/api/cursos?activo=true', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (cursosResponse.ok) {
        const cursosData = await cursosResponse.json()
        setCursos(cursosData.cursos || [])
      }
      
      // Cargar lección
      const response = await fetch(`http://localhost:5000/api/lecciones/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar la lección')
      }

      const data = await response.json()
      const leccionData = data.leccion || data
      
      // Asegurar que el contenido tenga la estructura correcta
      if (!leccionData.contenido) {
        leccionData.contenido = {
          objetivos: [],
          vocabulario_clave: [],
          introduccion: "",
          ejemplos: []
        }
      }
      
      // Asegurar que etiquetas sea un array
      if (!Array.isArray(leccionData.etiquetas)) {
        leccionData.etiquetas = []
      }
      
      setLeccion(leccionData)
      setFormData(leccionData)
      
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al cargar la lección')
      router.push('/admin/lecciones')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData) return
    
    // Validaciones
    if (!formData.titulo.trim() || !formData.descripcion.trim()) {
      toast.error("El título y descripción son obligatorios")
      return
    }
    
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      
      const dataToUpdate = {
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
        estado: formData.estado
      }
      
      const response = await fetch(`http://localhost:5000/api/lecciones/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToUpdate)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al actualizar la lección')
      }
      
      toast.success("¡Lección actualizada exitosamente!")
      router.push('/admin/lecciones')
      
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message || "Error al actualizar la lección")
    } finally {
      setSaving(false)
    }
  }

  // Funciones auxiliares para manejar arrays
  const agregarObjetivo = () => {
    if (objetivoTemp.trim() && formData) {
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
    if (formData) {
      setFormData({
        ...formData,
        contenido: {
          ...formData.contenido,
          objetivos: formData.contenido.objetivos.filter((_, i) => i !== index)
        }
      })
    }
  }

  const agregarVocabulario = () => {
    if (vocabularioTemp.trim() && formData) {
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

  const eliminarVocabulario = (index: number) => {
    if (formData) {
      setFormData({
        ...formData,
        contenido: {
          ...formData.contenido,
          vocabulario_clave: formData.contenido.vocabulario_clave.filter((_, i) => i !== index)
        }
      })
    }
  }

  const agregarEjemplo = () => {
    if (ejemploTemp.trim() && formData) {
      setFormData({
        ...formData,
        contenido: {
          ...formData.contenido,
          ejemplos: [...(formData.contenido.ejemplos || []), ejemploTemp.trim()]
        }
      })
      setEjemploTemp("")
    }
  }

  const eliminarEjemplo = (index: number) => {
    if (formData) {
      setFormData({
        ...formData,
        contenido: {
          ...formData.contenido,
          ejemplos: formData.contenido.ejemplos?.filter((_, i) => i !== index) || []
        }
      })
    }
  }

  const agregarEtiqueta = () => {
    if (etiquetaTemp.trim() && formData && !formData.etiquetas.includes(etiquetaTemp.trim())) {
      setFormData({
        ...formData,
        etiquetas: [...formData.etiquetas, etiquetaTemp.trim()]
      })
      setEtiquetaTemp("")
    }
  }

  const eliminarEtiqueta = (index: number) => {
    if (formData) {
      setFormData({
        ...formData,
        etiquetas: formData.etiquetas.filter((_, i) => i !== index)
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando lección...</p>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Lección no encontrada</p>
          <Link href="/admin/lecciones">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Lecciones
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/lecciones')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          
          <div className="flex gap-2">
            <Link href={`/lecciones/${params.id}`}>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Vista Previa
              </Button>
            </Link>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Editar Lección</CardTitle>
              <CardDescription>
                Modifica el contenido y configuración de la lección
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información Básica</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="curso">Curso</Label>
                      <Select
                        value={String(formData.curso_id)}
                        onValueChange={(value) => setFormData({...formData, curso_id: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {cursos.map((curso) => (
                            <SelectItem key={curso.id} value={String(curso.id)}>
                              {curso.codigo} - {curso.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Select
                        value={formData.estado}
                        onValueChange={(value) => setFormData({...formData, estado: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="borrador">📝 Borrador</SelectItem>
                          <SelectItem value="publicada">✅ Publicada</SelectItem>
                          <SelectItem value="archivada">📦 Archivada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      placeholder="Título de la lección"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      placeholder="Descripción breve de la lección"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                {/* Configuración */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuración</h3>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="nivel">Nivel</Label>
                      <Select
                        value={formData.nivel}
                        onValueChange={(value) => setFormData({...formData, nivel: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="principiante">🌱 Principiante</SelectItem>
                          <SelectItem value="intermedio">🌿 Intermedio</SelectItem>
                          <SelectItem value="avanzado">🌳 Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idioma">Idioma</Label>
                      <Select
                        value={formData.idioma}
                        onValueChange={(value) => setFormData({...formData, idioma: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ingles">🇬🇧 Inglés</SelectItem>
                          <SelectItem value="frances">🇫🇷 Francés</SelectItem>
                          <SelectItem value="aleman">🇩🇪 Alemán</SelectItem>
                          <SelectItem value="italiano">🇮🇹 Italiano</SelectItem>
                          <SelectItem value="portugues">🇵🇹 Portugués</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría</Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(value) => setFormData({...formData, categoria: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vocabulario">📚 Vocabulario</SelectItem>
                          <SelectItem value="gramatica">📖 Gramática</SelectItem>
                          <SelectItem value="pronunciacion">🗣️ Pronunciación</SelectItem>
                          <SelectItem value="conversacion">💬 Conversación</SelectItem>
                          <SelectItem value="cultura">🌍 Cultura</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="duracion">Duración (minutos)</Label>
                      <Input
                        id="duracion"
                        type="number"
                        min="5"
                        max="120"
                        value={formData.duracion_estimada}
                        onChange={(e) => setFormData({...formData, duracion_estimada: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="puntos">Puntos XP</Label>
                      <Input
                        id="puntos"
                        type="number"
                        min="10"
                        max="500"
                        value={formData.puntos_xp}
                        onChange={(e) => setFormData({...formData, puntos_xp: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orden">Orden</Label>
                      <Input
                        id="orden"
                        type="number"
                        min="0"
                        value={formData.orden}
                        onChange={(e) => setFormData({...formData, orden: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contenido</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="introduccion">Introducción</Label>
                    <Textarea
                      id="introduccion"
                      value={formData.contenido.introduccion}
                      onChange={(e) => setFormData({
                        ...formData, 
                        contenido: {...formData.contenido, introduccion: e.target.value}
                      })}
                      placeholder="Introducción a la lección"
                      rows={3}
                    />
                  </div>

                  {/* Objetivos */}
                  <div className="space-y-2">
                    <Label>Objetivos de Aprendizaje</Label>
                    <div className="flex gap-2">
                      <Input
                        value={objetivoTemp}
                        onChange={(e) => setObjetivoTemp(e.target.value)}
                        placeholder="Añadir objetivo"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarObjetivo())}
                      />
                      <Button type="button" onClick={agregarObjetivo} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.contenido.objetivos.map((objetivo, index) => (
                        <Badge key={index} variant="secondary">
                          {objetivo}
                          <button
                            type="button"
                            onClick={() => eliminarObjetivo(index)}
                            className="ml-2"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Vocabulario */}
                  <div className="space-y-2">
                    <Label>Vocabulario Clave</Label>
                    <div className="flex gap-2">
                      <Input
                        value={vocabularioTemp}
                        onChange={(e) => setVocabularioTemp(e.target.value)}
                        placeholder="Añadir palabra"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarVocabulario())}
                      />
                      <Button type="button" onClick={agregarVocabulario} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.contenido.vocabulario_clave.map((palabra, index) => (
                        <Badge key={index} variant="secondary">
                          {palabra}
                          <button
                            type="button"
                            onClick={() => eliminarVocabulario(index)}
                            className="ml-2"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Ejemplos */}
                  <div className="space-y-2">
                    <Label>Ejemplos</Label>
                    <div className="flex gap-2">
                      <Input
                        value={ejemploTemp}
                        onChange={(e) => setEjemploTemp(e.target.value)}
                        placeholder="Añadir ejemplo"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarEjemplo())}
                      />
                      <Button type="button" onClick={agregarEjemplo} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.contenido.ejemplos?.map((ejemplo, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{ejemplo}</span>
                          <button
                            type="button"
                            onClick={() => eliminarEjemplo(index)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Etiquetas */}
                  <div className="space-y-2">
                    <Label>Etiquetas</Label>
                    <div className="flex gap-2">
                      <Input
                        value={etiquetaTemp}
                        onChange={(e) => setEtiquetaTemp(e.target.value)}
                        placeholder="Añadir etiqueta"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarEtiqueta())}
                      />
                      <Button type="button" onClick={agregarEtiqueta} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.etiquetas.map((etiqueta, index) => (
                        <Badge key={index}>
                          #{etiqueta}
                          <button
                            type="button"
                            onClick={() => eliminarEtiqueta(index)}
                            className="ml-2"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Enlaces rápidos */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    <Link href={`/admin/lecciones/${params.id}/actividades`}>
                      <Button type="button" variant="outline">
                        🎮 Gestionar Actividades
                      </Button>
                    </Link>
                    <Link href={`/admin/lecciones/${params.id}/multimedia`}>
                      <Button type="button" variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Gestionar Multimedia
                      </Button>
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}