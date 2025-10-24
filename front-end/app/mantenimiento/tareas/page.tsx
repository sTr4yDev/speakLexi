import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function TareasPage() {
  const tasks = [
    {
      id: 1,
      title: "Actualización de seguridad del servidor",
      type: "Actualización",
      priority: "alta",
      status: "programada",
      scheduledDate: "2025-01-25",
      scheduledTime: "02:00 AM",
      assignedTo: "Equipo DevOps",
      recurring: false,
    },
    {
      id: 2,
      title: "Respaldo semanal de base de datos",
      type: "Preventivo",
      priority: "media",
      status: "completada",
      scheduledDate: "2025-01-19",
      scheduledTime: "03:00 AM",
      assignedTo: "Sistema Automático",
      recurring: true,
      recurringPattern: "Semanal",
    },
    {
      id: 3,
      title: "Limpieza de archivos temporales",
      type: "Mantenimiento",
      priority: "baja",
      status: "en_progreso",
      scheduledDate: "2025-01-20",
      scheduledTime: "01:00 AM",
      assignedTo: "Sistema Automático",
      recurring: true,
      recurringPattern: "Diario",
    },
    {
      id: 4,
      title: "Revisión de logs de errores",
      type: "Correctivo",
      priority: "alta",
      status: "programada",
      scheduledDate: "2025-01-21",
      scheduledTime: "09:00 AM",
      assignedTo: "Carlos Rodríguez",
      recurring: false,
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "destructive"
      case "media":
        return "default"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completada":
        return "default"
      case "en_progreso":
        return "default"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completada":
        return "Completada"
      case "en_progreso":
        return "En Progreso"
      default:
        return "Programada"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completada":
        return <CheckCircle2 className="h-4 w-4" />
      case "en_progreso":
        return <Clock className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Tareas Programadas</h1>
            <p className="text-muted-foreground">Gestiona el mantenimiento y tareas del sistema</p>
          </div>
          <Button asChild>
            <Link href="/mantenimiento/tareas/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Tarea
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programadas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "programada").length}</div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "en_progreso").length}</div>
              <p className="text-xs text-muted-foreground">Activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "completada").length}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(task.status)}
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                    </div>
                    <CardDescription>Asignado a: {task.assignedTo}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getPriorityColor(task.priority) as any}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                    <Badge variant={getStatusColor(task.status) as any}>{getStatusLabel(task.status)}</Badge>
                    {task.recurring && <Badge variant="outline">{task.recurringPattern}</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {task.scheduledDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {task.scheduledTime}
                    </span>
                    <span>
                      Tipo: <strong>{task.type}</strong>
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
