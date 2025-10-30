"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Eye, Trash2, Loader2, BookOpen, Award, Clock } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { cursosAPI, leccionesAPI } from "@/lib/api" // ✅ IMPORTAR LAS APIS
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Curso {
  id: number
  nombre: string
  nivel: string
  codigo: string
}

interface Leccion {
  id: number
  curso_id?: number
  titulo: string
  descripcion: string
  nivel: string
  idioma: string
  categoria?: string
  duracion_estimada: number
  puntos_xp: number
  estado: string
  orden?: number
  curso?: Curso
}

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Leccion[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtros, setFiltros] = useState({
    curso_id: "",
    nivel: "",
    estado: "",
    categoria: ""
  })

  useEffect(() => {
    cargarCursos()
    cargarLecciones()
  }, [filtros])

  // ✅ USAR cursosAPI en lugar de fetch directo
  const cargarCursos = async () => {
    try {
      const data = await cursosAPI.listar({ activo: true })
      setCursos(data.cursos || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cursos')
    }
  }

  // ✅ USAR leccionesAPI en lugar de fetch directo
  const cargarLecciones = async () => {
    try {
      setLoading(true)
      
      const params: any = {}
      if (searchTerm) params.buscar = searchTerm
      if (filtros.curso_id) params.curso_id = parseInt(filtros.curso_id)
      if (filtros.nivel) params.nivel = filtros.nivel
      if (filtros.estado) params.estado = filtros.estado
      if (filtros.categoria) params.categoria = filtros.categoria
      
      const data = await leccionesAPI.listar(params)
      setLessons(data.lecciones || [])
    } catch (error: any) {
      console.error("Error al cargar lecciones:", error)
      toast.error(error.message || "Error al cargar lecciones")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    cargarLecciones()
  }

  // ✅ USAR leccionesAPI en lugar de fetch directo
  const handleDelete = async (id: number, titulo: string) => {
    if (!confirm(`¿Estás seguro de archivar la lección "${titulo}"?`)) {
      return
    }

    try {
      await leccionesAPI.eliminar(id)
      toast.success("Lección archivada exitosamente")
      cargarLecciones()
    } catch (error: any) {
      console.error("Error al eliminar:", error)
      toast.error(error.message || "Error al archivar lección")
    }
  }

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      publicada: "default",
      borrador: "secondary",
      archivada: "outline"
    }
    
    const labels: Record<string, string> = {
      publicada: "✅ Publicada",
      borrador: "📝 Borrador",
      archivada: "📦 Archivada"
    }
    
    return (
      <Badge variant={variants[estado] || "secondary"}>
        {labels[estado] || estado}
      </Badge>
    )
  }

  const getNivelColor = (nivel: string) => {
    const colors: Record<string, string> = {
      principiante: "text-green-600 bg-green-50",
      intermedio: "text-blue-600 bg-blue-50",
      avanzado: "text-purple-600 bg-purple-50"
    }
    return colors[nivel] || "text-gray-600 bg-gray-50"
  }

  const leccionesPorCurso = lessons.reduce((acc, leccion) => {
    const cursoId = leccion.curso_id || 0
    if (!acc[cursoId]) {
      acc[cursoId] = []
    }
    acc[cursoId].push(leccion)
    return acc
  }, {} as Record<number, Leccion[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">📚 Gestión de Lecciones</h1>
            <p className="mt-1 text-muted-foreground">
              {loading ? "Cargando..." : `${lessons.length} lecciones encontradas`}
            </p>
          </div>
          <Link href="/admin/lecciones/crear">
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Crear Nueva Lección
            </Button>
          </Link>
        </div>

        <Card className="mb-6 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar lecciones por título o descripción..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <Select
                value={filtros.curso_id}
                onValueChange={(value) => setFiltros({...filtros, curso_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-courses">Todos los cursos</SelectItem>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id.toString()}>
                      {curso.codigo} - {curso.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filtros.nivel}
                onValueChange={(value) => setFiltros({...filtros, nivel: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los niveles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-levels">Todos los niveles</SelectItem>
                  <SelectItem value="principiante">Principiante</SelectItem>
                  <SelectItem value="intermedio">Intermedio</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.estado}
                onValueChange={(value) => setFiltros({...filtros, estado: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">Todos los estados</SelectItem>
                  <SelectItem value="publicada">Publicada</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="archivada">Archivada</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.categoria}
                onValueChange={(value) => setFiltros({...filtros, categoria: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">Todas las categorías</SelectItem>
                  <SelectItem value="vocabulario">📚 Vocabulario</SelectItem>
                  <SelectItem value="gramatica">📖 Gramática</SelectItem>
                  <SelectItem value="pronunciacion">🗣️ Pronunciación</SelectItem>
                  <SelectItem value="conversacion">💬 Conversación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </Card>

        {loading ? (
          <Card className="p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </Card>
        ) : lessons.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="mb-2 text-lg font-semibold">No se encontraron lecciones</p>
              <p className="mb-4">Comienza creando tu primera lección</p>
              <Link href="/admin/lecciones/crear">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Lección
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(leccionesPorCurso).map(([cursoId, leccionesCurso]) => {
              const curso = cursos.find(c => c.id === parseInt(cursoId)) || null
              
              return (
                <Card key={cursoId} className="overflow-hidden">
                  <div className="border-b bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">
                          {curso ? (
                            <>
                              🎓 {curso.codigo} - {curso.nombre}
                              <Badge variant="outline" className="ml-2">
                                {curso.nivel}
                              </Badge>
                            </>
                          ) : (
                            '📋 Sin curso asignado'
                          )}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {leccionesCurso.length} {leccionesCurso.length === 1 ? 'lección' : 'lecciones'}
                        </p>
                      </div>
                      {curso && (
                        <Link href={`/admin/cursos/${curso.id}`}>
                          <Button variant="outline" size="sm">
                            Ver Curso
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-3">
                      {leccionesCurso
                        .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                        .map((lesson) => (
                        <div
                          key={lesson.id}
                          className="group rounded-xl border-2 border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="text-muted-foreground">#{lesson.orden || '?'}</span>
                                <h3 className="font-semibold">{lesson.titulo}</h3>
                                {getEstadoBadge(lesson.estado || 'borrador')}
                              </div>
                              
                              <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                                {lesson.descripcion}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                <Badge className={getNivelColor(lesson.nivel)}>
                                  {lesson.nivel}
                                </Badge>
                                
                                {lesson.categoria && (
                                  <Badge variant="outline">
                                    {lesson.categoria}
                                  </Badge>
                                )}
                                
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{lesson.duracion_estimada} min</span>
                                </div>
                                
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Award className="h-3 w-3" />
                                  <span>{lesson.puntos_xp} XP</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <Link href={`/lecciones/${lesson.id}`}>
                                <Button variant="ghost" size="icon" title="Vista previa">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/admin/lecciones/${lesson.id}/editar`}>
                                <Button variant="ghost" size="icon" title="Editar">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Archivar"
                                onClick={() => handleDelete(lesson.id, lesson.titulo)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}