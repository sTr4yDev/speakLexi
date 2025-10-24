import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AdminStats } from "@/components/admin/admin-stats"
import { RecentLessons } from "@/components/admin/recent-lessons"
import { MediaLibraryPreview } from "@/components/admin/media-library-preview"
import { QuickAdminActions } from "@/components/admin/quick-admin-actions"

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Panel de Administración</h1>
          <p className="mt-1 text-muted-foreground">Gestiona el contenido de la plataforma</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <AdminStats />
            <RecentLessons />
          </div>

          <div className="space-y-6">
            <QuickAdminActions />
            <MediaLibraryPreview />
          </div>
        </div>
      </main>
    </div>
  )
}
