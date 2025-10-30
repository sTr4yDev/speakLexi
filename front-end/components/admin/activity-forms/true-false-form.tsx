"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Save, X, Eye, EyeOff, Check, X as XIcon } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select"
import { type Actividad } from "@/lib/api"

interface ActivityFormProps {
  onGuardar: (actividad: Actividad) => void
  onCancelar: () => void
  actividadEditar?: Actividad | null
}

export function TrueFalseForm({ onGuardar, onCancelar, actividadEditar }: ActivityFormProps) {
  const [afirmacion, setAfirmacion] = useState("")
  const [instrucciones, setInstrucciones] = useState("Determina si la afirmación es verdadera o falsa.")
  const [respuestaCorrecta, setRespuestaCorrecta] = useState<boolean>(true)
  const [explicacionVerdadero, setExplicacionVerdadero] = useState("")
  const [explicacionFalso, setExplicacionFalso] = useState("")
  const [pista, setPista] = useState("")
  const [puntos, setPuntos] = useState(10)
  const [mostrarPrevisualizacion, setMostrarPrevisualizacion] = useState(false)
  const [dificultad, setDificultad] = useState<"facil" | "medio" | "dificil">("medio")
  const [tema, setTema] = useState("")
  const [contexto, setContexto] = useState("")

  useEffect(() => {
    if (actividadEditar) {
      setAfirmacion(actividadEditar.pregunta || "")
      setInstrucciones(actividadEditar.instrucciones || "Determina si la afirmación es verdadera o falsa.")
      setRespuestaCorrecta(actividadEditar.respuesta_correcta || true)
      
      // Procesar retroalimentación
      if (actividadEditar.retroalimentacion) {
        if (typeof actividadEditar.retroalimentacion === 'object') {
          setExplicacionVerdadero(actividadEditar.retroalimentacion.explicacionVerdadero || "")
          setExplicacionFalso(actividadEditar.retroalimentacion.explicacionFalso || "")
        } else {
          // Para compatibilidad con versiones anteriores
          setExplicacionVerdadero(actividadEditar.retroalimentacion || "")
        }
      }
      
      setPista(actividadEditar.pista || "")
      setPuntos(actividadEditar.puntos || 10)
      setDificultad(actividadEditar.opciones?.dificultad || "medio")
      setTema(actividadEditar.opciones?.tema || "")
      setContexto(actividadEditar.opciones?.contexto || "")
    }
  }, [actividadEditar])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!afirmacion.trim()) {
      toast.error("La afirmación es obligatoria")
      return
    }

    const actividad: Actividad = {
      tipo: 'true_false',
      pregunta: afirmacion.trim(),
      instrucciones: instrucciones.trim(),
      opciones: {
        dificultad,
        tema: tema.trim() || undefined,
        contexto: contexto.trim() || undefined
      },
      respuesta_correcta: respuestaCorrecta,
      retroalimentacion: {
        correcto: respuestaCorrecta
          ? "¡Correcto! La afirmación es verdadera."
          : "¡Correcto! La afirmación es falsa.",
        incorrecto: respuestaCorrecta
          ? "Incorrecto. La afirmación es verdadera."
          : "Incorrecto. La afirmación es falsa.",
        explicacionVerdadero: explicacionVerdadero || undefined,
        explicacionFalso: explicacionFalso || undefined
      },
      pista: pista.trim() || undefined,
      puntos: puntos,
      orden: actividadEditar?.orden || 0,
      tiempo_limite: undefined,
      multimedia_id: undefined
    }

    onGuardar(actividad)
    toast.success(actividadEditar ? "Actividad actualizada" : "Actividad creada")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Previsualización */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Previsualización</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMostrarPrevisualizacion(!mostrarPrevisualizacion)}
            >
              {mostrarPrevisualizacion ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {mostrarPrevisualizacion ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
        </CardHeader>
        {mostrarPrevisualizacion && (
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Así verá el estudiante:</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={dificultad === "facil" ? "default" : dificultad === "medio" ? "secondary" : "destructive"}>
                    {dificultad}
                  </Badge>
                  {tema && <Badge variant="outline">{tema}</Badge>}
                </div>
                <p className="font-medium text-lg">{afirmacion || "Afirmación de ejemplo"}</p>
                {contexto && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
                    <p className="font-medium mb-1">📝 Contexto:</p>
                    <p>{contexto}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-3 border rounded-lg text-center ${
                    respuestaCorrecta ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''
                  }`}>
                    <Check className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <span className="font-medium">Verdadero</span>
                  </div>
                  <div className={`p-3 border rounded-lg text-center ${
                    !respuestaCorrecta ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''
                  }`}>
                    <XIcon className="h-6 w-6 text-red-600 mx-auto mb-1" />
                    <span className="font-medium">Falso</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Columna Izquierda */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="afirmacion">Afirmación *</Label>
            <Textarea
              id="afirmacion"
              placeholder="Ej: París es la capital de Francia."
              value={afirmacion}
              onChange={(e) => setAfirmacion(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrucciones">Instrucciones *</Label>
            <Textarea
              id="instrucciones"
              placeholder="Instrucciones detalladas para el estudiante..."
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contexto">Contexto (Opcional)</Label>
            <Textarea
              id="contexto"
              placeholder="Contexto adicional para entender la afirmación..."
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Configuración</Label>
            <div className="space-y-3 p-3 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="dificultad" className="text-sm">Dificultad</Label>
                <Select value={dificultad} onValueChange={(v: "facil" | "medio" | "dificil") => setDificultad(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facil">Fácil</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="dificil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tema" className="text-sm">Tema (Opcional)</Label>
                <Input
                  id="tema"
                  placeholder="Ej: Geografía, Historia, Ciencia..."
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Respuesta Correcta *</Label>
            <RadioGroup 
              value={respuestaCorrecta.toString()} 
              onValueChange={(v) => setRespuestaCorrecta(v === 'true')}
              className="space-y-3"
            >
              <Card className={respuestaCorrecta ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="true" id="verdadero" />
                    <div className="flex-1">
                      <Label htmlFor="verdadero" className="font-medium cursor-pointer flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Verdadero
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        La afirmación es correcta y precisa.
                      </p>
                    </div>
                    {respuestaCorrecta && (
                      <Badge variant="default" className="ml-2">
                        Correcta
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className={!respuestaCorrecta ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="false" id="falso" />
                    <div className="flex-1">
                      <Label htmlFor="falso" className="font-medium cursor-pointer flex items-center gap-2">
                        <XIcon className="h-4 w-4 text-red-600" />
                        Falso
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        La afirmación contiene errores o es incorrecta.
                      </p>
                    </div>
                    {!respuestaCorrecta && (
                      <Badge variant="default" className="ml-2">
                        Correcta
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Explicaciones (Opcional)</Label>
            
            <div className="space-y-2">
              <Label htmlFor="explicacionVerdadero" className="text-sm">Explicación si es Verdadero</Label>
              <Textarea
                id="explicacionVerdadero"
                placeholder="Explica por qué la afirmación es verdadera..."
                value={explicacionVerdadero}
                onChange={(e) => setExplicacionVerdadero(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="explicacionFalso" className="text-sm">Explicación si es Falso</Label>
              <Textarea
                id="explicacionFalso"
                placeholder="Explica por qué la afirmación es falsa..."
                value={explicacionFalso}
                onChange={(e) => setExplicacionFalso(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pista">Pista (Opcional)</Label>
            <Input
              id="pista"
              placeholder="Pista para ayudar al estudiante a decidir..."
              value={pista}
              onChange={(e) => setPista(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="puntos">Puntos</Label>
            <Input
              id="puntos"
              type="number"
              min="1"
              max="100"
              value={puntos}
              onChange={(e) => setPuntos(parseInt(e.target.value) || 10)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancelar} className="flex-1">
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          <Save className="mr-2 h-4 w-4" />
          {actividadEditar ? 'Actualizar' : 'Crear'} Actividad
        </Button>
      </div>
    </form>
  )
}