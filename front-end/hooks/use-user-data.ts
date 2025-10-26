"use client"

import { useState, useEffect } from "react"
import { authStorage } from "@/lib/auth"
import { userAPI } from "@/lib/api"

export interface PerfilCompleto {
  usuario: {
    id: number
    id_publico: string
    nombre: string
    primer_apellido: string
    segundo_apellido: string | null
    correo: string
    rol: string
    correo_verificado: boolean
    creado_en: string | null
  }
  perfil: {
    nombre_completo: string
    idioma: string
    nivel_actual: string
    curso_actual: string | null
    total_xp: number
    dias_racha: number
    ultima_actividad: string | null
  }
}

export function useUserData() {
  const [userData, setUserData] = useState<PerfilCompleto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = authStorage.getUser()
        
        console.log("🔍 useUserData - Usuario en authStorage:", user)
        
        if (!user) {
          console.warn("⚠️ No hay usuario logueado")
          setError("No hay usuario logueado")
          setIsLoading(false)
          return
        }

        console.log("📡 Obteniendo perfil del backend...")
        
        // Obtener perfil completo del backend
        const data = await userAPI.getPerfilCompleto()
        
        console.log("✅ Perfil obtenido:", data)
        
        setUserData(data)
        setError(null)
      } catch (err: any) {
        console.error("❌ Error al cargar datos del usuario:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const refetch = async () => {
    setIsLoading(true)
    try {
      const data = await userAPI.getPerfilCompleto()
      setUserData(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return { userData, isLoading, error, refetch }
}