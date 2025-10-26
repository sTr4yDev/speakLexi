"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Target, Trophy, Zap } from "lucide-react"
import { useUserData } from "@/hooks/use-user-data"

export function ProgressOverview() {
  const { userData, isLoading } = useUserData()

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-32 mt-6 rounded-lg" />
      </Card>
    )
  }

  // Datos dinámicos del usuario
  const totalXP = userData?.perfil.total_xp || 0
  const diasRacha = userData?.perfil.dias_racha || 0
  const nivelActual = userData?.perfil.nivel_actual || "A1"
  const idioma = userData?.perfil.idioma || "Inglés"

  // Calcular estadísticas
  const leccionesCompletadas = Math.floor(totalXP / 100) // 100 XP por lección (ejemplo)
  const totalLecciones = 50 // Esto debería venir del backend
  const logrosDesbloqueados = Math.floor(totalXP / 500) // 1 logro cada 500 XP (ejemplo)
  const totalLogros = 20

  // Calcular XP para siguiente nivel
  const nivelesXP: { [key: string]: number } = {
    A1: 1000,
    A2: 2000,
    B1: 3500,
    B2: 5000,
    C1: 7000,
    C2: 10000,
  }

  const xpNivelActual = nivelesXP[nivelActual] || 1000
  const xpParaSiguienteNivel = xpNivelActual
  const progresoNivel = Math.min((totalXP / xpParaSiguienteNivel) * 100, 100)
  const xpRestante = Math.max(xpParaSiguienteNivel - totalXP, 0)

  // Obtener siguiente nivel
  const niveles = ["A1", "A2", "B1", "B2", "C1", "C2"]
  const indexActual = niveles.indexOf(nivelActual)
  const siguienteNivel = indexActual < niveles.length - 1 ? niveles[indexActual + 1] : nivelActual

  const stats = [
    { 
      label: "Lecciones Completadas", 
      value: leccionesCompletadas, 
      total: totalLecciones, 
      icon: BookOpen, 
      color: "text-primary" 
    },
    { 
      label: "XP Total", 
      value: totalXP, 
      icon: Zap, 
      color: "text-accent" 
    },
    { 
      label: "Racha Actual", 
      value: diasRacha, 
      unit: diasRacha === 1 ? "día" : "días", 
      icon: Target, 
      color: "text-secondary" 
    },
    { 
      label: "Logros Desbloqueados", 
      value: logrosDesbloqueados, 
      total: totalLogros, 
      icon: Trophy, 
      color: "text-primary" 
    },
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
                {stat.total && (
                  <Progress 
                    value={(stat.value / stat.total) * 100} 
                    className="mt-2 h-2" 
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Level Progress */}
      <div className="mt-6 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold">
            Nivel {nivelActual} - {idioma}
          </span>
          <span className="text-sm text-muted-foreground">
            {totalXP} / {xpParaSiguienteNivel} XP
          </span>
        </div>
        <Progress value={progresoNivel} className="h-3" />
        <p className="mt-2 text-sm text-muted-foreground">
          {totalXP >= xpParaSiguienteNivel 
            ? `¡Felicidades! Has alcanzado el nivel ${nivelActual}` 
            : `${xpRestante} XP para alcanzar el nivel ${siguienteNivel}`}
        </p>
      </div>
    </Card>
  )
}