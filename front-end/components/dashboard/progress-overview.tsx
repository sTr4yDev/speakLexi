import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Target, Trophy, Zap } from "lucide-react"

export function ProgressOverview() {
  const stats = [
    { label: "Lecciones Completadas", value: 12, total: 50, icon: BookOpen, color: "text-primary" },
    { label: "XP Total", value: 1250, icon: Zap, color: "text-accent" },
    { label: "Racha Actual", value: 7, unit: "días", icon: Target, color: "text-secondary" },
    { label: "Logros Desbloqueados", value: 5, total: 20, icon: Trophy, color: "text-primary" },
  ]

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-bold">Tu Progreso</h2>

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
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  {stat.unit && <span className="text-sm text-muted-foreground">{stat.unit}</span>}
                  {stat.total && <span className="text-sm text-muted-foreground">/ {stat.total}</span>}
                </div>
                {stat.total && <Progress value={(stat.value / stat.total) * 100} className="mt-2 h-2" />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Level Progress */}
      <div className="mt-6 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold">Nivel A2 - Elemental</span>
          <span className="text-sm text-muted-foreground">1250 / 2000 XP</span>
        </div>
        <Progress value={62.5} className="h-3" />
        <p className="mt-2 text-sm text-muted-foreground">750 XP para alcanzar el nivel B1</p>
      </div>
    </Card>
  )
}
