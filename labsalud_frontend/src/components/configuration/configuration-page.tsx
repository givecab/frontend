"use client"

import { useState, useEffect } from "react"
import useAuth from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { MedicosManagement } from "./medicos-management"
import { ObrasSocialesManagement } from "./obras-sociales-management"
import { AnalysisManagement } from "./analysis-management"
import { AuditManagement } from "./audit-management"

// Interfaces (sin cambios)
export interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  photo: string
}

export interface Medico {
  id: number
  first_name: string
  last_name: string
  license: string
  is_active: boolean
  created_by: {
    id: number
    username: string
    photo: string
  } | null
  created_at: string
  history: HistoryEntry[]
}

export interface HistoryEntry {
  version: number
  user: {
    id: number
    username: string
    photo: string
  } | null
  created_at: string
}

export interface ObraSocial {
  id: number
  name: string
  code?: string
  is_active: boolean
  created_by: User | null
  updated_by: User[]
  created_at: string
  updated_at: string
}

export interface AnalysisPanel {
  id: number
  code: number
  name: string
  bio_unit: string
  is_urgent: boolean
  created_by: {
    id: number
    username: string
    photo?: string
  } | null
  created_at: string
  history?: HistoryEntry[]
  analyses?: AnalysisItem[]
}

export interface AnalysisItem {
  id: number
  panel: number
  created_by: {
    id: number
    username: string
    photo?: string
  } | null
  updated_by: Array<{
    id: number
    username: string
    photo?: string
  }> | null
  code: string
  name: string
  measure_unit: string
  formula?: string
  created_at: string | null
  updated_at: string | null
}

export default function ConfigurationPage({ medico }: { medico?: Medico }) {
  const { hasPermission } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("config-active-tab")
    if (savedTab && ["medicos", "obras-sociales", "analisis", "auditoria"].includes(savedTab)) {
      return savedTab
    }
    return "medicos"
  })

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    localStorage.setItem("config-active-tab", value)
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6 flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-[#204983] animate-spin mb-2" />
            <p className="text-gray-600">Cargando configuración...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Configuración del Sistema</h1>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="medicos">Médicos</TabsTrigger>
            <TabsTrigger value="obras-sociales">Obras Sociales</TabsTrigger>
            <TabsTrigger value="analisis">Análisis</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
          </TabsList>

          <TabsContent value="medicos">
            <MedicosManagement medico={medico} />
          </TabsContent>

          <TabsContent value="obras-sociales">
            <ObrasSocialesManagement />
          </TabsContent>

          <TabsContent value="analisis">
            <AnalysisManagement />
          </TabsContent>

          <TabsContent value="auditoria">
            <AuditManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
