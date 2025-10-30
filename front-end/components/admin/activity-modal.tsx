"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MultipleChoiceForm } from "./activity-forms/multiple-choice-form"
import { FillBlankForm } from "./activity-forms/fill-blank-form"
import { MatchingForm } from "./activity-forms/matching-form"
import { TranslationForm } from "./activity-forms/translation-form"
import { TrueFalseForm } from "./activity-forms/true-false-form"
import { WordOrderForm } from "./activity-forms/word-order-form"
// ✅ IMPORTAR EL TIPO CORRECTO desde la API
import { type Actividad } from "@/lib/api"

// ✅ ELIMINAR la interfaz Actividad local duplicada
// interface Actividad {
//   tipo: string
//   pregunta: string
//   instrucciones?: string
//   opciones?: any
//   respuesta_correcta: any
//   retroalimentacion?: any
//   pista?: string
//   puntos: number
//   orden: number
//   multimedia_id?: number
// }

interface ActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoActividad: Actividad['tipo'] | null // ✅ Usar el tipo correcto
  onGuardar: (actividad: Actividad) => void // ✅ Usar el tipo correcto
  actividadEditar?: Actividad | null // ✅ Usar el tipo correcto
}

const TITULOS_ACTIVIDAD: Record<Actividad['tipo'], string> = {
  multiple_choice: "🎯 Opción Múltiple",
  fill_blank: "✏️ Completar Espacios",
  matching: "🔗 Emparejar",
  translation: "🌐 Traducción",
  listen_repeat: "🎤 Escuchar y Repetir",
  true_false: "✓✗ Verdadero/Falso",
  word_order: "📝 Ordenar Palabras"
}

export function ActivityModal({ 
  open, 
  onOpenChange, 
  tipoActividad, 
  onGuardar,
  actividadEditar 
}: ActivityModalProps) {
  
  if (!tipoActividad) return null

  const renderForm = () => {
    const props = {
      onGuardar,
      onCancelar: () => onOpenChange(false),
      actividadEditar
    }

    switch (tipoActividad) {
      case 'multiple_choice':
        return <MultipleChoiceForm {...props} />
      case 'fill_blank':
        return <FillBlankForm {...props} />
      case 'matching':
        return <MatchingForm {...props} />
      case 'translation':
        return <TranslationForm {...props} />
      case 'true_false':
        return <TrueFalseForm {...props} />
      case 'word_order':
        return <WordOrderForm {...props} />
      case 'listen_repeat':
        // Por ahora, placeholder hasta que implementes multimedia
        return (
          <div className="p-8 text-center text-muted-foreground">
            <p className="mb-4">🎤 Actividad de Escuchar y Repetir</p>
            <p className="text-sm">Esta actividad requiere funcionalidad de audio.</p>
            <p className="text-sm">Se implementará cuando esté lista la biblioteca multimedia.</p>
          </div>
        )
      default:
        // ✅ TypeScript ahora sabe que tipoActividad es uno de los valores válidos
        // pero por seguridad retornamos null para casos inesperados
        const _exhaustiveCheck: never = tipoActividad
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {actividadEditar ? "Editar" : "Crear"} Actividad: {TITULOS_ACTIVIDAD[tipoActividad]}
          </DialogTitle>
          <DialogDescription>
            Completa todos los campos para crear una actividad interactiva
          </DialogDescription>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  )
}