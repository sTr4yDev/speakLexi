import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ImageIcon, Music, Video } from "lucide-react"

export function MediaLibraryPreview() {
  const mediaStats = [
    { type: "Imágenes", count: 156, icon: ImageIcon, color: "text-primary" },
    { type: "Audio", count: 89, icon: Music, color: "text-secondary" },
    { type: "Videos", count: 97, icon: Video, color: "text-accent" },
  ]

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold">Biblioteca Multimedia</h3>
        <Link href="/admin/multimedia" className="text-sm text-primary hover:underline">
          Ver Todo
        </Link>
      </div>

      <div className="space-y-3">
        {mediaStats.map((stat, index) => {
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
      </div>
    </Card>
  )
}
