"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Eye, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { leccionesAPI, type Leccion } from "@/lib/api"
import { toast } from "sonner"

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Leccion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtros, setFiltros] = useState({
    nivel: "",
    estado: "",
    pagina: 1,
    por_pagina: 20
  })

  // Cargar lecciones
  useEffect(() => {
    cargarLecciones()
  }, [filtros])

  const cargarLecciones = async () => {
    try {
      setLoading(true)
      const response = await leccionesAPI.listar({
        ...filtros,
        buscar: searchTerm || undefined
      })
      
      setLessons(response.lecciones || [])
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
      cargarLecciones() // Recargar lista
    } catch (error: any) {
      console.error("Error al eliminar:", error)
      toast.error(error.message || "Error al archivar lección")
    }
  }

  const getEstadoBadge = (estado: string) => {
    const variants = {
      publicada: "default",
      borrador: "secondary",
      archivada: "outline"
    }
    
    const labels = {
      publicada: "Publicada",
      borrador: "Borrador",
      archivada: "Archivada"
    }
    
    return (
      <Badge variant={variants[estado as keyof typeof variants] as any}>
        {labels[estado as keyof typeof labels] || estado}
      </Badge>
    )
  }

  const getNivelColor = (nivel: string) => {
    const colors = {
      principiante: "text-green-600",
      intermedio: "text-blue-600",
      avanzado: "text-purple-600"
    }
    return colors[nivel as keyof typeof colors] || "text-gray-600"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Gestión de Lecciones</h1>
            <p className="mt-1 text-muted-foreground">
              {loading ? "Cargando..." : `${lessons.length} lecciones encontradas`}
            </p>
          </div>
          <Link href="/admin/lecciones/crear">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Lección
            </Button>
          </Link>
        </div>

        <Card className="mb-6 p-6">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar lecciones..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </Card>

        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : lessons.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No se encontraron lecciones</p>
              <Link href="/admin/lecciones/crear">
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primera lección
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="rounded-xl border-2 border-border bg-card p-4 transition-all hover:border-primary/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="font-semibold">{lesson.titulo}</h3>
                        {getEstadoBadge(lesson.estado || 'borrador')}
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                        {lesson.descripcion}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className={getNivelColor(lesson.nivel)}>
                          Nivel: {lesson.nivel}
                        </span>
                        <span>•</span>
                        <span>{lesson.idioma}</span>
                        {lesson.categoria && (
                          <>
                            <span>•</span>
                            <span>{lesson.categoria}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{lesson.duracion_estimada} min</span>
                        <span>•</span>
                        <span>{lesson.puntos_xp} XP</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
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
                        onClick={() => handleDelete(lesson.id!, lesson.titulo)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}