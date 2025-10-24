"use client"

import {RegisterForm} from "../../components/auth/register-form" // ✅ Import corregido
import { BookOpen } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="h-7 w-7" />
            </div>
            <span className="text-3xl font-bold">SpeakLexi</span>
          </Link>

          {/* Register Card */}
          <div className="rounded-2xl bg-card p-8 shadow-lg">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-balance">Crea tu Cuenta</h1>
              <p className="mt-2 text-muted-foreground">
                Comienza tu viaje de aprendizaje hoy
              </p>
            </div>

            <RegisterForm />

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
              <Link href="/login" className="font-medium text-primary hover:underline">
                Inicia sesión aquí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
