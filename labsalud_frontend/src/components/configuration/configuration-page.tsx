"use client"

import { useState, useEffect } from "react"
import useAuth from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2, Settings, Users, ShieldCheckIcon, FileTextIcon } from "lucide-react"
import { MedicosManagement } from "./medicos-management"
import { ObrasSocialesManagement } from "./obras-sociales-management"
import { AnalisisManagement } from "./analisis-management"

// Interfaces (sin cambios)
export interface User {
  id: number
  username: string
  first_name?: string
  last_name?: string
  photo?: string
}

export interface Medico {
  id: number
  first_name: string
  last_name: string
  license: string
  is_active: boolean
  created_by: User | null
  updated_by: User[]
  created_at: string
  updated_at: string
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
  created_by: User | null
  updated_by: User[]
  code: number
  name: string
  bio_unit: string
  is_urgent: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  analyses?: AnalysisItem[]
}

export interface AnalysisItem {
  id: number
  panel: number
  created_by: User | null
  updated_by: User[]
  code: string
  name: string
  measure_unit: string
  formula: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ConfigurationPage() {
  const { hasPermission } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  const canViewMedicos = hasPermission(46) || hasPermission(98)
  const canCreateMedicos = hasPermission(43) || hasPermission(96)
  const canEditMedicos = hasPermission(44) || hasPermission(97)
  const canDeleteMedicos = hasPermission(45)

  const canViewOoss = hasPermission(53) || hasPermission(101)
  const canCreateOoss = hasPermission(50) || hasPermission(99)
  const canEditOoss = hasPermission(51) || hasPermission(100)
  const canDeleteOoss = hasPermission(52)

  const VIEW_ANALYSIS_PANELS_PERMISSION = 60
  const CREATE_ANALYSIS_PANELS_PERMISSION = 61
  const EDIT_ANALYSIS_PANELS_PERMISSION = 62
  const DELETE_ANALYSIS_PANELS_PERMISSION = 63
  const CREATE_ANALYSES_PERMISSION = 65
  const EDIT_ANALYSES_PERMISSION = 66
  const DELETE_ANALYSES_PERMISSION = 67

  const canViewAnalysisPanels = hasPermission(VIEW_ANALYSIS_PANELS_PERMISSION)
  const canCreateAnalysisPanels = hasPermission(CREATE_ANALYSIS_PANELS_PERMISSION)
  const canEditAnalysisPanels = hasPermission(EDIT_ANALYSIS_PANELS_PERMISSION)
  const canDeleteAnalysisPanels = hasPermission(DELETE_ANALYSIS_PANELS_PERMISSION)

  const canCreateAnalyses = hasPermission(CREATE_ANALYSES_PERMISSION)
  const canEditAnalyses = hasPermission(EDIT_ANALYSES_PERMISSION)
  const canDeleteAnalyses = hasPermission(DELETE_ANALYSES_PERMISSION)

  const hasAccessToMedicos = canViewMedicos || canCreateMedicos || canEditMedicos || canDeleteMedicos
  const hasAccessToOoss = canViewOoss || canCreateOoss || canEditOoss || canDeleteOoss
  const hasAccessToAnalisis =
    canViewAnalysisPanels ||
    canCreateAnalysisPanels ||
    canEditAnalysisPanels ||
    canDeleteAnalysisPanels ||
    canCreateAnalyses ||
    canEditAnalyses ||
    canDeleteAnalyses

  const hasAccessToConfiguration = hasAccessToMedicos || hasAccessToOoss || hasAccessToAnalisis

  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("config-active-tab")
    if (savedTab && ["medicos", "obras-sociales", "analisis"].includes(savedTab)) {
      if (savedTab === "medicos" && hasAccessToMedicos) return "medicos"
      if (savedTab === "obras-sociales" && hasAccessToOoss) return "obras-sociales"
      if (savedTab === "analisis" && hasAccessToAnalisis) return "analisis"
    }
    if (hasAccessToMedicos) return "medicos"
    if (hasAccessToOoss) return "obras-sociales"
    if (hasAccessToAnalisis) return "analisis"
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
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 text-[#204983] animate-spin" />
      </div>
    )
  }

  if (!hasAccessToConfiguration) {
    return (
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>No tienes permisos para acceder a la configuración del sistema.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold leading-tight text-gray-900 flex items-center">
          <Settings className="mr-3 h-8 w-8 text-[#204983]" />
          Configuración del Sistema
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Administra las entidades principales del sistema como Médicos, Obras Sociales y Análisis.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {hasAccessToMedicos && (
            <TabsTrigger value="medicos" className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" /> Médicos
            </TabsTrigger>
          )}
          {hasAccessToOoss && (
            <TabsTrigger value="obras-sociales" className="flex items-center justify-center gap-2">
              <ShieldCheckIcon className="h-4 w-4" /> Obras Sociales
            </TabsTrigger>
          )}
          {hasAccessToAnalisis && (
            <TabsTrigger value="analisis" className="flex items-center justify-center gap-2">
              <FileTextIcon className="h-4 w-4" /> Análisis
            </TabsTrigger>
          )}
        </TabsList>

        {hasAccessToMedicos && (
          <TabsContent value="medicos">
            <MedicosManagement
              canView={canViewMedicos}
              canCreate={canCreateMedicos}
              canEdit={canEditMedicos}
              canDelete={canDeleteMedicos}
            />
          </TabsContent>
        )}

        {hasAccessToOoss && (
          <TabsContent value="obras-sociales">
            <ObrasSocialesManagement
              canView={canViewOoss}
              canCreate={canCreateOoss}
              canEdit={canEditOoss}
              canDelete={canDeleteOoss}
            />
          </TabsContent>
        )}

        {hasAccessToAnalisis && (
          <TabsContent value="analisis">
            <AnalisisManagement
              canViewPanels={canViewAnalysisPanels}
              canCreatePanels={canCreateAnalysisPanels}
              canEditPanels={canEditAnalysisPanels}
              canDeletePanels={canDeleteAnalysisPanels}
              canCreateAnalyses={canCreateAnalyses}
              canEditAnalyses={canEditAnalyses}
              canDeleteAnalyses={canDeleteAnalyses}
            />
          </TabsContent>
        )}
      </Tabs>
    </main>
  )
}
