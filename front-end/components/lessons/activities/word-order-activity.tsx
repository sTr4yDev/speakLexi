"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, RotateCcw } from "lucide-react"

interface WordOrderActivityProps {
  instruction: string
  words: string[]
  correctOrder: string[]
  onComplete: (correct: boolean) => void
}

export function WordOrderActivity({ instruction, words, correctOrder, onComplete }: WordOrderActivityProps) {
  const [availableWords, setAvailableWords] = useState<string[]>(words)
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleWordClick = (word: string, fromAvailable: boolean) => {
    if (showFeedback) return

    if (fromAvailable) {
      setAvailableWords(availableWords.filter((w) => w !== word))
      setSelectedWords([...selectedWords, word])
    } else {
      setSelectedWords(selectedWords.filter((w) => w !== word))
      setAvailableWords([...availableWords, word])
    }
  }

  const handleCheck = () => {
    const correct = JSON.stringify(selectedWords) === JSON.stringify(correctOrder)
    setIsCorrect(correct)
    setShowFeedback(true)
    setTimeout(() => {
      onComplete(correct)
    }, 2000)
  }

  const handleReset = () => {
    setAvailableWords(words)
    setSelectedWords([])
    setShowFeedback(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Ordena las Palabras</h3>
        <p className="text-lg text-muted-foreground">{instruction}</p>
      </div>

      {/* Selected Words Area */}
      <Card className="min-h-[120px]">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-3">Tu respuesta:</p>
          <div className="flex flex-wrap gap-2 min-h-[60px]">
            {selectedWords.length === 0 ? (
              <p className="text-muted-foreground italic">Selecciona las palabras en orden...</p>
            ) : (
              selectedWords.map((word, index) => (
                <Button
                  key={`${word}-${index}`}
                  variant="default"
                  onClick={() => handleWordClick(word, false)}
                  disabled={showFeedback}
                  className="h-12 text-lg"
                >
                  {word}
                </Button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Words */}
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-3">Palabras disponibles:</p>
          <div className="flex flex-wrap gap-2">
            {availableWords.map((word, index) => (
              <Button
                key={`${word}-${index}`}
                variant="outline"
                onClick={() => handleWordClick(word, true)}
                disabled={showFeedback}
                className="h-12 text-lg"
              >
                {word}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={handleReset} disabled={showFeedback || selectedWords.length === 0}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reiniciar
        </Button>
        <Button
          onClick={handleCheck}
          disabled={showFeedback || selectedWords.length !== correctOrder.length}
          className="min-w-[120px]"
        >
          Verificar
        </Button>
      </div>

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
                <p className="font-semibold mb-1">{isCorrect ? "¡Correcto!" : "Incorrecto"}</p>
                {!isCorrect && (
                  <p className="text-sm text-muted-foreground">Orden correcto: {correctOrder.join(" ")}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
