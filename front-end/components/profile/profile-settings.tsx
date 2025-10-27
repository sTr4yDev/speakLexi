"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Save, Trash2, Loader2, Languages } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function ProfileSettings() {
  const { toast } = useToast()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    correo: "",
  })

  useEffect(() => {
    cargarDatosUsuario()
  }, [])

  const cargarDatosUsuario = async () => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        router.push("/login")
        return
      }

      const res = await fetch(`http://localhost:5000/api/usuario/perfil/${userId}`)
      const data = await res.json()

      if (res.ok) {
        setUserData(data)
        setFormData({
          nombre: data.usuario.nombre,
          primer_apellido: data.usuario.primer_apellido,
          segundo_apellido: data.usuario.segundo_apellido || "",
          correo: data.usuario.correo,
        })
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!userData) return

    setSaving(true)
    try {
      const userId = localStorage.getItem("userId")
      const res = await fetch(`http://localhost:5000/api/usuarios/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Error al actualizar")

      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados exitosamente",
      })
      
      // Recargar datos
      await cargarDatosUsuario()
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

  // Iniciales corregidas: PH (Primer apellido + Nombre)
  const getInitials = () => {
    if (!userData) return "U"
    const { primer_apellido, nombre } = userData.usuario
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

          {isStudent && userData.perfil && (
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

          {isStudent && userData.perfil && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="xp">Experiencia Total</Label>
                <Input id="xp" value={`${userData.perfil.total_xp || 0} XP`} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="racha">Racha Actual</Label>
                <Input id="racha" value={`${userData.perfil.dias_racha || 0} días`} disabled />
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

      {/* Gestión de Curso - Solo para estudiantes */}
      {isStudent && (
        <Card className="p-6">
          <h2 className="mb-2 text-xl font-bold">Gestión de Curso</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Cambia tu curso actual si deseas aprender un idioma diferente o ajustar tu nivel.
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push("/cambiar-curso")}
            className="w-full sm:w-auto"
          >
            <Languages className="mr-2 h-4 w-4" />
            Cambiar Curso
          </Button>
        </Card>
      )}

      {/* Zona de Peligro - Solo para estudiantes */}
      {isStudent && (
        <Card className="border-destructive/50 p-6">
          <h2 className="mb-2 text-xl font-bold text-destructive">Zona de Peligro</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten cuidado.
          </p>
          <Button 
            variant="destructive" 
            onClick={() => router.push("/eliminar-cuenta")}
            className="w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar Cuenta
          </Button>
        </Card>
      )}
    </div>
  )
}