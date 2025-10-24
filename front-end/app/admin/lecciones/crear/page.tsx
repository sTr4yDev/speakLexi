import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CreateLessonForm } from "@/components/admin/create-lesson-form"

export default function CreateLessonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Crear Nueva Lección</h1>
          <p className="mt-1 text-muted-foreground">Completa los pasos para crear una lección</p>
        </div>

        <CreateLessonForm />
      </main>
    </div>
  )
}
