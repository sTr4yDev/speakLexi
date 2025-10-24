"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Eye, EyeOff, Loader2, ChevronDown, ChevronUp, User } from "lucide-react"

const TEST_USERS = [
  {
    name: "Estudiante Demo",
    email: "estudiante@speaklexi.com",
    password: "estudiante123",
    role: "estudiante",
    description: "Acceso completo al módulo de aprendizaje",
    dashboard: "/dashboard",
  },
  {
    name: "Profesor Demo",
    email: "profesor@speaklexi.com",
    password: "profesor123",
    role: "profesor",
    description: "Acceso a estadísticas y retroalimentación",
    dashboard: "/profesor/dashboard",
  },
  {
    name: "Admin Demo",
    email: "admin@speaklexi.com",
    password: "admin123",
    role: "admin",
    description: "Gestión de contenido y lecciones",
    dashboard: "/admin/dashboard",
  },
  {
    name: "Mantenimiento Demo",
    email: "mantenimiento@speaklexi.com",
    password: "mantenimiento123",
    role: "mantenimiento",
    description: "Reportes y tareas programadas",
    dashboard: "/mantenimiento/dashboard",
  },
]

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showTestUsers, setShowTestUsers] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleTestUserClick = (user: (typeof TEST_USERS)[0]) => {
    setFormData({
      email: user.email,
      password: user.password,
    })
    setShowTestUsers(false)
    toast({
      title: "Credenciales cargadas",
      description: `Listo para iniciar sesión como ${user.role}`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()
      
      // Debug: Ver qué está devolviendo el backend
      console.log("Respuesta del backend:", data)

      if (!res.ok) {
        throw new Error(data.error || data.message || "Error al iniciar sesión")
      }

      // Detectar la estructura de la respuesta (flexible)
      const usuario = data.usuario || data.user || data

      // Validar que tengamos los datos mínimos
      if (!usuario.rol && !usuario.role) {
        console.error("No se encontró el rol del usuario:", data)
        throw new Error("Respuesta del servidor inválida")
      }

      // Extraer datos con compatibilidad para diferentes formatos
      const rol = usuario.rol || usuario.role || "estudiante"
      const nombre = usuario.nombre || usuario.name || usuario.correo || formData.email
      const correo = usuario.correo || usuario.email || formData.email
      const id = usuario.id || usuario.usuario_id || ""

      // Guardar datos del usuario en localStorage
      localStorage.setItem("token", data.token || data.access_token || "")
      localStorage.setItem("userRole", rol)
      localStorage.setItem("userEmail", correo)
      localStorage.setItem("userName", nombre)
      localStorage.setItem("userId", id.toString())
      
      // Opcional: guardar idioma y nivel si vienen en la respuesta
      if (usuario.idioma) {
        localStorage.setItem("idioma", usuario.idioma)
      }
      if (usuario.nivel_actual) {
        localStorage.setItem("nivel", usuario.nivel_actual)
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido ${nombre}`,
      })

      // Redirigir según el rol del usuario
      let redirectPath = "/dashboard" // Default para estudiantes

      switch (rol.toLowerCase()) {
        case "estudiante":
        case "alumno":
          redirectPath = "/dashboard"
          break
        case "profesor":
        case "teacher":
          redirectPath = "/profesor/dashboard"
          break
        case "admin":
        case "administrador":
          redirectPath = "/admin/dashboard"
          break
        case "mantenimiento":
        case "maintenance":
          redirectPath = "/mantenimiento/dashboard"
          break
        default:
          redirectPath = "/dashboard"
      }

      router.push(redirectPath)
    } catch (error: any) {
      console.error("Error en login:", error)
      toast({
        title: "Error",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Sección de usuarios de prueba */}
      <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTestUsers(!showTestUsers)}
          className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Usuarios de Prueba
          </span>
          {showTestUsers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showTestUsers && (
          <div className="p-3 pt-0 space-y-2">
            {TEST_USERS.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() => handleTestUserClick(user)}
                className="w-full text-left p-3 rounded-md border border-border bg-background hover:bg-accent hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">{user.description}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                    {user.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Formulario de login */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link href="/recuperar-contrasena" className="text-sm text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </form>
    </div>
  )
}