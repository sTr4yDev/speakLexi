import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { LessonViewer } from "@/components/lessons/lesson-viewer"

export default function LessonPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />
      <LessonViewer lessonId={params.id} />
    </div>
  )
}
