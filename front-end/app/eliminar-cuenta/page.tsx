"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, Loader2 } from "lucide-react"

export default function EliminarCuentaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")

  const handleStep1Continue = () => {
    setStep(2)
  }

  const handleStep2Continue = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu contraseña",
        variant: "destructive",
      })
      return
    }
    setStep(3)
  }

  const handleFinalDelete = (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmText !== "ELIMINAR") {
      toast({
        title: "Error",
        description: 'Debes escribir exactamente "ELIMINAR" para continuar',
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      localStorage.clear()
      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada permanentemente",
      })
      router.push("/")
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-destructive">Eliminar Cuenta</h1>
          <p className="text-muted-foreground">Esta acción es permanente e irreversible</p>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Paso {step} de 3
            </CardTitle>
            <CardDescription>
              {step === 1 && "Lee cuidadosamente las consecuencias"}
              {step === 2 && "Confirma tu identidad"}
              {step === 3 && "Confirmación final"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Advertencia:</strong> Esta acción no se puede deshacer
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold">Al eliminar tu cuenta perderás:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>Todo tu progreso de aprendizaje y estadísticas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>Todos tus logros, insignias y recompensas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>Tu posición en la tabla de clasificación</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>Acceso a todos los cursos en los que estás inscrito</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>Tu información personal y preferencias</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => router.back()} className="flex-1">
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleStep1Continue} className="flex-1">
                    Entiendo, continuar
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2Continue} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password">Confirma tu contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">Necesitamos verificar tu identidad antes de continuar</p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Atrás
                  </Button>
                  <Button type="submit" variant="destructive" className="flex-1">
                    Verificar
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleFinalDelete} className="space-y-6">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Última advertencia:</strong> Esta es tu última oportunidad para cancelar
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="confirm">
                    Escribe <strong>ELIMINAR</strong> para confirmar
                  </Label>
                  <Input
                    id="confirm"
                    type="text"
                    placeholder="ELIMINAR"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">Debes escribir exactamente "ELIMINAR" en mayúsculas</p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    className="flex-1"
                    disabled={isLoading || confirmText !== "ELIMINAR"}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar mi cuenta permanentemente"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
