import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Check, Lock, ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CambiarCursoPage() {
  const availableCourses = [
    {
      id: 1,
      name: "Inglés Básico",
      description: "Aprende los fundamentos del inglés desde cero",
      level: "A1-A2",
      lessons: 45,
      duration: "3 meses",
      enrolled: true,
      progress: 75,
    },
    {
      id: 2,
      name: "Inglés Intermedio",
      description: "Mejora tu fluidez y comprensión del inglés",
      level: "B1-B2",
      lessons: 60,
      duration: "4 meses",
      enrolled: true,
      progress: 30,
    },
    {
      id: 3,
      name: "Inglés Avanzado",
      description: "Domina el inglés con contenido avanzado",
      level: "C1-C2",
      lessons: 50,
      duration: "4 meses",
      enrolled: false,
      locked: true,
    },
    {
      id: 4,
      name: "Francés Básico",
      description: "Comienza tu viaje en el idioma francés",
      level: "A1-A2",
      lessons: 40,
      duration: "3 meses",
      enrolled: false,
      locked: false,
    },
    {
      id: 5,
      name: "Alemán Básico",
      description: "Aprende alemán desde el principio",
      level: "A1-A2",
      lessons: 42,
      duration: "3 meses",
      enrolled: false,
      locked: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/perfil">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Mi Perfil
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Cambiar Curso</h1>
          <p className="text-muted-foreground">Explora y cambia entre los cursos disponibles</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableCourses.map((course) => (
            <Card key={course.id} className={course.enrolled ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  {course.enrolled && (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" />
                      Inscrito
                    </Badge>
                  )}
                  {course.locked && (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Bloqueado
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{course.name}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Nivel</span>
                  <Badge variant="outline">{course.level}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lecciones</span>
                  <span className="font-medium">{course.lessons}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duración</span>
                  <span className="font-medium">{course.duration}</span>
                </div>

                {course.enrolled && course.progress && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                )}

                <Button className="w-full" variant={course.enrolled ? "outline" : "default"} disabled={course.locked}>
                  {course.locked ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Completa el nivel anterior
                    </>
                  ) : course.enrolled ? (
                    "Continuar Curso"
                  ) : (
                    <>
                      Inscribirse
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
