"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, X, Plus, Trash2, Eye, EyeOff, Shuffle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { type Actividad } from "@/lib/api"

interface ActivityFormProps {
  onGuardar: (actividad: Actividad) => void
  onCancelar: () => void
  actividadEditar?: Actividad | null
}

interface Par {
  id: string
  izquierda: string
  derecha: string
  pista?: string
  grupo?: string
}

export function MatchingForm({ onGuardar, onCancelar, actividadEditar }: ActivityFormProps) {
  const [titulo, setTitulo] = useState("")
  const [instrucciones, setInstrucciones] = useState("Empareja los elementos de la columna izquierda con los de la derecha.")
  const [pares, setPares] = useState<Par[]>([])
  const [izquierda, setIzquierda] = useState("")
  const [derecha, setDerecha] = useState("")
  const [grupo, setGrupo] = useState("")
  const [pista, setPista] = useState("")
  const [puntos, setPuntos] = useState(10)
  const [mostrarPrevisualizacion, setMostrarPrevisualizacion] = useState(false)
  const [mezclarOpciones, setMezclarOpciones] = useState(true)
  const [permiteArrastrar, setPermiteArrastrar] = useState(true)
  const [modoGrupos, setModoGrupos] = useState(false)

  useEffect(() => {
    if (actividadEditar) {
      setTitulo(actividadEditar.pregunta || "")
      setInstrucciones(actividadEditar.instrucciones || "Empareja los elementos de la columna izquierda con los de la derecha.")
      setPares(actividadEditar.opciones?.pares || [])
      setPista(actividadEditar.pista || "")
      setPuntos(actividadEditar.puntos || 10)
      setMezclarOpciones(actividadEditar.opciones?.mezclarOpciones ?? true)
      setPermiteArrastrar(actividadEditar.opciones?.permiteArrastrar ?? true)
      setModoGrupos(actividadEditar.opciones?.modoGrupos ?? false)
    }
  }, [actividadEditar])

  const generarId = () => Math.random().toString(36).substr(2, 9)

  const agregarPar = () => {
    if (!izquierda.trim() || !derecha.trim()) {
      toast.error("Completa ambos campos del par")
      return
    }

    const nuevoPar: Par = {
      id: generarId(),
      izquierda: izquierda.trim(),
      derecha: derecha.trim(),
      pista: pista.trim() || undefined,
      grupo: grupo.trim() || undefined
    }

    setPares([...pares, nuevoPar])
    setIzquierda("")
    setDerecha("")
    setPista("")
    setGrupo("")
    toast.success("Par agregado")
  }

  const eliminarPar = (id: string) => {
    setPares(pares.filter(par => par.id !== id))
  }

  const mezclarPares = () => {
    const paresMezclados = [...pares]
      .map(par => ({ ...par, id: generarId() })) // Nuevos IDs al mezclar
      .sort(() => Math.random() - 0.5)
    setPares(paresMezclados)
    toast.success("Pares mezclados")
  }

  const gruposUnicos = [...new Set(pares.map(par => par.grupo).filter(Boolean))]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim()) {
      toast.error("Agrega un título para la actividad")
      return
    }

    if (pares.length < 2) {
      toast.error("Debes agregar al menos 2 pares")
      return
    }

    if (modoGrupos && gruposUnicos.length < 2) {
      toast.error("En modo grupos, debes tener al menos 2 grupos diferentes")
      return
    }

    const actividad: Actividad = {
      tipo: 'matching',
      pregunta: titulo.trim(),
      instrucciones: instrucciones.trim(),
      opciones: {
        pares: pares,
        mezclarOpciones,
        permiteArrastrar,
        modoGrupos,
        grupos: modoGrupos ? gruposUnicos : undefined
      },
      respuesta_correcta: pares.map((par, index) => ({
        izquierda: par.izquierda,
        derecha: par.derecha,
        grupo: par.grupo,
        id: par.id
      })),
      retroalimentacion: {
        correcto: "¡Excelente! Has emparejado correctamente todos los elementos.",
        incorrecto: "Algunos emparejamientos no son correctos. Revísalos nuevamente."
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold mb-2">Columna A</div>
                  {pares.slice(0, 3).map((par, i) => (
                    <div key={i} className="p-2 border-b">{par.izquierda}</div>
                  ))}
                  {pares.length > 3 && <div className="p-2 text-muted-foreground">... y {pares.length - 3} más</div>}
                </div>
                <div>
                  <div className="font-semibold mb-2">Columna B</div>
                  {pares.slice(0, 3).map((par, i) => (
                    <div key={i} className="p-2 border-b">{mezclarOpciones ? "¿?" : par.derecha}</div>
                  ))}
                  {pares.length > 3 && <div className="p-2 text-muted-foreground">... y {pares.length - 3} más</div>}
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
            <Label htmlFor="titulo">Título de la actividad *</Label>
            <Input
              id="titulo"
              placeholder="Ej: Empareja países con sus capitales"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
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
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Configuración de la actividad</Label>
            <div className="space-y-3 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="mezclar" className="text-sm">Mezclar opciones</Label>
                <Switch
                  id="mezclar"
                  checked={mezclarOpciones}
                  onCheckedChange={setMezclarOpciones}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="arrastrar" className="text-sm">Permitir arrastrar</Label>
                <Switch
                  id="arrastrar"
                  checked={permiteArrastrar}
                  onCheckedChange={setPermiteArrastrar}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="grupos" className="text-sm">Modo grupos</Label>
                <Switch
                  id="grupos"
                  checked={modoGrupos}
                  onCheckedChange={setModoGrupos}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Pares a emparejar ({pares.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={mezclarPares}
                disabled={pares.length < 2}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Mezclar
              </Button>
            </div>

            {/* Formulario para agregar nuevo par */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Columna izquierda *</Label>
                    <Input
                      placeholder="Ej: Francia"
                      value={izquierda}
                      onChange={(e) => setIzquierda(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Columna derecha *</Label>
                    <Input
                      placeholder="Ej: París"
                      value={derecha}
                      onChange={(e) => setDerecha(e.target.value)}
                    />
                  </div>
                </div>
                
                {modoGrupos && (
                  <div className="space-y-2">
                    <Label className="text-xs">Grupo (opcional)</Label>
                    <Input
                      placeholder="Ej: Europa"
                      value={grupo}
                      onChange={(e) => setGrupo(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Pista específica (opcional)</Label>
                  <Input
                    placeholder="Pista para este par específico..."
                    value={pista}
                    onChange={(e) => setPista(e.target.value)}
                  />
                </div>

                <Button type="button" onClick={agregarPar} className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Par
                </Button>
              </CardContent>
            </Card>

            {/* Lista de pares existentes */}
            {pares.length > 0 && (
              <div className="space-y-3">
                <Label>Pares agregados:</Label>
                {pares.map((par, index) => (
                  <Card key={par.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary">#{index + 1}</Badge>
                            <div className="grid grid-cols-2 gap-4 flex-1">
                              <div className="font-medium">{par.izquierda}</div>
                              <div className="text-muted-foreground">↔ {par.derecha}</div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 text-xs">
                            {par.grupo && (
                              <Badge variant="outline">Grupo: {par.grupo}</Badge>
                            )}
                            {par.pista && (
                              <Badge variant="outline">💡 {par.pista}</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarPar(par.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {modoGrupos && gruposUnicos.length > 0 && (
            <div className="space-y-2">
              <Label>Grupos definidos:</Label>
              <div className="flex flex-wrap gap-2">
                {gruposUnicos.map((grupo, index) => (
                  <Badge key={index} variant="secondary">
                    {grupo}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pistaGeneral">Pista general (Opcional)</Label>
            <Input
              id="pistaGeneral"
              placeholder="Pista general para toda la actividad..."
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
        <Button type="submit" className="flex-1" disabled={pares.length < 2}>
          <Save className="mr-2 h-4 w-4" />
          {actividadEditar ? 'Actualizar' : 'Crear'} Actividad
        </Button>
      </div>
    </form>
  )
}