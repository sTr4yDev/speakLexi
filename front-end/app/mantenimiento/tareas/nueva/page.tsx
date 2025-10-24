import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CreateTaskForm } from "@/components/maintenance/create-task-form"

export default function NewTaskPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Programar Nueva Tarea</h1>
          <p className="mt-1 text-muted-foreground">Crea una nueva tarea de mantenimiento programada</p>
        </div>

        <CreateTaskForm />
      </main>
    </div>
  )
}
