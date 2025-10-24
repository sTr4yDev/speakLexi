import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Eye, Trash2 } from "lucide-react"
import Link from "next/link"

export default function AdminLessonsPage() {
  const lessons = [
    {
      id: 1,
      title: "Greetings and Introductions",
      level: "A1",
      language: "English",
      activities: 4,
      status: "published",
      views: 245,
    },
    {
      id: 2,
      title: "Numbers 1-20",
      level: "A1",
      language: "English",
      activities: 5,
      status: "published",
      views: 198,
    },
    {
      id: 3,
      title: "Colors and Shapes",
      level: "A1",
      language: "English",
      activities: 6,
      status: "draft",
      views: 0,
    },
    {
      id: 4,
      title: "Family Members",
      level: "A1",
      language: "English",
      activities: 7,
      status: "published",
      views: 156,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Gestión de Lecciones</h1>
            <p className="mt-1 text-muted-foreground">Crea y administra el contenido educativo</p>
          </div>
          <Link href="/admin/lecciones/crear">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Lección
            </Button>
          </Link>
        </div>

        <Card className="mb-6 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar lecciones..." className="pl-10" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="rounded-xl border-2 border-border bg-card p-4 transition-all hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <Badge variant={lesson.status === "published" ? "default" : "secondary"}>
                        {lesson.status === "published" ? "Publicada" : "Borrador"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Nivel {lesson.level}</span>
                      <span>•</span>
                      <span>{lesson.language}</span>
                      <span>•</span>
                      <span>{lesson.activities} actividades</span>
                      <span>•</span>
                      <span>{lesson.views} vistas</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" title="Vista previa">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/lecciones/${lesson.id}/editar`}>
                      <Button variant="ghost" size="icon" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" title="Eliminar">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
