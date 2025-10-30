"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, Eye, Trash2, Loader2, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Leccion {
  id: number
  titulo: string
  descripcion: string
  nivel: string
  idioma: string
  duracion_estimada: number
  estado: string
  actualizado_en?: string
}

export function RecentLessons() {
  const [lessons, setLessons] = useState<Leccion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarLecciones()
    
    // ✅ AUTO-REFRESH cada 10 segundos
    const interval = setInterval(() => {
      cargarLecciones()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const cargarLecciones = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/lecciones?por_pagina=5&pagina=1', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) throw new Error('Error al cargar')
      
      const data = await response.json()
      setLessons(data.lecciones || [])
    } catch (error: any) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, titulo: string) => {
    if (!confirm(`¿Archivar "${titulo}"?`)) return

    try {
      const response = await fetch(`http://localhost:5000/api/lecciones/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) throw new Error('Error')
      
      toast.success("Lección archivada")
      cargarLecciones()
    } catch (error: any) {
      toast.error("Error al archivar")
    }
  }

  const formatearFecha = (fecha: string) => {
    try {
      return formatDistanceToNow(new Date(fecha), { 
        addSuffix: true,
        locale: es 
      })
    } catch {
      return "Hace poco"
    }
  }

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      publicada: "default",
      borrador: "secondary",
      archivada: "outline"
    }
    
    return (
      <Badge variant={variants[estado] || "secondary"}>
        {estado === 'publicada' ? '✅' : estado === 'borrador' ? '📝' : '📦'} {estado}
      </Badge>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Lecciones Recientes</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={cargarLecciones}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/admin/lecciones/crear">
            <Button>Crear Lección</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No hay lecciones aún
          </p>
          <Link href="/admin/lecciones/crear">
            <Button variant="outline">Crear primera lección</Button>
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
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{lesson.nivel}</span>
                    <span>•</span>
                    <span>{lesson.idioma}</span>
                    <span>•</span>
                    <span>{lesson.duracion_estimada} min</span>
                  </div>
                  {lesson.actualizado_en && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatearFecha(lesson.actualizado_en)}
                    </p>
                  )}
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
                    onClick={() => handleDelete(lesson.id, lesson.titulo)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-2">
            <Link href="/admin/lecciones">
              <Button variant="outline" className="w-full">
                Ver todas las lecciones
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  )
}