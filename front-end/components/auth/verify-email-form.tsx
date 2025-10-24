"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function VerifyEmailForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [email, setEmail] = useState("")

  // Recuperamos el correo que se guardó al registrarse
  useEffect(() => {
    const storedEmail = localStorage.getItem("correo")
    if (storedEmail) {
      setEmail(storedEmail)
    } else {
      toast({
        title: "Error",
        description: "No se encontró el correo del usuario. Regístrate nuevamente.",
        variant: "destructive",
      })
      router.push("/registro")
    }
  }, [router, toast])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const verificationCode = code.join("")

    if (verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Por favor ingresa el código completo",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("http://localhost:5000/api/auth/verificar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: email,
          codigo: verificationCode,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al verificar el correo")

      toast({
        title: "Correo verificado",
        description: "Tu cuenta ha sido activada correctamente",
      })

      // ✅ NO eliminamos el correo aquí, lo necesitamos para asignar nivel
      // El correo se eliminará después de completar la asignación de nivel

      router.push("/asignar-nivel")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      const res = await fetch("http://localhost:5000/api/auth/reenviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al reenviar código")

      toast({
        title: "Código reenviado",
        description: "Revisa tu correo electrónico",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <Input
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-14 w-12 text-center text-lg font-semibold"
              required
            />
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar Email"
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          ¿No recibiste el código?{" "}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {isResending ? "Reenviando..." : "Reenviar código"}
          </button>
        </p>
      </div>
    </div>
  )
}