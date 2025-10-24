"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface AbandonLessonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonTitle: string
  progress: number
}

export function AbandonLessonModal({ open, onOpenChange, lessonTitle, progress }: AbandonLessonModalProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const handleAbandon = async () => {
    setIsSaving(true)
    // Simulate saving progress
    await new Promise((resolve) => setTimeout(resolve, 1000))
    router.push("/lecciones")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">¿Abandonar lección?</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Estás a punto de salir de <strong>{lessonTitle}</strong>. Has completado el <strong>{progress}%</strong> de
            la lección.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm">
            <strong>Tu progreso se guardará automáticamente.</strong> Podrás continuar desde donde lo dejaste cuando
            regreses.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Continuar Lección
          </Button>
          <Button variant="destructive" onClick={handleAbandon} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Salir de la Lección"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
