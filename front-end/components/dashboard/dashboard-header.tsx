"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, Bell, Settings, LogOut, User } from "lucide-react"
import { authStorage } from "@/lib/auth"

export function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [userInitials, setUserInitials] = useState<string>("U")

  useEffect(() => {
    // Obtener datos del usuario desde authStorage
    const role = authStorage.getUserRole()
    const name = authStorage.getUserName()
    const initials = authStorage.getUserInitials()
    
    setUserRole(role)
    setUserName(name)
    setUserInitials(initials)
  }, [])

  const handleLogout = () => {
    authStorage.logout()
    router.push("/login")
  }

  const getNavigationLinks = () => {
    switch (userRole) {
      case "profesor":
        return [
          { href: "/profesor/dashboard", label: "Dashboard" },
          { href: "/profesor/estadisticas", label: "Estadísticas" },
          { href: "/profesor/retroalimentacion", label: "Retroalimentación" },
          { href: "/profesor/planificacion", label: "Planificación" },
        ]
      case "admin":
        return [
          { href: "/admin/dashboard", label: "Dashboard" },
          { href: "/admin/lecciones", label: "Lecciones" },
          { href: "/admin/multimedia", label: "Biblioteca" },
          { href: "/admin/usuarios", label: "Usuarios" },
        ]
      case "estudiante":
      default:
        return [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/lecciones", label: "Lecciones" },
          { href: "/logros", label: "Logros" },
          { href: "/clasificacion", label: "Clasificación" },
        ]
    }
  }

  const navigationLinks = getNavigationLinks()

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href={navigationLinks[0].href} className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">SpeakLexi</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navigationLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-medium transition-colors ${
                pathname === link.href || (index === 0 && pathname.startsWith(link.href.split("/")[1]))
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/perfil" className="flex cursor-pointer items-center">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/perfil#configuracion" className="flex cursor-pointer items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}