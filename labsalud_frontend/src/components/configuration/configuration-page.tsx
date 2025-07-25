"use client"

import { useState, useEffect } from "react"
import useAuth from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2 } from "lucide-react"
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

  // Permisos para médicos - actualizados con los nuevos números
  const canViewMedicos = hasPermission(46) // view_medico
  const canCreateMedicos = hasPermission(43) // add_medico
  const canEditMedicos = hasPermission(44) // change_medico
  const canDeleteMedicos = hasPermission(45) // delete_medico

  // Permisos para obras sociales - actualizados con los nuevos números
  const canViewOoss = hasPermission(53) // view_ooss
  const canCreateOoss = hasPermission(50) // add_ooss
  const canEditOoss = hasPermission(51) // change_ooss
  const canDeleteOoss = hasPermission(52) // delete_ooss

  // Permisos para paneles de análisis - actualizados con los nuevos números
  const VIEW_ANALYSIS_PANELS_PERMISSION = 60 // view_panel
  const CREATE_ANALYSIS_PANELS_PERMISSION = 57 // add_panel
  const EDIT_ANALYSIS_PANELS_PERMISSION = 58 // change_panel
  const DELETE_ANALYSIS_PANELS_PERMISSION = 59 // delete_panel

  // Permisos para análisis/determinaciones - actualizados con los nuevos números
  const CREATE_ANALYSES_PERMISSION = 64 // add_analysis
  const EDIT_ANALYSES_PERMISSION = 65 // change_analysis
  const DELETE_ANALYSES_PERMISSION = 66 // delete_analysis

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

  if (!hasAccessToConfiguration) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Configuración del Sistema</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>No tienes permisos para acceder a la configuración del sistema.</p>
            </div>
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
            {hasAccessToMedicos && <TabsTrigger value="medicos">Médicos</TabsTrigger>}
            {hasAccessToOoss && <TabsTrigger value="obras-sociales">Obras Sociales</TabsTrigger>}
            {hasAccessToAnalisis && <TabsTrigger value="analisis">Análisis</TabsTrigger>}
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
      </div>
    </div>
  )
}
