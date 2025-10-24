import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProfileSettings } from "@/components/profile/profile-settings"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Mi Perfil</h1>
          <p className="mt-1 text-muted-foreground">Gestiona tu información personal y preferencias</p>
        </div>

        <ProfileSettings />
      </main>
    </div>
  )
}
