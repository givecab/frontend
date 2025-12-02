"use client"
import { useState, useEffect } from "react"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Checkbox } from "../../ui/checkbox"
import { Search, TestTube, X } from "lucide-react"
import { useApi } from "../../../hooks/use-api"
import { toast } from "sonner"
import type { AnalysisPanel, Analysis } from "../../../types"
import { CATALOG_ENDPOINTS } from "@/config/api"

interface AnalysisSelectorProps {
  selectedAnalyses: Analysis[]
  onAnalysisChange: (analyses: Analysis[]) => void
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export function AnalysisSelector({ selectedAnalyses, onAnalysisChange }: AnalysisSelectorProps) {
  const { apiRequest } = useApi()
  const [panels, setPanels] = useState<AnalysisPanel[]>([])
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPanelsAndAnalyses()
  }, [])

  const loadPanelsAndAnalyses = async () => {
    try {
      setIsLoading(true)
      // Cargar paneles
      const panelsResponse = await apiRequest(CATALOG_ENDPOINTS.ANALYSIS)
      if (panelsResponse.ok) {
        const panelsData: PaginatedResponse<AnalysisPanel> = await panelsResponse.json()
        setPanels(panelsData.results)
      }

      // Cargar análisis
      const analysesResponse = await apiRequest(CATALOG_ENDPOINTS.ANALYSIS)
      if (analysesResponse.ok) {
        const analysesData: PaginatedResponse<Analysis> = await analysesResponse.json()
        setAnalyses(analysesData.results)
      }
    } catch (error) {
      console.error("Error loading panels and analyses:", error)
      toast.error("Error al cargar los análisis")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAnalyses = analyses.filter(
    (analysis) =>
      analysis.name.toLowerCase().includes(searchTerm.toLowerCase()) || analysis.code.toString().includes(searchTerm),
  )

  const handleAnalysisToggle = (analysis: Analysis, checked: boolean) => {
    if (checked) {
      onAnalysisChange([...selectedAnalyses, analysis])
    } else {
      onAnalysisChange(selectedAnalyses.filter((a) => a.id !== analysis.id))
    }
  }

  const handlePanelToggle = (panel: AnalysisPanel, checked: boolean) => {
    const panelAnalyses = analyses.filter((analysis) => analysis.panel === panel.id)

    if (checked) {
      // Agregar todos los análisis del panel que no estén ya seleccionados
      const newAnalyses = panelAnalyses.filter(
        (analysis) => !selectedAnalyses.find((selected) => selected.id === analysis.id),
      )
      onAnalysisChange([...selectedAnalyses, ...newAnalyses])
    } else {
      // Remover todos los análisis del panel
      const panelAnalysisIds = panelAnalyses.map((a) => a.id)
      onAnalysisChange(selectedAnalyses.filter((analysis) => !panelAnalysisIds.includes(analysis.id)))
    }
  }

  const removeAnalysis = (analysisId: number) => {
    onAnalysisChange(selectedAnalyses.filter((a) => a.id !== analysisId))
  }

  const isPanelSelected = (panel: AnalysisPanel) => {
    const panelAnalyses = analyses.filter((analysis) => analysis.panel === panel.id)
    return (
      panelAnalyses.length > 0 &&
      panelAnalyses.every((analysis) => selectedAnalyses.find((selected) => selected.id === analysis.id))
    )
  }

  const isPanelPartiallySelected = (panel: AnalysisPanel) => {
    const panelAnalyses = analyses.filter((analysis) => analysis.panel === panel.id)
    const selectedCount = panelAnalyses.filter((analysis) =>
      selectedAnalyses.find((selected) => selected.id === analysis.id),
    ).length
    return selectedCount > 0 && selectedCount < panelAnalyses.length
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#204983]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Análisis Seleccionados */}
      {selectedAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Análisis Seleccionados ({selectedAnalyses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedAnalyses.map((analysis) => (
                <Badge key={analysis.id} variant="secondary" className="flex items-center gap-1">
                  {analysis.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeAnalysis(analysis.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selector de Análisis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Seleccionar Análisis
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar análisis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Paneles */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Paneles de Análisis</h4>
            {panels.map((panel) => {
              const panelAnalyses = analyses.filter((analysis) => analysis.panel === panel.id)
              const isSelected = isPanelSelected(panel)
              const isPartiallySelected = isPanelPartiallySelected(panel)

              return (
                <div key={panel.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handlePanelToggle(panel, checked as boolean)}
                    className={isPartiallySelected ? "data-[state=checked]:bg-orange-500" : ""}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{panel.name}</div>
                    <div className="text-sm text-gray-500">
                      {panelAnalyses.length} análisis
                      {panel.is_urgent && (
                        <Badge variant="destructive" className="ml-2">
                          Urgente
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Análisis Individuales */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Análisis Individuales</h4>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredAnalyses.map((analysis) => {
                const isSelected = selectedAnalyses.find((selected) => selected.id === analysis.id)
                const panel = panels.find((p) => p.id === analysis.panel)

                return (
                  <div key={analysis.id} className="flex items-center space-x-2 p-2 border rounded">
                    <Checkbox
                      checked={!!isSelected}
                      onCheckedChange={(checked) => handleAnalysisToggle(analysis, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{analysis.name}</div>
                      <div className="text-sm text-gray-500">
                        Código: {analysis.code}
                        {panel && ` • Panel: ${panel.name}`}
                        {analysis.measure_unit && ` • Unidad: ${analysis.measure_unit}`}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
