"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { MedicosManagement } from "./medicos-management"
import { ObrasSocialesManagement } from "./obras-sociales-management"
import { AnalysisManagement } from "./analysis-management"
import { AuditManagement } from "./audit-management"

export default function ConfigurationPage() {
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
            <MedicosManagement />
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
