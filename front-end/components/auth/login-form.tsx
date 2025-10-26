"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Eye, EyeOff, Loader2, ChevronDown, ChevronUp, User, AlertCircle, RefreshCw } from "lucide-react"
import { authStorage } from "@/lib/auth"

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

  const [cuentaDesactivada, setCuentaDesactivada] = useState(false)
  const [diasRestantes, setDiasRestantes] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleTestUserClick = (user: (typeof TEST_USERS)[0]) => {
    setFormData({
      email: user.email,
      password: user.password,
    })
    setShowTestUsers(false)
    setCuentaDesactivada(false)
    setError("")
    
    toast({
      title: "Credenciales cargadas",
      description: `Listo para iniciar sesión como ${user.role}`,
    })
  }

  const handleReactivar = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError("")
    
    try {
      const res = await fetch(`http://localhost:5000/api/usuario/reactivar/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al reactivar la cuenta")
      }

      const data = await res.json()

      toast({
        title: "¡Cuenta reactivada!",
        description: data.mensaje || "Tu cuenta ha sido reactivada exitosamente",
      })

      setCuentaDesactivada(false)
      setError("")
      
      setTimeout(() => {
        handleSubmit(new Event('submit') as any)
      }, 1000)

    } catch (error: any) {
      console.error("Error al reactivar:", error)
      
      let errorMessage = "Error al reactivar la cuenta"
      
      if (error.message === "Failed to fetch") {
        errorMessage = "No se pudo conectar con el servidor. Verifica que esté corriendo."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setCuentaDesactivada(false)
    setError("")

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
      
      console.log("📦 Respuesta completa del backend:", data)

      if (!res.ok) {
        // CUENTA DESACTIVADA
        if (data.codigo === "CUENTA_DESACTIVADA") {
          const id = data.usuario_id || data.usuario?.id
          
          if (id) {
            setUserId(id.toString())
          }
          
          setCuentaDesactivada(true)
          setDiasRestantes(data.dias_restantes || 0)
          
          toast({
            title: "Cuenta desactivada",
            description: `Tienes ${data.dias_restantes || 0} días para reactivarla`,
            variant: "destructive",
          })
          
          setIsLoading(false)
          return
        }

        // CUENTA ELIMINADA
        if (data.codigo === "CUENTA_ELIMINADA") {
          setError("Esta cuenta ha sido eliminada permanentemente")
          toast({
            title: "Cuenta eliminada",
            description: "Esta cuenta ha sido eliminada permanentemente",
            variant: "destructive",
          })
          
          setIsLoading(false)
          return
        }

        // EMAIL NO VERIFICADO
        if (data.codigo === "EMAIL_NOT_VERIFIED") {
          toast({
            title: "Email no verificado",
            description: "Redirigiendo a verificación...",
            variant: "destructive",
          })
          
          setTimeout(() => {
            router.push(`/verificar-email?email=${encodeURIComponent(formData.email)}`)
          }, 1500)
          
          setIsLoading(false)
          return
        }

        throw new Error(data.error || "Error al iniciar sesión")
      }

      // LOGIN EXITOSO - Usar authStorage
      const usuario = data.usuario

      if (!usuario) {
        throw new Error("Respuesta del servidor inválida: falta información del usuario")
      }

      console.log("✅ Usuario recibido del backend:", usuario)

      // ✅ GUARDAR CON authStorage
      authStorage.setUser({
        id: usuario.id,
        id_publico: usuario.id_publico || "",
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        idioma: usuario.idioma || null,
        nivel_actual: usuario.nivel_actual || null,
      })

      console.log("✅ Usuario guardado en authStorage:", authStorage.getUser())

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido ${usuario.nombre}`,
      })

      // Redirigir según el rol
      const rol = usuario.rol.toLowerCase()
      console.log("🔀 Rol detectado:", rol)
      
      let redirectPath = "/dashboard"

      if (rol === "profesor" || rol === "teacher") {
        redirectPath = "/profesor/dashboard"
      } else if (rol === "admin" || rol === "administrador") {
        redirectPath = "/admin/dashboard"
      } else if (rol === "mantenimiento" || rol === "maintenance") {
        redirectPath = "/mantenimiento/dashboard"
      } else {
        redirectPath = "/dashboard"
      }

      console.log("🚀 Redirigiendo a:", redirectPath)
      
      // Forzar recarga completa para que authStorage esté disponible
      window.location.href = redirectPath

    } catch (error: any) {
      console.error("❌ Error en login:", error)
      
      let errorMessage = "Error al iniciar sesión"
      
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        errorMessage = "No se pudo conectar con el servidor. Verifica que esté corriendo en http://localhost:5000"
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ALERTA DE ERRORES GENERALES */}
      {error && !cuentaDesactivada && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ALERTA DE CUENTA DESACTIVADA */}
      {cuentaDesactivada && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <RefreshCw className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong className="text-orange-900 dark:text-orange-100">
              Tu cuenta está desactivada
            </strong>
            <p className="mt-2 text-sm text-orange-800 dark:text-orange-200">
              {diasRestantes > 0 ? (
                <>
                  Tienes <strong>{diasRestantes} días</strong> para reactivarla. 
                  Después de ese período será eliminada permanentemente.
                </>
              ) : (
                "El período de recuperación ha expirado. La cuenta será eliminada pronto."
              )}
            </p>
            {diasRestantes > 0 && (
              <Button
                onClick={handleReactivar}
                disabled={isLoading}
                className="mt-3 w-full"
                variant="default"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reactivando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reactivar mi cuenta
                  </>
                )}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* USUARIOS DE PRUEBA */}
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

      {/* FORMULARIO DE LOGIN */}
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
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link 
              href="/recuperar-contrasena" 
              className="text-sm text-primary hover:underline"
              tabIndex={-1}
            >
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
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
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

      {/* ENLACE A REGISTRO */}
      <div className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-primary hover:underline font-medium">
          Regístrate aquí
        </Link>
      </div>
    </div>
  )
}