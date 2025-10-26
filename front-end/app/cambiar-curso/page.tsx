"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Globe, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  Trophy,
  Star,
  ArrowLeft
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Nivel {
  id: string
  nombre: string
  descripcion: string
  desbloqueado: boolean
  progreso: number
  completado: boolean
}

const NIVELES_INGLES: Nivel[] = [
  {
    id: "A1",
    nombre: "A1 - Principiante",
    descripcion: "Vocabulario básico y frases simples",
    desbloqueado: true,
    progreso: 0,
    completado: false,
  },
  {
    id: "A2",
    nombre: "A2 - Elemental",
    descripcion: "Comunicación en situaciones cotidianas",
    desbloqueado: false,
    progreso: 0,
    completado: false,
  },
  {
    id: "B1",
    nombre: "B1 - Intermedio",
    descripcion: "Conversaciones sobre temas conocidos",
    desbloqueado: false,
    progreso: 0,
    completado: false,
  },
  {
    id: "B2",
    nombre: "B2 - Intermedio Alto",
    descripcion: "Discusiones complejas y textos técnicos",
    desbloqueado: false,
    progreso: 0,
    completado: false,
  },
  {
    id: "C1",
    nombre: "C1 - Avanzado",
    descripcion: "Expresión fluida y espontánea",
    desbloqueado: false,
    progreso: 0,
    completado: false,
  },
  {
    id: "C2",
    nombre: "C2 - Maestría",
    descripcion: "Dominio casi nativo del idioma",
    desbloqueado: false,
    progreso: 0,
    completado: false,
  },
]

const IDIOMAS = [
  {
    id: "Inglés",
    nombre: "Inglés",
    icono: "🇺🇸",
    disponible: true,
    descripcion: "Aprende el idioma más hablado del mundo",
  },
  {
    id: "Francés",
    nombre: "Francés",
    icono: "🇫🇷",
    disponible: false,
    descripcion: "Próximamente disponible",
  },
  {
    id: "Alemán",
    nombre: "Alemán",
    icono: "🇩🇪",
    disponible: false,
    descripcion: "Próximamente disponible",
  },
  {
    id: "Italiano",
    nombre: "Italiano",
    icono: "🇮🇹",
    disponible: false,
    descripcion: "Próximamente disponible",
  },
]

export default function CambiarCursoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [idiomaActual, setIdiomaActual] = useState("Inglés")
  const [nivelActual, setNivelActual] = useState("A1")
  const [niveles, setNiveles] = useState<Nivel[]>(NIVELES_INGLES)
  const [selectedNivel, setSelectedNivel] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    cargarProgreso()
  }, [])

  const cargarProgreso = async () => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        router.push("/login")
        return
      }

      // Obtener perfil del usuario
      const res = await fetch(`http://localhost:5000/api/usuario/perfil/${userId}`)
      const data = await res.json()

      if (res.ok) {
        setIdiomaActual(data.perfil.idioma || "Inglés")
        setNivelActual(data.perfil.nivel_actual || "A1")

        // Simular progreso (esto debería venir del backend)
        const nivelesConProgreso = NIVELES_INGLES.map((nivel, index) => {
          const nivelIndex = NIVELES_INGLES.findIndex(n => n.id === data.perfil.nivel_actual)
          
          return {
            ...nivel,
            desbloqueado: index <= nivelIndex,
            completado: index < nivelIndex,
            progreso: index < nivelIndex ? 100 : (index === nivelIndex ? 45 : 0) // Simulado
          }
        })

        setNiveles(nivelesConProgreso)
      }
    } catch (error) {
      console.error("Error al cargar progreso:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar tu progreso",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleCambiarNivel = async () => {
    if (!selectedNivel) return

    setLoading(true)
    try {
      const userId = localStorage.getItem("userId")
      
      const res = await fetch("http://localhost:5000/api/usuario/cambiar-curso", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: parseInt(userId!),
          idioma: idiomaActual,
          nivel: selectedNivel,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al cambiar de nivel")
      }

      // Actualizar localStorage
      localStorage.setItem("nivel", selectedNivel)

      toast({
        title: "¡Nivel cambiado!",
        description: `Ahora estás en el nivel ${selectedNivel}`,
      })

      // Recargar página para actualizar datos
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setShowConfirmation(false)
    }
  }

  const handleSelectNivel = (nivelId: string) => {
    const nivel = niveles.find(n => n.id === nivelId)
    if (!nivel?.desbloqueado) {
      toast({
        title: "Nivel bloqueado",
        description: "Debes completar el nivel anterior primero",
        variant: "destructive",
      })
      return
    }

    setSelectedNivel(nivelId)
    setShowConfirmation(true)
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 py-8">
      <div className="container max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              Cambiar Curso
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tu idioma y nivel de aprendizaje
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/perfil")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Button>
        </div>

        {/* Idioma Actual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Idiomas Disponibles
            </CardTitle>
            <CardDescription>
              Actualmente aprendiendo: <strong>{idiomaActual}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {IDIOMAS.map((idioma) => (
                <Card
                  key={idioma.id}
                  className={`cursor-pointer transition-all ${
                    idioma.id === idiomaActual
                      ? "border-primary ring-2 ring-primary"
                      : idioma.disponible
                      ? "hover:border-primary"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (!idioma.disponible) {
                      toast({
                        title: "Idioma no disponible",
                        description: idioma.descripcion,
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  <CardContent className="p-6 text-center space-y-2">
                    <div className="text-4xl">{idioma.icono}</div>
                    <div className="font-semibold">{idioma.nombre}</div>
                    <p className="text-xs text-muted-foreground">
                      {idioma.descripcion}
                    </p>
                    {idioma.id === idiomaActual && (
                      <Badge className="mt-2">Actual</Badge>
                    )}
                    {!idioma.disponible && (
                      <Badge variant="secondary" className="mt-2">
                        <Lock className="mr-1 h-3 w-3" />
                        Bloqueado
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Niveles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Niveles de {idiomaActual}
            </CardTitle>
            <CardDescription>
              Nivel actual: <strong>{nivelActual}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {niveles.map((nivel) => (
                <Card
                  key={nivel.id}
                  className={`cursor-pointer transition-all ${
                    nivel.id === nivelActual
                      ? "border-primary ring-2 ring-primary"
                      : nivel.desbloqueado
                      ? "hover:border-primary hover:shadow-md"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => nivel.id !== nivelActual && handleSelectNivel(nivel.id)}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{nivel.nombre}</h3>
                        <p className="text-sm text-muted-foreground">
                          {nivel.descripcion}
                        </p>
                      </div>
                      {nivel.completado ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                      ) : nivel.desbloqueado ? (
                        <Trophy className="h-6 w-6 text-primary flex-shrink-0" />
                      ) : (
                        <Lock className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>

                    {nivel.desbloqueado && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-semibold">{nivel.progreso}%</span>
                        </div>
                        <Progress value={nivel.progreso} className="h-2" />
                      </div>
                    )}

                    {nivel.id === nivelActual && (
                      <Badge className="w-full justify-center">
                        Nivel Actual
                      </Badge>
                    )}

                    {nivel.completado && nivel.id !== nivelActual && (
                      <Badge variant="secondary" className="w-full justify-center">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completado
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modal de Confirmación */}
        {showConfirmation && selectedNivel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Confirmar Cambio de Nivel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>¿Estás seguro?</strong>
                    <p className="mt-2 text-sm">
                      Cambiarás del nivel <strong>{nivelActual}</strong> al nivel{" "}
                      <strong>{selectedNivel}</strong>.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Tu progreso actual se guardará y podrás continuar desde donde lo dejaste.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowConfirmation(false)
                      setSelectedNivel(null)
                    }}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCambiarNivel}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cambiando...
                      </>
                    ) : (
                      <>
                        Confirmar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}