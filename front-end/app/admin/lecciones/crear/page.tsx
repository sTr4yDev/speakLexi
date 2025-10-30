"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CreateLessonForm } from "@/components/admin/create-lesson-form"

export default function CreateLessonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header con botón de regresar */}
        <div className="mb-6">
          <Link href="/admin/lecciones">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Lecciones
            </Button>
          </Link>
          
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl">✨ Crear Nueva Lección</CardTitle>
              <CardDescription className="text-base">
                Completa los siguientes pasos para crear una lección interactiva y gamificada con multimedia
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Formulario completo de creación */}
        <CreateLessonForm />
      </main>
    </div>
  )
}