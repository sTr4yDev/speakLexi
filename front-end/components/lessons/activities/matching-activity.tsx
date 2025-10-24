"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Shuffle } from "lucide-react"

interface MatchingPair {
  id: string
  left: string
  right: string
}

interface MatchingActivityProps {
  pairs: MatchingPair[]
  onComplete: (correct: boolean) => void
}

export function MatchingActivity({ pairs, onComplete }: MatchingActivityProps) {
  const [leftSelected, setLeftSelected] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<Record<string, boolean>>({})
  const [shuffledRight, setShuffledRight] = useState(() =>
    [...pairs].map((p) => ({ id: p.id, text: p.right })).sort(() => Math.random() - 0.5),
  )

  const handleLeftClick = (id: string) => {
    if (feedback[id] !== undefined) return
    setLeftSelected(id)
  }

  const handleRightClick = (rightId: string) => {
    if (!leftSelected || feedback[leftSelected] !== undefined) return

    const newMatches = { ...matches, [leftSelected]: rightId }
    setMatches(newMatches)

    const isCorrect = leftSelected === rightId
    setFeedback({ ...feedback, [leftSelected]: isCorrect })
    setLeftSelected(null)

    if (Object.keys(newMatches).length === pairs.length) {
      const allCorrect = Object.entries(newMatches).every(([left, right]) => left === right)
      setTimeout(() => onComplete(allCorrect), 1000)
    }
  }

  const handleShuffle = () => {
    setShuffledRight([...shuffledRight].sort(() => Math.random() - 0.5))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Empareja los elementos de ambas columnas</p>
        <Button variant="outline" size="sm" onClick={handleShuffle} disabled={Object.keys(matches).length > 0}>
          <Shuffle className="mr-2 h-4 w-4" />
          Mezclar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-2">
          {pairs.map((pair) => (
            <Card
              key={pair.id}
              className={`cursor-pointer p-4 transition-all ${
                leftSelected === pair.id
                  ? "border-primary bg-primary/10"
                  : feedback[pair.id] === true
                    ? "border-green-500 bg-green-50"
                    : feedback[pair.id] === false
                      ? "border-red-500 bg-red-50"
                      : "hover:border-primary/50"
              } ${feedback[pair.id] !== undefined ? "cursor-not-allowed opacity-60" : ""}`}
              onClick={() => handleLeftClick(pair.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{pair.left}</span>
                {feedback[pair.id] === true && <Check className="h-5 w-5 text-green-600" />}
                {feedback[pair.id] === false && <X className="h-5 w-5 text-red-600" />}
              </div>
            </Card>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          {shuffledRight.map((item) => {
            const isMatched = Object.values(matches).includes(item.id)
            const matchedLeft = Object.entries(matches).find(([_, right]) => right === item.id)?.[0]
            const isCorrect = matchedLeft ? feedback[matchedLeft] : undefined

            return (
              <Card
                key={item.id}
                className={`cursor-pointer p-4 transition-all ${
                  isMatched
                    ? isCorrect === true
                      ? "border-green-500 bg-green-50"
                      : isCorrect === false
                        ? "border-red-500 bg-red-50"
                        : "border-primary bg-primary/10"
                    : "hover:border-primary/50"
                } ${isMatched ? "cursor-not-allowed opacity-60" : ""}`}
                onClick={() => !isMatched && handleRightClick(item.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.text}</span>
                  {isCorrect === true && <Check className="h-5 w-5 text-green-600" />}
                  {isCorrect === false && <X className="h-5 w-5 text-red-600" />}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted p-3">
        <span className="text-sm font-medium">
          Emparejados: {Object.keys(matches).length} / {pairs.length}
        </span>
        {Object.keys(feedback).length > 0 && (
          <Badge variant={Object.values(feedback).every((v) => v) ? "default" : "secondary"}>
            {Object.values(feedback).filter((v) => v).length} correctos
          </Badge>
        )}
      </div>
    </div>
  )
}
