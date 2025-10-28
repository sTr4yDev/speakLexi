"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react"
import Link from "next/link"
import { leccionesAPI, type Leccion } from "@/lib/api"
import { toast } from "sonner"

export function CreateLessonForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState<Partial<Leccion>>({
    titulo: "",
    descripcion: "",
    nivel: "principiante",
    idioma: "ingles",
    categoria: "",
    etiquetas: [],
    duracion_estimada: 10,
    puntos_xp: 50,
    contenido: {
      objetivos: [],
      vocabulario_clave: []
    }
  })

  const [objetivoTemp, setObjetivoTemp] = useState("")
  const [vocabularioTemp, setVocabularioTemp] = useState("")
  const [etiquetaTemp, setEtiquetaTemp] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      const leccionData: Omit<Leccion, 'id' | 'creado_en' | 'actualizado_en'> = {
        titulo: formData.titulo!,
        descripcion: formData.descripcion!,
        contenido: formData.contenido || {},
        nivel: formData.nivel as any,
        idioma: formData.idioma!,
        categoria: formData.categoria,
        etiquetas: formData.etiquetas || [],
        requisitos: [],
        duracion_estimada: formData.duracion_estimada!,
        puntos_xp: formData.puntos_xp!,
        estado: 'borrador'
      }
      
      const response = await leccionesAPI.crear(leccionData)
      
      toast.success("Lección creada exitosamente")
      router.push(`/admin/lecciones/${response.leccion.id}/editar`)
      
    } catch (error: any) {
      console.error("Error al crear lección:", error)
      toast.error(error.message || "Error al crear lección")
    } finally {
      setSaving(false)
    }
  }

  const agregarObjetivo = () => {
    if (objetivoTemp.trim()) {
      const contenido = formData.contenido || {}
      const objetivos = contenido.objetivos || []
      
      setFormData({
        ...formData,
        contenido: {
          ...contenido,
          objetivos: [...objetivos, objetivoTemp.trim()]
        }
      })
      setObjetivoTemp("")
    }
  }

  const eliminarObjetivo = (index: number) => {
    const contenido = formData.contenido || {}
    const objetivos = contenido.objetivos || []
    
    setFormData({
      ...formData,
      contenido: {
        ...contenido,
        objetivos: objetivos.filter((_ : string, i: number) => i !== index)
      }
    })
  }

  const agregarVocabulario = () => {
    if (vocabularioTemp.trim()) {
      const contenido = formData.contenido || {}
      const vocabulario = contenido.vocabulario_clave || []
      
      setFormData({
        ...formData,
        contenido: {
          ...contenido,
          vocabulario_clave: [...vocabulario, vocabularioTemp.trim()]
        }
      })
      setVocabularioTemp("")
    }
  }

  const eliminarVocabulario = (index: number) => {
    const contenido = formData.contenido || {}
    const vocabulario = contenido.vocabulario_clave || []
    
    setFormData({
      ...formData,
      contenido: {
        ...contenido,
        vocabulario_clave: vocabulario.filter((_ : string, i: number) => i !== index)
      }
    })
  }

  const agregarEtiqueta = () => {
    if (etiquetaTemp.trim() && !formData.etiquetas?.includes(etiquetaTemp.trim())) {
      setFormData({
        ...formData,
        etiquetas: [...(formData.etiquetas || []), etiquetaTemp.trim()]
      })
      setEtiquetaTemp("")
    }
  }

  const eliminarEtiqueta = (etiqueta: string) => {
    setFormData({
      ...formData,
      etiquetas: formData.etiquetas?.filter(e => e !== etiqueta)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Paso 1: Información Básica */}
      {step === 1 && (
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Paso 1: Información Básica</CardTitle>
            <CardDescription>Datos principales de la lección</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nivel">Nivel *</Label>
                <Select 
                  value={formData.nivel}
                  onValueChange={(value: any) => setFormData({...formData, nivel: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principiante">Principiante</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="avanzado">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idioma">Idioma *</Label>
                <Select 
                  value={formData.idioma}
                  onValueChange={(value) => setFormData({...formData, idioma: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingles">Inglés</SelectItem>
                    <SelectItem value="espanol">Español</SelectItem>
                    <SelectItem value="frances">Francés</SelectItem>
                    <SelectItem value="aleman">Alemán</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input 
                id="categoria" 
                placeholder="vocabulario, gramatica, pronunciacion, etc."
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                placeholder="Describe brevemente de qué trata esta lección..."
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                rows={4}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duracion">Duración estimada (minutos) *</Label>
                <Input 
                  id="duracion" 
                  type="number" 
                  min="1"
                  value={formData.duracion_estimada}
                  onChange={(e) => setFormData({...formData, duracion_estimada: parseInt(e.target.value)})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="xp">Puntos XP *</Label>
                <Input 
                  id="xp" 
                  type="number"
                  min="0"
                  value={formData.puntos_xp}
                  onChange={(e) => setFormData({...formData, puntos_xp: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" onClick={() => setStep(2)} className="flex-1">
                Siguiente
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/lecciones">Cancelar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Contenido Detallado */}
      {step === 2 && (
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Paso 2: Contenido Detallado</CardTitle>
            <CardDescription>Objetivos, vocabulario y etiquetas</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Objetivos */}
            <div className="space-y-2">
              <Label>Objetivos de Aprendizaje</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ej: Aprender saludos formales"
                  value={objetivoTemp}
                  onChange={(e) => setObjetivoTemp(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarObjetivo())}
                />
                <Button type="button" onClick={agregarObjetivo} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.contenido?.objetivos && formData.contenido.objetivos.length > 0 && (
                <div className="space-y-2 mt-2">
                  {formData.contenido.objetivos.map((obj: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-secondary rounded">
                      <span className="flex-1 text-sm">{obj}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => eliminarObjetivo(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vocabulario Clave */}
            <div className="space-y-2">
              <Label>Vocabulario Clave</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ej: Hello, Good morning"
                  value={vocabularioTemp}
                  onChange={(e) => setVocabularioTemp(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarVocabulario())}
                />
                <Button type="button" onClick={agregarVocabulario} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.contenido?.vocabulario_clave && formData.contenido.vocabulario_clave.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.contenido.vocabulario_clave.map((vocab: string, i: number) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {vocab}
                      <button 
                        type="button"
                        onClick={() => eliminarVocabulario(i)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Etiquetas */}
            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ej: saludos, presentaciones"
                  value={etiquetaTemp}
                  onChange={(e) => setEtiquetaTemp(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarEtiqueta())}
                />
                <Button type="button" onClick={agregarEtiqueta} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.etiquetas && formData.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.etiquetas.map((etiqueta, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      {etiqueta}
                      <button 
                        type="button"
                        onClick={() => eliminarEtiqueta(etiqueta)}
                        className="ml-1 hover:text-destructive"
                      >
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
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Crear Lección
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  )
}