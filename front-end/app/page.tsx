import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Trophy, Users, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-balance">SpeakLexi</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/registro">
              <Button>Comenzar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold leading-tight text-balance md:text-6xl">
            Aprende Idiomas de Forma{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Divertida</span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground text-pretty leading-relaxed">
            Domina nuevos idiomas con lecciones gamificadas, desafíos interactivos y un sistema de recompensas que te
            mantiene motivado cada día.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/registro">
              <Button size="lg" className="w-full sm:w-auto">
                Empezar Ahora
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Ya Tengo Cuenta
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="font-semibold">Lecciones Interactivas</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aprende con actividades dinámicas y contenido multimedia
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Trophy className="h-7 w-7" />
            </div>
            <h3 className="font-semibold">Sistema de Logros</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gana insignias y recompensas por tu progreso
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="font-semibold">Tabla de Clasificación</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Compite con otros estudiantes y sube de nivel
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Zap className="h-7 w-7" />
            </div>
            <h3 className="font-semibold">Progreso Rápido</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Avanza a tu ritmo con lecciones adaptadas a tu nivel
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
