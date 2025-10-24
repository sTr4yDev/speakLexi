import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Trophy, Users, Settings } from "lucide-react"

export function QuickActions() {
  const actions = [
    { label: "Ver Lecciones", href: "/lecciones", icon: BookOpen, color: "bg-primary/10 text-primary" },
    { label: "Mis Logros", href: "/logros", icon: Trophy, color: "bg-secondary/10 text-secondary" },
    { label: "Clasificación", href: "/clasificacion", icon: Users, color: "bg-accent/10 text-accent" },
    { label: "Configuración", href: "/perfil", icon: Settings, color: "bg-muted text-muted-foreground" },
  ]

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-bold">Acciones Rápidas</h3>
      <div className="space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <Link key={index} href={action.href}>
              <Button variant="ghost" className="w-full justify-start gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {action.label}
              </Button>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
