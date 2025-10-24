"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ArrowRight, Save } from "lucide-react"

export function CreateLessonForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "A1",
    language: "English",
    xpReward: 10,
  })

  const handleSubmit = () => {
    toast({
      title: "Lección creada",
      description: "La lección ha sido guardada exitosamente",
    })
    router.push("/admin/lecciones")
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            <span className="text-sm font-medium">
              {s === 1 ? "Datos Básicos" : s === 2 ? "Actividades" : "Multimedia"}
            </span>
            {s < 3 && <div className="h-0.5 w-12 bg-border" />}
          </div>
        ))}
      </div>

      <Card className="p-8">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Paso 1: Datos Básicos</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Lección</Label>
                <Input
                  id="title"
                  placeholder="Ej: Greetings and Introductions"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el contenido de la lección..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="level">Nivel</Label>
                  <Input
                    id="level"
                    placeholder="A1, A2, B1..."
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Input
                    id="language"
                    placeholder="English, Spanish..."
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="xp">Recompensa XP</Label>
                <Input
                  id="xp"
                  type="number"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Paso 2: Actividades</h2>
            <p className="text-muted-foreground">Agrega actividades interactivas a tu lección</p>

            <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">No hay actividades agregadas aún</p>
              <Button className="mt-4">Agregar Actividad</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Paso 3: Multimedia</h2>
            <p className="text-muted-foreground">Sube imágenes, audio o videos para tu lección</p>

            <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">No hay archivos multimedia agregados</p>
              <Button className="mt-4">Subir Archivos</Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Lección
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
