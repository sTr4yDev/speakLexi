import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function EditLessonPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/lecciones">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Lecciones
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Editar Lección</h1>
          <p className="mt-1 text-muted-foreground">Modifica los detalles de la lección #{params.id}</p>
        </div>

        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Información de la Lección</CardTitle>
            <CardDescription>Actualiza los campos que desees modificar</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título de la Lección</Label>
              <Input id="title" defaultValue="Introducción a los Verbos" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="course">Curso</Label>
                <Select defaultValue="english-beginner">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english-beginner">Inglés Principiante</SelectItem>
                    <SelectItem value="english-intermediate">Inglés Intermedio</SelectItem>
                    <SelectItem value="english-advanced">Inglés Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <Select defaultValue="A1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Principiante</SelectItem>
                    <SelectItem value="A2">A2 - Elemental</SelectItem>
                    <SelectItem value="B1">B1 - Intermedio</SelectItem>
                    <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                    <SelectItem value="C1">C1 - Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                defaultValue="Aprende los conceptos básicos de los verbos en inglés"
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input id="duration" type="number" defaultValue="30" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="xp">XP Otorgados</Label>
                <Input id="xp" type="number" defaultValue="50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select defaultValue="publicada">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="publicada">Publicada</SelectItem>
                  <SelectItem value="archivada">Archivada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/lecciones">Cancelar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
