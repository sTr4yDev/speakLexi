"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  Upload, 
  Image, 
  Music, 
  Video, 
  FileText, 
  Trash2, 
  Search,
  Eye,
  Edit,
  Loader2,
  AlertCircle,
  LogIn
} from "lucide-react"
import { multimediaAPI } from "@/lib/api"

interface Multimedia {
  id: number
  nombre_archivo: string
  tipo: string
  url: string
  descripcion?: string
  categoria?: string
  tamano?: number
  creado_en?: string
  actualizado_en?: string
}

export default function MultimediaPage() {
  const router = useRouter()
  const [multimedia, setMultimedia] = useState<Multimedia[]>([])
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Multimedia | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  
  // Form states
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadCategory, setUploadCategory] = useState("general")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState("")

  useEffect(() => {
    verificarAutenticacion()
  }, [])

  const verificarAutenticacion = () => {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    
    if (!token || !userId) {
      console.log('❌ No hay token o userId')
      setAuthError(true)
      setLoading(false)
      toast.error('Por favor inicia sesión para acceder a esta página')
      setTimeout(() => router.push('/login'), 2000)
      return
    }
    
    console.log('✅ Token encontrado, cargando multimedia...')
    cargarMultimedia()
  }

  const cargarMultimedia = async () => {
    try {
      setLoading(true)
      setAuthError(false)
      
      console.log('📡 Llamando a multimediaAPI.listar()...')
      
      const data = await multimediaAPI.listar()
      
      console.log('✅ Respuesta recibida:', data)
      
      // Manejar diferentes estructuras de respuesta
      const items = data.multimedia || data.recursos || data || []
      setMultimedia(Array.isArray(items) ? items : [])
      
      toast.success(`${items.length} archivos cargados`)
      
    } catch (error: any) {
      console.error('❌ Error al cargar multimedia:', error)
      
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        setAuthError(true)
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        toast.error(error.message || 'Error al cargar archivos multimedia')
      }
      
      setMultimedia([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        toast.error(`${file.name} excede el tamaño máximo de 50MB`)
        return false
      }
      return true
    })
    
    setSelectedFiles(validFiles)
    
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} archivo(s) seleccionado(s)`)
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Por favor selecciona archivos para subir")
      return
    }
    
    setUploading(true)
    let successCount = 0
    let errorCount = 0
    
    try {
      for (const file of selectedFiles) {
        try {
          await multimediaAPI.subir(file, {
            descripcion: uploadDescription,
            categoria: uploadCategory,
          })
          successCount++
        } catch (error) {
          errorCount++
          console.error('Error al subir archivo:', error)
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} archivo(s) subido(s) exitosamente`)
        await cargarMultimedia()
        setUploadModalOpen(false)
        setSelectedFiles([])
        setUploadDescription("")
        setUploadCategory("general")
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} archivo(s) no se pudieron subir`)
      }
      
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Error al subir archivos')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (item: Multimedia) => {
    setEditingItem(item)
    setEditDescription(item.descripcion || "")
    setEditCategory(item.categoria || "general")
    setEditModalOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingItem) return
    
    try {
      await multimediaAPI.actualizar(editingItem.id, {
        descripcion: editDescription,
        categoria: editCategory
      })
      
      toast.success('Archivo actualizado exitosamente')
      setEditModalOpen(false)
      await cargarMultimedia()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Error al actualizar archivo')
    }
  }

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}"?`)) return
    
    try {
      await multimediaAPI.eliminar(id, true)
      toast.success('Archivo eliminado exitosamente')
      await cargarMultimedia()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Error al eliminar archivo')
    }
  }

  const getFileIcon = (tipo: string) => {
    if (tipo?.startsWith('image') || tipo === 'imagen') return <Image className="h-5 w-5" />
    if (tipo?.startsWith('audio')) return <Music className="h-5 w-5" />
    if (tipo?.startsWith('video')) return <Video className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const getFileTypeLabel = (tipo: string) => {
    if (tipo?.startsWith('image') || tipo === 'imagen') return 'Imagen'
    if (tipo?.startsWith('audio')) return 'Audio'
    if (tipo?.startsWith('video')) return 'Video'
    if (tipo?.includes('pdf')) return 'PDF'
    return 'Archivo'
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Filtrar multimedia
  const filteredMultimedia = multimedia.filter(item => {
    const matchesSearch = item.nombre_archivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const tipo = item.tipo?.toLowerCase() || ''
    const matchesType = filterType === 'all' || 
                       (filterType === 'image' && (tipo.startsWith('image') || tipo === 'imagen')) ||
                       (filterType === 'audio' && tipo.startsWith('audio')) ||
                       (filterType === 'video' && tipo.startsWith('video')) ||
                       (filterType === 'document' && !tipo.startsWith('image') && !tipo.startsWith('audio') && !tipo.startsWith('video'))
    
    const matchesCategory = filterCategory === 'all' || item.categoria === filterCategory
    
    return matchesSearch && matchesType && matchesCategory
  })

  // Agrupar por tipo
  const groupedMultimedia = filteredMultimedia.reduce((acc, item) => {
    const type = getFileTypeLabel(item.tipo)
    if (!acc[type]) acc[type] = []
    acc[type].push(item)
    return acc
  }, {} as Record<string, Multimedia[]>)

  // Pantalla de error de autenticación
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto p-8 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-6">
              Necesitas iniciar sesión para acceder a esta página
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">📁 Biblioteca Multimedia</h1>
            <p className="mt-1 text-muted-foreground">
              {loading ? "Cargando..." : `${filteredMultimedia.length} archivo(s) encontrado(s)`}
            </p>
          </div>
          
          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Upload className="mr-2 h-4 w-4" />
                Subir Archivos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Subir Archivos Multimedia</DialogTitle>
                <DialogDescription>
                  Selecciona archivos para agregar a la biblioteca
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="files">Archivos</Label>
                  <Input
                    id="files"
                    type="file"
                    multiple
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                  />
                  <p className="text-xs text-muted-foreground">
                    Máximo 50MB por archivo. Formatos: imágenes, audio, video, PDF, documentos
                  </p>
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Archivos seleccionados</Label>
                    <div className="rounded-lg border p-3 space-y-2 max-h-40 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="truncate">{file.name}</span>
                          <span className="text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (Opcional)</Label>
                  <Textarea
                    id="description"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Describe los archivos..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="leccion">Lección</SelectItem>
                      <SelectItem value="ejercicio">Ejercicio</SelectItem>
                      <SelectItem value="recurso">Recurso</SelectItem>
                      <SelectItem value="evaluacion">Evaluación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card className="mb-6 p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar archivos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="image">🖼️ Imágenes</SelectItem>
                <SelectItem value="audio">🎵 Audio</SelectItem>
                <SelectItem value="video">🎬 Video</SelectItem>
                <SelectItem value="document">📄 Documentos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="leccion">Lección</SelectItem>
                <SelectItem value="ejercicio">Ejercicio</SelectItem>
                <SelectItem value="recurso">Recurso</SelectItem>
                <SelectItem value="evaluacion">Evaluación</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Lista de archivos */}
        {loading ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Cargando biblioteca multimedia...</p>
            </div>
          </Card>
        ) : filteredMultimedia.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <Upload className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="mb-2 text-lg font-semibold">No se encontraron archivos</p>
              <p className="mb-4">Comienza subiendo tu primer archivo multimedia</p>
              <Button onClick={() => setUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Subir Archivo
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMultimedia).map(([type, items]) => (
              <Card key={type} className="overflow-hidden">
                <div className="border-b bg-muted/50 p-4">
                  <h2 className="text-lg font-semibold">
                    {type} ({items.length})
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        {/* Preview */}
                        {(item.tipo?.startsWith('image') || item.tipo === 'imagen') && (
                          <div className="aspect-video bg-muted relative">
                            <img 
                              src={item.url} 
                              alt={item.nombre_archivo}
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.png'
                              }}
                            />
                          </div>
                        )}
                        
                        {!(item.tipo?.startsWith('image') || item.tipo === 'imagen') && (
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            <div className="text-center">
                              {getFileIcon(item.tipo)}
                              <p className="mt-2 text-xs text-muted-foreground">
                                {getFileTypeLabel(item.tipo)}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <CardContent className="p-4">
                          <h3 className="font-medium text-sm mb-1 truncate">
                            {item.nombre_archivo}
                          </h3>
                          
                          {item.descripcion && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {item.descripcion}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="text-xs">
                              {item.categoria || 'general'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(item.creado_en)}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1"
                            >
                              <Button variant="outline" size="sm" className="w-full">
                                <Eye className="mr-1 h-3 w-3" />
                                Ver
                              </Button>
                            </a>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.nombre_archivo)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal de edición */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Archivo</DialogTitle>
            <DialogDescription>
              Actualiza la información del archivo
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Archivo</Label>
                <div className="flex items-center gap-2 p-2 border rounded">
                  {getFileIcon(editingItem.tipo)}
                  <span className="text-sm truncate">{editingItem.nombre_archivo}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe el archivo..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="leccion">Lección</SelectItem>
                    <SelectItem value="ejercicio">Ejercicio</SelectItem>
                    <SelectItem value="recurso">Recurso</SelectItem>
                    <SelectItem value="evaluacion">Evaluación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}