import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AchievementsList } from "@/components/gamification/achievements-list"
import { LevelProgress } from "@/components/gamification/level-progress"
import { RewardsInventory } from "@/components/gamification/rewards-inventory"

export default function AchievementsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Logros y Recompensas</h1>
          <p className="mt-1 text-muted-foreground">Desbloquea insignias y sube de nivel</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <AchievementsList />
          </div>

          <div className="space-y-6">
            <LevelProgress />
            <RewardsInventory />
          </div>
        </div>
      </main>
    </div>
  )
}
