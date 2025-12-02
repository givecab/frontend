"use client"
import { TestTube } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { ProtocolAccordionView } from "./components/protocol-accordion-view"
import { AnalysisAccordionView } from "./components/analysis-accordion-view"
import { useState, useEffect } from "react"

const RESULTS_TAB_KEY = "labsalud_results_tab"

export default function ResultadosPage() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(RESULTS_TAB_KEY)
      return saved || "por-analisis"
    } catch {
      return "por-analisis"
    }
  })

  useEffect(() => {
    localStorage.setItem(RESULTS_TAB_KEY, activeTab)
  }, [activeTab])

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TestTube className="h-6 w-6 text-[#204983]" />
              Carga de Resultados
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sistema de carga y edición de resultados para protocol-analyses
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 bg-gray-100">
            <TabsTrigger
              value="por-analisis"
              className="data-[state=active]:bg-white data-[state=active]:text-[#204983] data-[state=active]:shadow-sm"
            >
              Por Análisis
            </TabsTrigger>
            <TabsTrigger
              value="por-protocolo"
              className="data-[state=active]:bg-white data-[state=active]:text-[#204983] data-[state=active]:shadow-sm"
            >
              Por Protocolo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="por-analisis" className="mt-4">
            <AnalysisAccordionView />
          </TabsContent>

          <TabsContent value="por-protocolo" className="mt-4">
            <ProtocolAccordionView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
