"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, Brain, CheckCircle2, Loader2 } from "lucide-react"
import { userAPI } from "@/lib/api"

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
  { question: "How do you say 'Hello' in English?", options: ["Hello", "Goodbye", "Thank you", "Please"], correct: 0 },
  { question: "What is the past tense of 'go'?", options: ["goed", "went", "gone", "going"], correct: 1 },
  { question: "Complete: 'I ___ to the store yesterday'", options: ["go", "goes", "went", "going"], correct: 2 },
  { question: "Which sentence is correct?", options: ["She don't like pizza", "She doesn't likes pizza", "She doesn't like pizza", "She not like pizza"], correct: 2 },
  { question: "What does 'although' mean?", options: ["because", "but/however", "therefore", "also"], correct: 1 },
  { question: "Choose the correct form: 'If I ___ rich, I would travel the world'", options: ["am", "was", "were", "be"], correct: 2 },
  { question: "What is a synonym for 'ubiquitous'?", options: ["rare", "everywhere", "beautiful", "difficult"], correct: 1 },
  { question: "Complete the idiom: 'It's raining cats and ___'", options: ["dogs", "birds", "fish", "mice"], correct: 0 },
  { question: "Which is the correct passive form: 'They built the house in 1990'", options: ["The house built in 1990", "The house was built in 1990", "The house is built in 1990", "The house has built in 1990"], correct: 1 },
  { question: "What does 'serendipity' mean?", options: ["A happy accident", "A sad moment", "A difficult situation", "A planned event"], correct: 0 },
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

  useEffect(() => {
    const storedIdioma = localStorage.getItem("idioma")
    if (storedIdioma) setIdioma(storedIdioma)
  }, [])

  const handleStartEvaluation = () => {
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

  const updateLevel = async (nivel: string) => {
    setIsLoading(true)
    const correo = localStorage.getItem("correo")

    if (!correo) {
      toast({
        title: "Error",
        description: "No se encontró el correo del usuario.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // ✅ Usar userAPI en lugar de fetch directo
      await userAPI.updateNivel(correo, nivel)

      toast({
        title: "Nivel asignado exitosamente",
        description: `Tu nivel es ${nivel}. Por favor inicia sesión para continuar.`,
      })

      // Limpiar localStorage
      localStorage.removeItem("correo")
      localStorage.removeItem("idioma")

      // Redirigir a login
      router.push("/login")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al actualizar nivel",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmLevel = () => updateLevel(selectedLevel)
  const handleConfirmEvaluationLevel = () => updateLevel(calculatedLevel)

  // ----- PANTALLAS -----
  if (step === "choice") {
    return (
      <Card className="p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Asigna tu Nivel</h1>
          <p className="mt-2 text-muted-foreground">
            Elige cómo quieres determinar tu nivel {idioma ? `de ${idioma}` : ""}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={handleStartEvaluation}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-6 hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Realizar Evaluación</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Responde 10 preguntas para determinar tu nivel
              </p>
            </div>
          </button>

          <button
            onClick={handleManualSelection}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-6 hover:border-secondary hover:bg-secondary/5"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Seleccionar Nivel</h3>
              <p className="mt-1 text-sm text-muted-foreground">
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
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">
              Pregunta {currentQuestion + 1} de {EVALUATION_QUESTIONS.length}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <h2 className="mb-6 text-2xl font-bold">{question.question}</h2>

        <div className="grid gap-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className="rounded-xl border-2 border-border bg-card p-4 text-left hover:border-primary hover:bg-primary/5"
            >
              {option}
            </button>
          ))}
        </div>
      </Card>
    )
  }

  if (step === "results") {
    const correctAnswers = answers.filter(
      (a, i) => a === EVALUATION_QUESTIONS[i].correct
    ).length
    const percentage = Math.round((correctAnswers / EVALUATION_QUESTIONS.length) * 100)
    const levelInfo = LEVELS.find((l) => l.id === calculatedLevel)

    return (
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Evaluación Completada</h1>
        <p className="text-muted-foreground mb-4">
          Has respondido correctamente {correctAnswers} de {EVALUATION_QUESTIONS.length} preguntas
        </p>

        <div className="mb-6 rounded-xl bg-primary/10 p-6">
          <p className="text-sm font-medium text-primary">Tu nivel recomendado es</p>
          <h2 className="mt-2 text-4xl font-bold text-primary">{levelInfo?.id}</h2>
          <p className="text-lg font-medium">{levelInfo?.name}</p>
          <p className="text-sm text-muted-foreground mt-1">{levelInfo?.description}</p>
          <div className="mt-4">
            <div className="text-2xl font-bold">{percentage}%</div>
            <div className="text-sm text-muted-foreground">Precisión</div>
          </div>
        </div>

        <Button onClick={handleConfirmEvaluationLevel} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Asignando nivel...
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
        <h1 className="text-2xl font-bold text-center mb-4">Selecciona tu Nivel</h1>
        <div className="grid gap-3 mb-6">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => handleLevelSelect(level.id)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                selectedLevel === level.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-bold mr-2">{level.id}</span>
                  <span className="font-semibold">{level.name}</span>
                  <p className="text-sm text-muted-foreground mt-1">{level.description}</p>
                </div>
                {selectedLevel === level.id && (
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleConfirmLevel}
          className="w-full"
          disabled={!selectedLevel || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Asignando nivel...
            </>
          ) : (
            "Confirmar Nivel"
          )}
        </Button>

        <div className="mt-4 text-center">
          <button
            onClick={() => setStep("choice")}
            className="text-sm text-primary hover:underline"
          >
            Volver atrás
          </button>
        </div>
      </Card>
    )
  }

  return null
}