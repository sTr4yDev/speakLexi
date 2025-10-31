"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { MultipleChoiceActivity } from "@/components/lessons/activities/multiple-choice-activity"
import { FillBlankActivity } from "@/components/lessons/activities/fill-blank-activity"
import { CompletionModal } from "@/components/lessons/completion-modal"
import { AbandonLessonModal } from "@/components/lessons/abandon-lesson-modal"
import { ArrowLeft, ArrowRight, X, Loader2, BookOpen, Clock, Award, Image, Music, Video, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Actividad {
  id: number
  tipo: string
  pregunta: string
  opciones?: any
  respuesta_correcta: any
  instrucciones?: string
  pista?: string
  puntos: number
  orden: number
}

interface Multimedia {
  id: number
  tipo: string
  url: string
  nombre_archivo: string
  descripcion?: string
}

interface Leccion {
  id: number
  titulo: string
  descripcion: string
  contenido?: any
  nivel: string
  idioma: string
  categoria?: string
  duracion_estimada: number
  puntos_xp: number
  estado: string
  actividades?: Actividad[]
  multimedia?: Multimedia[]
}

export function LessonViewer({ lessonId }: { lessonId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [leccion, setLeccion] = useState<Leccion | null>(null)
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [multimedia, setMultimedia] = useState<Multimedia[]>([])
  const [currentActivity, setCurrentActivity] = useState(0)
  const [completedActivities, setCompletedActivities] = useState<number[]>([])
  const [showCompletion, setShowCompletion] = useState(false)
  const [showAbandonModal, setShowAbandonModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarLeccion()
  }, [lessonId])

  const cargarLeccion = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      
      // Cargar datos de la lección
      const response = await fetch(`http://localhost:5000/api/lecciones/${lessonId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar la lección')
      }

      const data = await response.json()
      const leccionData = data.leccion || data
      
      setLeccion(leccionData)
      
      // Cargar actividades de la lección
      try {
        const actividadesResponse = await fetch(`http://localhost:5000/api/actividades/leccion/${lessonId}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        })
        
        if (actividadesResponse.ok) {
          const actividadesData = await actividadesResponse.json()
          const actividadesOrdenadas = (actividadesData.actividades || actividadesData || [])
            .sort((a: Actividad, b: Actividad) => (a.orden || 0) - (b.orden || 0))
          setActividades(actividadesOrdenadas)
        }
      } catch (error) {
        console.error('Error al cargar actividades:', error)
      }
      
      // Cargar multimedia de la lección
      try {
        const multimediaResponse = await fetch(`http://localhost:5000/api/multimedia/leccion/${lessonId}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        })
        
        if (multimediaResponse.ok) {
          const multimediaData = await multimediaResponse.json()
          setMultimedia(multimediaData.multimedia || multimediaData || [])
        }
      } catch (error) {
        console.error('Error al cargar multimedia:', error)
      }
      
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || 'Error al cargar la lección')
      toast({
        title: "Error",
        description: "No se pudo cargar la lección",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleActivityComplete = (correct: boolean) => {
    if (!actividades.length) return
    
    const activity = actividades[currentActivity]
    
    if (correct) {
      setCompletedActivities([...completedActivities, activity.id])

      if (currentActivity === actividades.length - 1) {
        // Última actividad completada
        setShowCompletion(true)
      } else {
        toast({
          title: "¡Correcto! 🎉",
          description: `+${activity.puntos || 10} XP`,
        })
        // Avanzar a la siguiente actividad después de un breve delay
        setTimeout(() => {
          setCurrentActivity(currentActivity + 1)
        }, 1500)
      }
    } else {
      toast({
        title: "Inténtalo de nuevo",
        description: activity.pista || "Revisa tu respuesta",
        variant: "destructive",
      })
    }
  }

  const handleNext = () => {
    if (currentActivity < actividades.length - 1) {
      setCurrentActivity(currentActivity + 1)
    }
  }

  const handlePrevious = () => {
    if (currentActivity > 0) {
      setCurrentActivity(currentActivity - 1)
    }
  }

  const getMultimediaIcon = (tipo: string) => {
    if (tipo?.startsWith('image')) return <Image className="h-5 w-5" />
    if (tipo?.startsWith('audio')) return <Music className="h-5 w-5" />
    if (tipo?.startsWith('video')) return <Video className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const renderActivity = (activity: Actividad) => {
    // Renderizar actividad basada en el tipo
    switch (activity.tipo) {
      case 'multiple_choice':
        return (
          <MultipleChoiceActivity
            question={activity.pregunta}
            options={activity.opciones || []}
            correctAnswer={activity.respuesta_correcta}
            onComplete={handleActivityComplete}
          />
        )
      
      case 'fill_blank':
        return (
          <FillBlankActivity
            question={activity.pregunta}
            correctAnswer={activity.respuesta_correcta}
            onComplete={handleActivityComplete}
          />
        )
      
      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Tipo de actividad: {activity.tipo}
            </p>
            <p className="text-lg font-medium mb-6">{activity.pregunta}</p>
            {activity.instrucciones && (
              <p className="text-sm text-muted-foreground">{activity.instrucciones}</p>
            )}
            <Button onClick={() => handleActivityComplete(true)} className="mt-6">
              Continuar
            </Button>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando lección...</p>
        </div>
      </div>
    )
  }

  if (error || !leccion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error al cargar</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'Lección no encontrada'}
            </p>
            <div className="space-y-2">
              <Button onClick={cargarLeccion} className="w-full">
                Reintentar
              </Button>
              <Button variant="outline" onClick={() => router.push('/lecciones')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Lecciones
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = actividades.length > 0 
    ? ((currentActivity + 1) / actividades.length) * 100 
    : 0
  
  const currentActivityData = actividades[currentActivity]
  const isLastActivity = currentActivity === actividades.length - 1

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/lecciones">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Lecciones
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {actividades.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Actividad {currentActivity + 1} de {actividades.length}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowAbandonModal(true)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Información de la lección */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold mb-2">{leccion.titulo}</h1>
            <p className="text-muted-foreground">{leccion.descripcion}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">
              <BookOpen className="h-3 w-3 mr-1" />
              {leccion.nivel}
            </Badge>
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {leccion.duracion_estimada} min
            </Badge>
            <Badge variant="outline">
              <Award className="h-3 w-3 mr-1" />
              {leccion.puntos_xp} XP
            </Badge>
            {leccion.categoria && (
              <Badge variant="outline">
                📚 {leccion.categoria}
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          {actividades.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progreso</span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}
        </div>

        {/* Contenido de la lección */}
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Mostrar contenido introductorio si no hay actividades o es la primera */}
          {(actividades.length === 0 || currentActivity === 0) && leccion.contenido && (
            <Card>
              <CardHeader>
                <CardTitle>Contenido de la Lección</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {leccion.contenido.introduccion && (
                  <div>
                    <h3 className="font-semibold mb-2">Introducción</h3>
                    <p className="text-muted-foreground">{leccion.contenido.introduccion}</p>
                  </div>
                )}
                
                {leccion.contenido.objetivos && leccion.contenido.objetivos.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Objetivos de Aprendizaje</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {leccion.contenido.objetivos.map((objetivo: string, index: number) => (
                        <li key={index} className="text-muted-foreground">{objetivo}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {leccion.contenido.vocabulario_clave && leccion.contenido.vocabulario_clave.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Vocabulario Clave</h3>
                    <div className="flex flex-wrap gap-2">
                      {leccion.contenido.vocabulario_clave.map((palabra: string, index: number) => (
                        <Badge key={index} variant="secondary">{palabra}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mostrar multimedia si existe */}
          {multimedia.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recursos Multimedia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {multimedia.map((media) => (
                    <div key={media.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                          {getMultimediaIcon(media.tipo)}
                        </div>
                        <div>
                          <p className="font-medium">{media.nombre_archivo}</p>
                          {media.descripcion && (
                            <p className="text-sm text-muted-foreground">{media.descripcion}</p>
                          )}
                        </div>
                      </div>
                      <a href={media.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">Ver</Button>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Content */}
          {actividades.length > 0 ? (
            <Card className="p-8">
              {currentActivityData ? (
                renderActivity(currentActivityData)
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay actividades disponibles</p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-8">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Sin Actividades</h3>
                <p className="text-muted-foreground">
                  Esta lección aún no tiene actividades gamificadas
                </p>
              </div>
            </Card>
          )}

          {/* Navigation */}
          {actividades.length > 0 && (
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevious} 
                disabled={currentActivity === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {completedActivities.length} de {actividades.length} completadas
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleNext} 
                disabled={isLastActivity}
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      <AbandonLessonModal
        open={showAbandonModal}
        onOpenChange={setShowAbandonModal}
        lessonTitle={leccion.titulo}
        progress={Math.round(progress)}
      />

      {showCompletion && (
        <CompletionModal
          lessonTitle={leccion.titulo}
          xpEarned={leccion.puntos_xp}
          onClose={() => router.push("/lecciones")}
        />
      )}
    </>
  )
}