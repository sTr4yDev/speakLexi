import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { LessonList } from "@/components/lessons/lesson-list"
import { LessonFilters } from "@/components/lessons/lesson-filters"

export default function LessonsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Lecciones</h1>
          <p className="mt-1 text-muted-foreground">Explora y completa lecciones para mejorar tu nivel</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <LessonFilters />
          </aside>

          <div className="lg:col-span-3">
            <LessonList />
          </div>
        </div>
      </main>
    </div>
  )
}
