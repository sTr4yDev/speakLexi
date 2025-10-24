import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProgressOverview } from "@/components/dashboard/progress-overview"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { StreakCard } from "@/components/dashboard/streak-card"
import { RecentLessons } from "@/components/dashboard/recent-lessons"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Bienvenido de Nuevo, Juan</h1>
          <p className="mt-1 text-muted-foreground">Continua tu viaje de aprendizaje</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <ProgressOverview />
            <RecentLessons />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StreakCard />
            <QuickActions />
          </div>
        </div>
      </main>
    </div>
  )
}
