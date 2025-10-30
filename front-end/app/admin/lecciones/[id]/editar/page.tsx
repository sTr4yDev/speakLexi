"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Eye, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { cursosAPI, leccionesAPI } from "@/lib/api"
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
    curso_id: "all",
    nivel: "all",
    estado: "all",
    categoria: "all"
  })

  useEffect(() => {
    cargarCursos()
    cargarLecciones()
  }, [filtros])

  const cargarCursos = async () => {
    try {
      const data = await cursosAPI.listar({ activo: true })
      setCursos(data.cursos || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cursos')
    }
  }

  const cargarLecciones = async () => {
    try {
      setLoading(true)
      
      const params: any = {}
      if (searchTerm) params.buscar = searchTerm
      if (filtros.curso_id && filtros.curso_id !== 'all') params.curso_id = parseInt(filtros.curso_id)
      if (filtros.nivel && filtros.nivel !== 'all') params.nivel = filtros.nivel
      if (filtros.estado && filtros.estado !== 'all') params.estado = filtros.estado
      if (filtros.categoria && filtros.categoria !== 'all') params.categoria = filtros.categoria
      
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
                placeholder="Buscar lecciones..." 
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
                  <SelectItem value="all">Todos los cursos</SelectItem>
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
                  <SelectItem value="all">Todos</SelectItem>
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
                  <SelectItem value="all">Todos</SelectItem>
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
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="vocabulario">📚 Vocabulario</SelectItem>
                  <SelectItem value="gramatica">📖 Gramática</SelectItem>
                  <SelectItem value="pronunciacion">🗣️ Pronunciación</SelectItem>
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
            <div className="text-center">
              <p className="mb-4">No se encontraron lecciones</p>
              <Link href="/admin/lecciones/crear">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Lección
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <Card key={lesson.id} className="p-4 hover:border-primary/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-semibold">{lesson.titulo}</h3>
                      {getEstadoBadge(lesson.estado || 'borrador')}
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">{lesson.descripcion}</p>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/lecciones/${lesson.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/lecciones/${lesson.id}/editar`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(lesson.id, lesson.titulo)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}