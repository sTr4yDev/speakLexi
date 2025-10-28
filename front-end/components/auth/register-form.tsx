"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Loader2, Shield } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    primerApellido: "",
    segundoApellido: "",
    correo: "",
    password: "",
    confirmPassword: "",
    idioma: "",
    nivel: "",
    rol: "estudiante", // 👈 nuevo campo por defecto
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          primer_apellido: formData.primerApellido,
          segundo_apellido: formData.segundoApellido,
          correo: formData.correo,
          password: formData.password,
          idioma: formData.idioma,
          nivel_actual: formData.nivel,
          rol: formData.rol, // 👈 se envía el rol temporal
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al registrar usuario")

      localStorage.setItem("correo", formData.correo)
      localStorage.setItem("idioma", formData.idioma)

      toast({
        title: "Cuenta creada exitosamente",
        description:
          formData.rol === "admin"
            ? "✅ Usuario admin creado (modo desarrollo)"
            : "Verifica tu correo electrónico para continuar",
      })

      router.push("/verificar-email")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          type="text"
          placeholder="Juan"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
        />
      </div>

      {/* Primer Apellido */}
      <div className="space-y-2">
        <Label htmlFor="primerApellido">Primer Apellido</Label>
        <Input
          id="primerApellido"
          type="text"
          placeholder="Pérez"
          value={formData.primerApellido}
          onChange={(e) =>
            setFormData({ ...formData, primerApellido: e.target.value })
          }
          required
        />
      </div>

      {/* Segundo Apellido */}
      <div className="space-y-2">
        <Label htmlFor="segundoApellido">Segundo Apellido (opcional)</Label>
        <Input
          id="segundoApellido"
          type="text"
          placeholder="Martínez"
          value={formData.segundoApellido}
          onChange={(e) =>
            setFormData({ ...formData, segundoApellido: e.target.value })
          }
        />
      </div>

      {/* Correo */}
      <div className="space-y-2">
        <Label htmlFor="correo">Correo Electrónico</Label>
        <Input
          id="correo"
          type="email"
          placeholder="tu@email.com"
          value={formData.correo}
          onChange={(e) =>
            setFormData({ ...formData, correo: e.target.value })
          }
          required
        />
      </div>

      {/* Contraseña */}
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Confirmar Contraseña */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Repite tu contraseña"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          required
        />
      </div>

      {/* Idioma */}
      <div className="space-y-2">
        <Label htmlFor="idioma">Idioma de aprendizaje</Label>
        <select
          id="idioma"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={formData.idioma}
          onChange={(e) =>
            setFormData({ ...formData, idioma: e.target.value })
          }
          required
        >
          <option value="">Selecciona un idioma</option>
          <option value="inglés">Inglés</option>
          <option value="francés">Francés</option>
          <option value="alemán">Alemán</option>
          <option value="italiano">Italiano</option>
        </select>
      </div>

      {/* ⚙️ Rol temporal (solo desarrollo) */}
      <div className="space-y-2 border rounded-md p-3 bg-muted/30">
        <Label htmlFor="rol" className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Rol temporal (solo desarrollo)
        </Label>
        <select
          id="rol"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          value={formData.rol}
          onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
        >
          <option value="estudiante">Estudiante</option>
          <option value="profesor">Profesor</option>
          <option value="admin">Admin</option>
          <option value="mantenimiento">Mantenimiento</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          🔐 Solo para pruebas locales. Este campo será removido en producción.
        </p>
      </div>

      {/* Botón */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          "Crear Cuenta"
        )}
      </Button>
    </form>
  )
}
