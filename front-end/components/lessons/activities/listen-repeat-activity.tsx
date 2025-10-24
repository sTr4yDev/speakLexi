"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Volume2, Check, X, Square } from "lucide-react"

interface ListenRepeatActivityProps {
  phrase: string
  audioUrl?: string
  onComplete: (correct: boolean) => void
}

export function ListenRepeatActivity({ phrase, audioUrl, onComplete }: ListenRepeatActivityProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const handlePlayAudio = () => {
    // In a real implementation, this would play the audio file
    const utterance = new SpeechSynthesisUtterance(phrase)
    utterance.lang = "en-US"
    window.speechSynthesis.speak(utterance)
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.start()
      setIsRecording(true)

      mediaRecorder.addEventListener("stop", () => {
        setHasRecorded(true)
        stream.getTracks().forEach((track) => track.stop())
      })
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleCheck = () => {
    // In a real implementation, this would use speech recognition API
    // For now, we'll simulate a random result
    const correct = Math.random() > 0.3
    setIsCorrect(correct)
    setShowFeedback(true)
    setTimeout(() => {
      onComplete(correct)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Escucha y Repite</h3>
        <p className="text-lg text-muted-foreground">Escucha la frase y repítela en voz alta</p>
      </div>

      {/* Phrase Display */}
      <Card className="bg-primary/5">
        <CardContent className="p-8 text-center">
          <p className="text-2xl font-bold mb-4">{phrase}</p>
          <Button onClick={handlePlayAudio} variant="outline" size="lg">
            <Volume2 className="mr-2 h-5 w-5" />
            Escuchar Frase
          </Button>
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              {!isRecording && !hasRecorded && (
                <Button onClick={handleStartRecording} size="lg" className="gap-2">
                  <Mic className="h-5 w-5" />
                  Comenzar Grabación
                </Button>
              )}

              {isRecording && (
                <Button onClick={handleStopRecording} size="lg" variant="destructive" className="gap-2">
                  <Square className="h-5 w-5" />
                  Detener Grabación
                </Button>
              )}

              {hasRecorded && !showFeedback && (
                <div className="flex gap-3">
                  <Button onClick={() => setHasRecorded(false)} variant="outline" size="lg">
                    Grabar de Nuevo
                  </Button>
                  <Button onClick={handleCheck} size="lg">
                    Verificar
                  </Button>
                </div>
              )}
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 text-red-500">
                <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <span className="font-medium">Grabando...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {showFeedback && (
        <Card
          className={
            isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-red-500 bg-red-50 dark:bg-red-950"
          }
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <X className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div>
                <p className="font-semibold mb-1">{isCorrect ? "¡Excelente pronunciación!" : "Intenta de nuevo"}</p>
                <p className="text-sm text-muted-foreground">
                  {isCorrect
                    ? "Tu pronunciación es muy buena. ¡Sigue practicando!"
                    : "Escucha la frase de nuevo y presta atención a la pronunciación."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
