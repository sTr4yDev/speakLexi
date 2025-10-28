"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ImageIcon, Music, Video, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { multimediaAPI } from "@/lib/api"

export function MediaLibraryPreview() {
  const [mediaStats, setMediaStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      const stats = await multimediaAPI.estadisticas()
      setMediaStats(stats)
    } catch (error) {
      console.error("Error al cargar estadísticas multimedia:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMediaData = () => {
    if (!mediaStats?.por_tipo) {
      return [
        { type: "Imágenes", count: 0, icon: ImageIcon, color: "text-primary" },
        { type: "Audio", count: 0, icon: Music, color: "text-secondary" },
        { type: "Videos", count: 0, icon: Video, color: "text-accent" },
        { type: "Documentos", count: 0, icon: FileText, color: "text-muted-foreground" },
      ]
    }

    return [
      { 
        type: "Imágenes", 
        count: mediaStats.por_tipo.imagen || 0, 
        icon: ImageIcon, 
        color: "text-primary" 
      },
      { 
        type: "Audio", 
        count: mediaStats.por_tipo.audio || 0, 
        icon: Music, 
        color: "text-secondary" 
      },
      { 
        type: "Videos", 
        count: mediaStats.por_tipo.video || 0, 
        icon: Video, 
        color: "text-accent" 
      },
      { 
        type: "Documentos", 
        count: mediaStats.por_tipo.documento || 0, 
        icon: FileText, 
        color: "text-muted-foreground" 
      },
    ]
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold">Biblioteca Multimedia</h3>
        <Link href="/admin/multimedia" className="text-sm text-primary hover:underline">
          Ver Todo
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Cargando estadísticas...
        </div>
      ) : (
        <div className="space-y-3">
          {getMediaData().map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-background ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{stat.type}</span>
                </div>
                <Badge variant="secondary">{stat.count}</Badge>
              </div>
            )
          })}
          
          {mediaStats && (
            <div className="mt-4 rounded-lg bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">
                Espacio total: <span className="font-semibold">{mediaStats.tamano_total_mb || 0} MB</span>
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}