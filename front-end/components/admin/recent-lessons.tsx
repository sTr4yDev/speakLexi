import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, Eye, Trash2 } from "lucide-react"

export function RecentLessons() {
  const lessons = [
    {
      id: 1,
      title: "Greetings and Introductions",
      level: "A1",
      language: "English",
      activities: 4,
      status: "published",
      lastModified: "Hace 2 días",
    },
    {
      id: 2,
      title: "Numbers 1-20",
      level: "A1",
      language: "English",
      activities: 5,
      status: "published",
      lastModified: "Hace 3 días",
    },
    {
      id: 3,
      title: "Colors and Shapes",
      level: "A1",
      language: "English",
      activities: 6,
      status: "draft",
      lastModified: "Hace 1 hora",
    },
  ]

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Lecciones Recientes</h2>
        <Link href="/admin/lecciones/crear">
          <Button>Crear Lección</Button>
        </Link>
      </div>

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
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{lesson.lastModified}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
