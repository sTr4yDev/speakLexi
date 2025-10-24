import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RewardsInventory() {
  const rewards = [
    { id: 1, name: "Racha de 7 días", icon: "🔥", rarity: "common" },
    { id: 2, name: "Primera Lección", icon: "🎯", rarity: "common" },
    { id: 3, name: "Guerrero Semanal", icon: "⚔️", rarity: "rare" },
  ]

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold">Recompensas</h3>
        <Badge variant="secondary">{rewards.length}</Badge>
      </div>

      <div className="space-y-2">
        {rewards.map((reward) => (
          <div key={reward.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-xl">
              {reward.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{reward.name}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                {reward.rarity}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
