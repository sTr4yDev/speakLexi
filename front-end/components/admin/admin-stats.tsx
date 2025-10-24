import { Card } from "@/components/ui/card"
import { BookOpen, ImageIcon, Users, FileText } from "lucide-react"

export function AdminStats() {
  const stats = [
    {
      label: "Total Lecciones",
      value: 156,
      change: "+8 esta semana",
      icon: BookOpen,
      color: "text-primary",
    },
    {
      label: "Archivos Multimedia",
      value: 342,
      change: "+15 este mes",
      icon: ImageIcon,
      color: "text-secondary",
    },
    {
      label: "Usuarios Totales",
      value: 1248,
      change: "+52 este mes",
      icon: Users,
      color: "text-accent",
    },
    {
      label: "Cursos Activos",
      value: 12,
      change: "+2 este mes",
      icon: FileText,
      color: "text-primary",
    },
  ]

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-bold">Estadísticas de Contenido</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-background ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
