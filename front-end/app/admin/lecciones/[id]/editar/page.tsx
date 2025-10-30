"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Award, BookOpen, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function LeccionVistaPrevia() {
  const params = useParams()
  const router = useRouter()
  const [leccion, setLeccion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      cargarLeccion(params.id as string)
    }
  }, [params.id])

  const cargarLeccion = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Cargando lección ID:', id)
      
      const token = localStorage.getItem('token')
      console.log('🔑 Token:', token ? 'Presente' : 'NO ENCONTRADO')
      
      const response = await fetch(`http://localhost:5000/api/lecciones/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Error response:', errorData)
        throw new Error(errorData.message || errorData.error || `Error ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Datos recibidos:', data)
      
      const leccionData = data.leccion || data
      console.log('📚 Lección procesada:', leccionData)
      
      if (!leccionData || !leccionData.id) {
        throw new Error('Los datos de la lección están incompletos')
      }
      
      setLeccion(leccionData)
      
    } catch (error: any) {
      console.error('❌ Error completo:', error)
      setError(error.message || 'Error desconocido al cargar la lección')
      toast.error('Error: ' + (error.message || 'No se pudo cargar la lección'))
    } finally {
      setLoading(false)
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

  if (error || !leccion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">❌ Error al cargar</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'Lección no encontrada'}
            </p>
            <div className="space-y-2">
              <Button onClick={() => cargarLeccion(params.id as string)} className="w-full">
                🔄 Reintentar
              </Button>
              <Button variant="outline" onClick={() => router.push('/admin/lecciones')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Lecciones
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{leccion.titulo}</CardTitle>
                  <CardDescription className="text-lg">{leccion.descripcion}</CardDescription>
                </div>
                <Badge variant={leccion.estado === 'publicada' ? 'default' : 'secondary'} className="ml-4">
                  {leccion.estado === 'publicada' ? '✅ Publicada' : 
                   leccion.estado === 'borrador' ? '📝 Borrador' : leccion.estado}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {leccion.nivel}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {leccion.duracion_estimada} min
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {leccion.puntos_xp} XP
                </Badge>
                {leccion.idioma && (
                  <Badge variant="outline">
                    🌐 {leccion.idioma}
                  </Badge>
                )}
                {leccion.categoria && (
                  <Badge variant="outline">
                    📚 {leccion.categoria}
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Contenido */}
          {leccion.contenido && typeof leccion.contenido === 'object' && (
            <>
              {/* Objetivos */}
              {leccion.contenido.objetivos && Array.isArray(leccion.contenido.objetivos) && leccion.contenido.objetivos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>📌 Objetivos de Aprendizaje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {leccion.contenido.objetivos.map((objetivo: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span>{objetivo}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Introducción */}
              {leccion.contenido.introduccion && leccion.contenido.introduccion.trim() && (
                <Card>
                  <CardHeader>
                    <CardTitle>💡 Introducción</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {leccion.contenido.introduccion}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Vocabulario */}
              {leccion.contenido.vocabulario_clave && Array.isArray(leccion.contenido.vocabulario_clave) && leccion.contenido.vocabulario_clave.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>📖 Vocabulario Clave</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {leccion.contenido.vocabulario_clave.map((palabra: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {palabra}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Actividades */}
          {leccion.actividades && Array.isArray(leccion.actividades) && leccion.actividades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>🎮 Actividades ({leccion.actividades.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {leccion.actividades.map((actividad: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">#{idx + 1} - {actividad.pregunta}</h4>
                      <Badge>{actividad.puntos || 10} pts</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tipo: {actividad.tipo || 'No especificado'}
                    </p>
                    {actividad.instrucciones && (
                      <p className="text-sm mt-2 text-muted-foreground italic">
                        "{actividad.instrucciones}"
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Etiquetas */}
          {leccion.etiquetas && Array.isArray(leccion.etiquetas) && leccion.etiquetas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>🏷️ Etiquetas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {leccion.etiquetas.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle>ℹ️ Información de la Lección</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-semibold text-muted-foreground">ID</dt>
                  <dd>{leccion.id}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted-foreground">Curso ID</dt>
                  <dd>{leccion.curso_id || 'No asignado'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted-foreground">Orden</dt>
                  <dd>{leccion.orden || 0}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted-foreground">Estado</dt>
                  <dd>{leccion.estado || 'borrador'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <Link href={`/admin/lecciones/${leccion.id}/editar`} className="flex-1">
              <Button className="w-full">
                ✏️ Editar Lección
              </Button>
            </Link>
            <Link href="/admin/lecciones" className="flex-1">
              <Button variant="outline" className="w-full">
                📚 Ver Todas las Lecciones
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}