"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Save, Trash2, BookOpen, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useUserData } from "@/hooks/use-user-data"
import { userAPI } from "@/lib/api"
import { authStorage } from "@/lib/auth"

export function ProfileSettings() {
  const { toast } = useToast()
  const router = useRouter()
  const { userData, isLoading, refetch } = useUserData()
  
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    correo: "",
  })

  useEffect(() => {
    if (userData) {
      setFormData({
        nombre: userData.usuario.nombre,
        primer_apellido: userData.usuario.primer_apellido,
        segundo_apellido: userData.usuario.segundo_apellido || "",
        correo: userData.usuario.correo,
      })
    }
  }, [userData])

  const handleSave = async () => {
    if (!userData) return

    setSaving(true)
    try {
      await userAPI.updatePerfil(formData)
      
      // Actualizar authStorage
      const currentUser = authStorage.getUser()
      if (currentUser) {
        authStorage.setUser({
          ...currentUser,
          nombre: formData.nombre,
          correo: formData.correo,
        })
      }
      
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados exitosamente",
      })
      
      // Recargar datos
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (userData) {
      setFormData({
        nombre: userData.usuario.nombre,
        primer_apellido: userData.usuario.primer_apellido,
        segundo_apellido: userData.usuario.segundo_apellido || "",
        correo: userData.usuario.correo,
      })
    }
  }

  const getInitials = () => {
    if (!userData) return "U"
    const { nombre, primer_apellido } = userData.usuario
    return `${primer_apellido[0]}${nombre[0]}`.toUpperCase()
  }

  const isStudent = userData?.usuario.rol === "alumno" || userData?.usuario.rol === "estudiante"

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">No se pudo cargar el perfil</p>
        <Button onClick={() => router.push("/login")}>Volver al login</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profile Info */}
      <Card className="p-6">
        <h2 className="mb-6 text-xl font-bold">Información Personal</h2>

        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm" disabled>
              Cambiar Foto
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG o GIF. Máximo 2MB</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primer_apellido">Primer Apellido</Label>
              <Input
                id="primer_apellido"
                value={formData.primer_apellido}
                onChange={(e) => setFormData({ ...formData, primer_apellido: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="segundo_apellido">Segundo Apellido (Opcional)</Label>
            <Input
              id="segundo_apellido"
              value={formData.segundo_apellido}
              onChange={(e) => setFormData({ ...formData, segundo_apellido: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Si cambias tu correo, deberás verificarlo nuevamente
            </p>
          </div>

          {isStudent && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="level">Nivel Actual</Label>
                <Input id="level" value={userData.perfil.nivel_actual} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Idioma</Label>
                <Input id="course" value={userData.perfil.idioma} disabled />
              </div>
            </div>
          )}

          {isStudent && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="xp">Experiencia Total</Label>
                <Input id="xp" value={`${userData.perfil.total_xp} XP`} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="racha">Racha Actual</Label>
                <Input id="racha" value={`${userData.perfil.dias_racha} días`} disabled />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
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