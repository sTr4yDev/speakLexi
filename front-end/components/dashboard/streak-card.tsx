import { Card } from "@/components/ui/card"
import { Flame } from "lucide-react"

export function StreakCard() {
  const weekDays = ["L", "M", "X", "J", "V", "S", "D"]
  const completedDays = [true, true, true, true, true, true, true]

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Flame className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h3 className="font-bold">Racha de Fuego</h3>
          <p className="text-sm text-muted-foreground">7 días consecutivos</p>
        </div>
      </div>

      <div className="flex justify-between gap-2">
        {weekDays.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                completedDays[index]
                  ? "bg-accent text-accent-foreground"
                  : "border-2 border-dashed border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {day}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground leading-relaxed">
        Completa una lección hoy para mantener tu racha
      </p>
    </Card>
  )
}
