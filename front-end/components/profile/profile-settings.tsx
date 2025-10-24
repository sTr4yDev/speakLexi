"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Save, Trash2, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function ProfileSettings() {
  const { toast } = useToast()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "estudiante"
    setUserRole(role)
  }, [])

  const handleSave = () => {
    toast({
      title: "Perfil actualizado",
      description: "Tus cambios han sido guardados exitosamente",
    })
  }

  const isStudent = userRole === "estudiante"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profile Info */}
      <Card className="p-6">
        <h2 className="mb-6 text-xl font-bold">Información Personal</h2>

        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">JP</AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm">
              Cambiar Foto
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG o GIF. Máximo 2MB</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input id="name" defaultValue="Juan Pérez" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" type="email" defaultValue="juan@email.com" />
          </div>

          {isStudent && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="level">Nivel Actual</Label>
                <Input id="level" defaultValue="A2 - Elemental" disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Curso Actual</Label>
                <Input id="course" defaultValue="English Basics" disabled />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
          <Button variant="outline">Cancelar</Button>
        </div>
      </Card>

      {isStudent && (
        <Card className="p-6">
          <h2 className="mb-2 text-xl font-bold">Gestión de Curso</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Cambia tu curso actual si deseas aprender un idioma diferente.
          </p>
          <Button variant="outline" onClick={() => router.push("/cambiar-curso")}>
            <BookOpen className="mr-2 h-4 w-4" />
            Cambiar Curso
          </Button>
        </Card>
      )}

      {isStudent && (
        <Card className="border-destructive/50 p-6">
          <h2 className="mb-2 text-xl font-bold text-destructive">Zona de Peligro</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten cuidado.
          </p>
          <Button variant="destructive" onClick={() => router.push("/eliminar-cuenta")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar Cuenta
          </Button>
        </Card>
      )}
    </div>
  )
}
