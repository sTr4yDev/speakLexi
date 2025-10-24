"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, Brain, CheckCircle2, Loader2 } from "lucide-react"

type Step = "choice" | "evaluation" | "manual" | "results"

const LEVELS = [
  { id: "A1", name: "Principiante", description: "Empezando desde cero" },
  { id: "A2", name: "Elemental", description: "Conocimientos básicos" },
  { id: "B1", name: "Intermedio", description: "Conversación cotidiana" },
  { id: "B2", name: "Intermedio Alto", description: "Fluidez en la mayoría de situaciones" },
  { id: "C1", name: "Avanzado", description: "Dominio del idioma" },
  { id: "C2", name: "Maestría", description: "Nivel nativo" },
]

const EVALUATION_QUESTIONS = [
  {
    question: "How do you say 'Hello' in English?",
    options: ["Hello", "Goodbye", "Thank you", "Please"],
    correct: 0,
  },
  {
    question: "What is the past tense of 'go'?",
    options: ["goed", "went", "gone", "going"],
    correct: 1,
  },
  {
    question: "Complete: 'I ___ to the store yesterday'",
    options: ["go", "goes", "went", "going"],
    correct: 2,
  },
  {
    question: "Which sentence is correct?",
    options: ["She don't like pizza", "She doesn't likes pizza", "She doesn't like pizza", "She not like pizza"],
    correct: 2,
  },
  {
    question: "What does 'although' mean?",
    options: ["because", "but/however", "therefore", "also"],
    correct: 1,
  },
  {
    question: "Choose the correct form: 'If I ___ rich, I would travel the world'",
    options: ["am", "was", "were", "be"],
    correct: 2,
  },
  {
    question: "What is a synonym for 'ubiquitous'?",
    options: ["rare", "everywhere", "beautiful", "difficult"],
    correct: 1,
  },
  {
    question: "Complete the idiom: 'It's raining cats and ___'",
    options: ["dogs", "birds", "fish", "mice"],
    correct: 0,
  },
  {
    question: "Which is the correct passive form: 'They built the house in 1990'",
    options: [
      "The house built in 1990",
      "The house was built in 1990",
      "The house is built in 1990",
      "The house has built in 1990",
    ],
    correct: 1,
  },
  {
    question: "What does 'serendipity' mean?",
    options: ["A happy accident", "A sad moment", "A difficult situation", "A planned event"],
    correct: 0,
  },
]

export function LevelAssignmentFlow() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>("choice")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [calculatedLevel, setCalculatedLevel] = useState<string>("")
  const [idioma, setIdioma] = useState<string>("")

  // 🔹 Obtenemos el idioma del registro
  useEffect(() => {
    const storedIdioma = localStorage.getItem("idioma")
    if (storedIdioma) setIdioma(storedIdioma)
  }, [])

  const handleStartEvaluation = () => {
    // Verificar si el idioma es inglés
    if (idioma.toLowerCase() !== "inglés") {
      toast({
        title: "Curso en desarrollo",
        description: `El test para ${idioma} estará disponible próximamente.`,
      })
      return
    }
    setStep("evaluation")
  }

  const handleManualSelection = () => setStep("manual")

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex]
    setAnswers(newAnswers)

    if (currentQuestion < EVALUATION_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      const correctAnswers = newAnswers.filter(
        (answer, index) => answer === EVALUATION_QUESTIONS[index].correct
      ).length
      const percentage = (correctAnswers / EVALUATION_QUESTIONS.length) * 100

      let level = "A1"
      if (percentage >= 90) level = "C2"
      else if (percentage >= 75) level = "C1"
      else if (percentage >= 60) level = "B2"
      else if (percentage >= 45) level = "B1"
      else if (percentage >= 30) level = "A2"

      setCalculatedLevel(level)
      setStep("results")
    }
  }

  const handleLevelSelect = (levelId: string) => setSelectedLevel(levelId)

  const handleConfirmLevel = async () => {
    setIsLoading(true)
    const correo = localStorage.getItem("correo")

    // Validación de seguridad
    if (!correo) {
      toast({
        title: "Error",
        description: "No se encontró el correo del usuario. Por favor inicia sesión o regístrate nuevamente.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("http://localhost:5000/api/usuario/actualizar-nivel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, nivel: selectedLevel }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Error al actualizar nivel")

      toast({
        title: "Nivel asignado exitosamente",
        description: `Tu nivel es ${selectedLevel}`,
      })

      // ✅ Limpiamos el localStorage después de completar el registro
      localStorage.removeItem("correo")
      localStorage.removeItem("idioma")

      router.push("/dashboard")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmEvaluationLevel = async () => {
    setIsLoading(true)
    const correo = localStorage.getItem("correo")

    if (!correo) {
      toast({
        title: "Error",
        description: "No se encontró el correo del usuario. Por favor inicia sesión o regístrate nuevamente.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("http://localhost:5000/api/usuario/actualizar-nivel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, nivel: calculatedLevel }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Error al actualizar nivel")

      toast({
        title: "Nivel actualizado",
        description: `Tu nuevo nivel es ${calculatedLevel}`,
      })

      // ✅ Limpiamos el localStorage después de completar el registro
      localStorage.removeItem("correo")
      localStorage.removeItem("idioma")

      router.push("/dashboard")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ----- Pantallas -----

  if (step === "choice") {
    return (
      <Card className="p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-balance">Asigna tu Nivel</h1>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Elige cómo quieres determinar tu nivel {idioma ? `de ${idioma}` : ""}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={handleStartEvaluation}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-6 text-center transition-all hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Realizar Evaluación</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Responde 10 preguntas para determinar tu nivel
              </p>
            </div>
          </button>

          <button
            onClick={handleManualSelection}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-6 text-center transition-all hover:border-secondary hover:bg-secondary/5"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Seleccionar Nivel</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Ya conozco mi nivel y quiero elegirlo manualmente
              </p>
            </div>
          </button>
        </div>
      </Card>
    )
  }

  if (step === "evaluation") {
    const question = EVALUATION_QUESTIONS[currentQuestion]
    const progress = ((currentQuestion + 1) / EVALUATION_QUESTIONS.length) * 100

    return (
      <Card className="p-8">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Pregunta {currentQuestion + 1} de {EVALUATION_QUESTIONS.length}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-balance">{question.question}</h2>
        </div>

        <div className="grid gap-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className="rounded-xl border-2 border-border bg-card p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
            >
              <span className="font-medium">{option}</span>
            </button>
          ))}
        </div>
      </Card>
    )
  }

  if (step === "results") {
    const correctAnswers = answers.filter(
      (answer, index) => answer === EVALUATION_QUESTIONS[index].correct
    ).length
    const percentage = Math.round((correctAnswers / EVALUATION_QUESTIONS.length) * 100)
    const levelInfo = LEVELS.find((l) => l.id === calculatedLevel)

    return (
      <Card className="p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-balance">Evaluación Completada</h1>
          <p className="mt-2 text-muted-foreground">
            Has respondido correctamente {correctAnswers} de {EVALUATION_QUESTIONS.length} preguntas
          </p>
        </div>

        <div className="mb-6 rounded-xl bg-primary/10 p-6 text-center">
          <p className="text-sm font-medium text-primary">Tu nivel recomendado es</p>
          <h2 className="mt-2 text-4xl font-bold text-primary">{levelInfo?.id}</h2>
          <p className="mt-1 text-lg font-medium">{levelInfo?.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">{levelInfo?.description}</p>
          <div className="mt-4">
            <div className="text-2xl font-bold">{percentage}%</div>
            <div className="text-sm text-muted-foreground">Precisión</div>
          </div>
        </div>

        <Button onClick={handleConfirmEvaluationLevel} className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Confirmar y Continuar"
          )}
        </Button>
      </Card>
    )
  }

  if (step === "manual") {
    return (
      <Card className="p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-balance">Selecciona tu Nivel</h1>
          <p className="mt-2 text-muted-foreground">
            Elige el nivel que mejor describa tus habilidades actuales
          </p>
        </div>

        <div className="mb-6 grid gap-3">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => handleLevelSelect(level.id)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                selectedLevel === level.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{level.id}</span>
                    <span className="font-semibold">{level.name}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{level.description}</p>
                </div>
                {selectedLevel === level.id && <CheckCircle2 className="h-6 w-6 text-primary" />}
              </div>
            </button>
          ))}
        </div>

        <Button onClick={handleConfirmLevel} className="w-full" disabled={!selectedLevel || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Confirmar Nivel"
          )}
        </Button>

        <div className="mt-4 text-center">
          <button onClick={() => setStep("choice")} className="text-sm text-primary hover:underline">
            Volver atrás
          </button>
        </div>
      </Card>
    )
  }

  return null
}