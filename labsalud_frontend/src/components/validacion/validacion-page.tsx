"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import useAuth from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { ValidationProtocolList } from "./components/validation-protocol-list"

export default function ValidacionPage() {
  const { hasPermission } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  const canValidateResults = hasPermission(71)

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-[#204983] animate-spin mb-2" />
          <p className="text-gray-600">Cargando validación...</p>
        </div>
      </div>
    )
  }

  if (!canValidateResults) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Validación de Resultados</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>No tienes permisos para validar resultados.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-[#204983]" />
              Validación de Resultados
            </h1>
            <p className="text-sm text-gray-500 mt-1">Revisa y valida los resultados de los protocolos pendientes</p>
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6">
        <Tabs defaultValue="por-protocolo" className="w-full">
          <TabsList className="mb-4 bg-gray-100">
            <TabsTrigger
              value="por-protocolo"
              className="data-[state=active]:bg-white data-[state=active]:text-[#204983] data-[state=active]:shadow-sm"
            >
              Protocolos Pendientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="por-protocolo" className="mt-4">
            <ValidationProtocolList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
