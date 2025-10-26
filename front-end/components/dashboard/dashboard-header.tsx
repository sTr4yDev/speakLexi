"use client"

import { useEffect, useState } from "react"
import { Bell, Settings, LogOut, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface DashboardHeaderProps {
  nombre?: string
  primerApellido?: string
}

const IDIOMA_FLAGS: { [key: string]: string } = {
  "Inglés": "🇺🇸",
  "Francés": "🇫🇷",
  "Alemán": "🇩🇪",
  "Italiano": "🇮🇹"
}

export function DashboardHeader({ nombre = "Usuario", primerApellido = "" }: DashboardHeaderProps) {
  const router = useRouter()
  const [idioma, setIdioma] = useState("Inglés")
  const [nivel, setNivel] = useState("A1")

  useEffect(() => {
    cargarDatosUsuario()
  }, [])

  const cargarDatosUsuario = async () => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) return

      const res = await fetch(`http://localhost:5000/api/usuario/perfil/${userId}`)
      const data = await res.json()

      if (res.ok && data.perfil) {
        setIdioma(data.perfil.idioma || "Inglés")
        setNivel(data.perfil.nivel_actual || "A1")
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push("/login")
  }

  const iniciales = nombre && primerApellido 
    ? `${nombre[0]}${primerApellido[0]}`.toUpperCase()
    : "U"

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo / Título */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">SpeakLexi</h1>
        </div>

        {/* Idioma Actual */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5 text-sm">
            <span className="text-xl">{IDIOMA_FLAGS[idioma] || "🌍"}</span>
            <span className="font-medium">{idioma}</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-semibold">{nivel}</span>
          </Badge>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          {/* Notificaciones */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              3
            </span>
          </Button>

          {/* Cambiar Curso */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push("/cambiar-curso")}
            title="Cambiar curso"
          >
            <Languages className="h-5 w-5" />
          </Button>

          {/* Menú de Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {iniciales}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{nombre} {primerApellido}</p>
                  <p className="text-xs text-muted-foreground">Estudiante</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/perfil")}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/cambiar-curso")}>
                <Languages className="mr-2 h-4 w-4" />
                Cambiar curso
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}