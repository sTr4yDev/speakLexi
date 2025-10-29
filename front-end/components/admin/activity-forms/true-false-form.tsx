"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Save, X } from "lucide-react"
import { toast } from "sonner"

interface ActivityFormProps {
  onGuardar: (actividad: any) => void
  onCancelar: () => void
  actividadEditar?: any
}

export function TrueFalseForm({ onGuardar, onCancelar, actividadEditar }: ActivityFormProps) {
  const [pregunta, setPregunta] = useState("")
  const [instrucciones, setInstrucciones] = useState("")
  const [respuestaCorrecta, setRespuestaCorrecta] = useState<boolean>(true)
  const [explicacion, setExplicacion] = useState("")
  const [pista, setPista] = useState("")
  const [puntos, setPuntos] = useState(10)

  useEffect(() => {
    if (actividadEditar) {
      setPregunta(actividadEditar.pregunta || "")
      setInstrucciones(actividadEditar.instrucciones || "")
      setRespuestaCorrecta(actividadEditar.respuesta_correcta || true)
      setExplicacion(actividadEditar.retroalimentacion?.explicacion || "")
      setPista(actividadEditar.pista || "")
      setPuntos(actividadEditar.puntos || 10)
    }
  }, [actividadEditar])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!pregunta.trim()) {
      toast.error("La afirmación es obligatoria")
      return
    }

    const actividad = {
      tipo: 'true_false',
      pregunta: pregunta.trim(),
      instrucciones: instrucciones.trim() || "¿Es verdadero o falso?",
      opciones: ["Verdadero", "Falso"],
      respuesta_correcta: respuestaCorrecta,
      retroalimentacion: {
        explicacion: explicacion.trim()
      },
      pista: pista.trim(),
      puntos,
      orden: actividadEditar?.orden || 0
    }

    onGuardar(actividad)
    toast.success("Actividad guardada")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pregunta">Afirmación *</Label>
        <Textarea
          id="pregunta"
          placeholder="Ej: The capital of France is Paris"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          rows={2}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instrucciones">Instrucciones</Label>
        <Input
          id="instrucciones"
          placeholder="Ej: Lee la afirmación y decide si es correcta"
          value={instrucciones}
          onChange={(e) => setInstrucciones(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <Label>Respuesta Correcta *</Label>
        <RadioGroup 
          value={respuestaCorrecta.toString()} 
          onValueChange={(v) => setRespuestaCorrecta(v === 'true')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="verdadero" />
            <Label htmlFor="verdadero" className="font-normal cursor-pointer">
              ✓ Verdadero
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="falso" />
            <Label htmlFor="falso" className="font-normal cursor-pointer">
              ✗ Falso
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="explicacion">Explicación (Opcional)</Label>
        <Textarea
          id="explicacion"
          placeholder="Explica por qué es verdadero o falso..."
          value={explicacion}
          onChange={(e) => setExplicacion(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pista">Pista (Opcional)</Label>
        <Input
          id="pista"
          placeholder="Ej: Piensa en la geografía europea..."
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
          value={puntos}
          onChange={(e) => setPuntos(parseInt(e.target.value))}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancelar} className="flex-1">
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          <Save className="mr-2 h-4 w-4" />
          Guardar Actividad
        </Button>
      </div>
    </form>
  )
}