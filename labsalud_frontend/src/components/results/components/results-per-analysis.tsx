"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { FlaskConical, Target, Loader2, TestTube2 } from "lucide-react"
import { useApi } from "../../../hooks/use-api"
import { toast } from "sonner"
import { ANALYSIS_ENDPOINTS, TOAST_DURATION } from "../../../config/api"

import { PanelSelector } from "./panel-selector"
import { ProtocolHeader } from "./protocol-header"
import { AnalysisInput } from "./analysis-input"
import { AnalysisHistory } from "./analysis-history"

interface Panel {
  id: number
  name: string
  bio_unit: string
}

interface Analysis {
  id: number
  name: string
  measure_unit: string
  code: string
}

interface Patient {
  id: number
  dni: string
  first_name: string
  last_name: string
  birth_date: string
  gender: string
  phone_mobile?: string
  email?: string
}

interface Medico {
  id: number
  first_name: string
  last_name: string
  license: string
}

interface Ooss {
  id: number
  name: string
}

interface Protocol {
  id: number
  patient: Patient
  medico: Medico
  ooss: Ooss
  ooss_number: string
  contact_method: string
  state: string
  paid: boolean
  created_at: string
  is_urgent: boolean
}

interface ProtocolAnalysisRaw {
  id: number
  protocol: number
  analysis: number
  created_at: string
  created_by: {
    id: number
    username: string
  }
  history: any[]
  is_active: boolean
}

interface ProtocolAnalysisEnriched {
  id: number
  protocol: Protocol
  analysis: Analysis
  result?: {
    id: number
    value: string
    is_abnormal: boolean
    notes: string
    validated_at: string | null
  }
  created_at: string
}

interface ProtocolWithPanelAnalyses {
  protocol: Protocol
  panelAnalyses: ProtocolAnalysisEnriched[]
  pendingCount: number
  totalCount: number
}

interface ResultadosPorAnalisisProps {
  filters: {
    search: string
    date: string
    state: string
    urgency: string
    analysisType: string
  }
  onStatsUpdate: () => void
}

interface HistoricalResult {
  id: number
  value: string
  is_abnormal: boolean
  note: string
  created_at: string
  validated_at: string | null
  validated_by?: {
    first_name: string
    last_name: string
  }
}

export function ResultadosPorAnalisis({ filters, onStatsUpdate }: ResultadosPorAnalisisProps) {
  const { apiRequest } = useApi()

  const [panels, setPanels] = useState<Panel[]>([])
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null)
  const [protocolsWithPanelAnalyses, setProtocolsWithPanelAnalyses] = useState<ProtocolWithPanelAnalyses[]>([])
  const [isLoadingPanels, setIsLoadingPanels] = useState(true)
  const [isLoadingProtocols, setIsLoadingProtocols] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedProtocols, setExpandedProtocols] = useState<Set<number>>(new Set())

  // Estados para los valores de los resultados
  const [resultValues, setResultValues] = useState<{
    [key: number]: {
      value: string
      is_abnormal: boolean
      note: string
    }
  }>({})

  const [historicalResults, setHistoricalResults] = useState<{
    [key: string]: HistoricalResult[]
  }>({})
  const [activeAnalysisHistory, setActiveAnalysisHistory] = useState<{
    patientId: number | null
    analysisId: number | null
    protocolAnalysisId: number | null
  }>({
    patientId: null,
    analysisId: null,
    protocolAnalysisId: null,
  })
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const isCalculatedAnalysis = (analysisName: string) => {
    const calculatedAnalyses = ["ÍNDICE", "RATIO", "COCIENTE", "PORCENTAJE"]
    return calculatedAnalyses.some((keyword) => analysisName.toUpperCase().includes(keyword))
  }

  const fetchHistoricalResults = useCallback(
    async (patientId: number, analysisId: number) => {
      const key = `${patientId}-${analysisId}`
      if (historicalResults[key]) return

      setIsLoadingHistory(true)
      try {
        const response = await apiRequest(
          `${ANALYSIS_ENDPOINTS.RESULTS}?protocol_analysis__protocol__patient=${patientId}&protocol_analysis__analysis=${analysisId}&ordering=-created_at&limit=10`,
        )
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Historical results fetched:", data)
          setHistoricalResults((prev) => ({
            ...prev,
            [key]: data.results || [],
          }))
        } else {
          console.error("[v0] Error fetching historical results:", response.status)
        }
      } catch (error) {
        console.error("Error fetching historical results:", error)
      } finally {
        setIsLoadingHistory(false)
      }
    },
    [apiRequest, historicalResults],
  )

  const handleAnalysisInputFocus = (patientId: number, analysisId: number, protocolAnalysisId: number) => {
    setActiveAnalysisHistory({ patientId, analysisId, protocolAnalysisId })
    fetchHistoricalResults(patientId, analysisId)
  }

  const handleShowHistory = (patientId: number, analysisId: number, protocolAnalysisId: number) => {
    setActiveAnalysisHistory({ patientId, analysisId, protocolAnalysisId })
    fetchHistoricalResults(patientId, analysisId)
  }

  const enrichProtocolAnalyses = useCallback(
    async (rawProtocolAnalyses: ProtocolAnalysisRaw[]): Promise<ProtocolAnalysisEnriched[]> => {
      const enriched: ProtocolAnalysisEnriched[] = []

      for (const rawPA of rawProtocolAnalyses) {
        try {
          const [protocolResponse, analysisResponse, resultsResponse] = await Promise.all([
            apiRequest(`${ANALYSIS_ENDPOINTS.PROTOCOLS}${rawPA.protocol}/`),
            apiRequest(`${ANALYSIS_ENDPOINTS.ANALYSES}${rawPA.analysis}/`),
            apiRequest(`${ANALYSIS_ENDPOINTS.RESULTS}?protocol_analysis=${rawPA.id}`),
          ])

          if (!protocolResponse.ok || !analysisResponse.ok) continue

          const protocol = await protocolResponse.json()
          const analysis = await analysisResponse.json()

          let result = undefined
          if (resultsResponse.ok) {
            const resultsData = await resultsResponse.json()
            if (resultsData.results && resultsData.results.length > 0) {
              result = resultsData.results[0]
            }
          }

          enriched.push({
            id: rawPA.id,
            protocol,
            analysis,
            result,
            created_at: rawPA.created_at,
          })
        } catch (error) {
          console.error(`Error enriching protocol analysis ${rawPA.id}:`, error)
        }
      }

      return enriched
    },
    [apiRequest],
  )

  const groupProtocolAnalysesByProtocol = (
    protocolAnalyses: ProtocolAnalysisEnriched[],
  ): ProtocolWithPanelAnalyses[] => {
    const protocolMap = new Map<number, ProtocolWithPanelAnalyses>()

    protocolAnalyses.forEach((pa) => {
      const protocolId = pa.protocol.id

      if (!protocolMap.has(protocolId)) {
        protocolMap.set(protocolId, {
          protocol: pa.protocol,
          panelAnalyses: [],
          pendingCount: 0,
          totalCount: 0,
        })
      }

      const protocolGroup = protocolMap.get(protocolId)!
      protocolGroup.panelAnalyses.push(pa)
      protocolGroup.totalCount++

      if (!pa.result) {
        protocolGroup.pendingCount++
      }
    })

    return Array.from(protocolMap.values())
  }

  const fetchPanels = useCallback(async () => {
    setIsLoadingPanels(true)
    try {
      const response = await apiRequest(ANALYSIS_ENDPOINTS.PANELS)
      if (response.ok) {
        const data = await response.json()
        setPanels(data.results || [])
      } else {
        toast.error("Error al cargar los paneles", { duration: TOAST_DURATION })
      }
    } catch (error) {
      console.error("Error fetching panels:", error)
      toast.error("Error al cargar los paneles", { duration: TOAST_DURATION })
    } finally {
      setIsLoadingPanels(false)
    }
  }, [apiRequest])

  const fetchProtocolAnalysesByPanel = useCallback(
    async (panelId: number) => {
      setIsLoadingProtocols(true)
      try {
        const params = new URLSearchParams()
        params.append("analysis__panel", panelId.toString())

        if (filters.search) params.append("protocol__patient__first_name__icontains", filters.search)
        if (filters.date) params.append("protocol__created_at__date", filters.date)
        if (filters.state !== "all") params.append("protocol__state", filters.state)
        if (filters.urgency !== "all")
          params.append("protocol__is_urgent", filters.urgency === "true" ? "true" : "false")

        const protocolAnalysesUrl = `${ANALYSIS_ENDPOINTS.PROTOCOL_ANALYSES}?${params.toString()}`
        const protocolAnalysesResponse = await apiRequest(protocolAnalysesUrl)

        if (protocolAnalysesResponse.ok) {
          const protocolAnalysesData = await protocolAnalysesResponse.json()
          const enrichedData = await enrichProtocolAnalyses(protocolAnalysesData.results || [])

          const groupedProtocols = groupProtocolAnalysesByProtocol(enrichedData)
          setProtocolsWithPanelAnalyses(groupedProtocols)

          const initialValues: { [key: number]: { value: string; is_abnormal: boolean; note: string } } = {}
          enrichedData.forEach((pa: ProtocolAnalysisEnriched) => {
            initialValues[pa.id] = {
              value: pa.result?.value || "",
              is_abnormal: pa.result?.is_abnormal ?? false,
              note: pa.result?.notes || "",
            }
          })
          setResultValues(initialValues)
        } else {
          setProtocolsWithPanelAnalyses([])
          setResultValues({})
        }
      } catch (error) {
        console.error("Error fetching protocol analyses:", error)
        toast.error("Error al cargar los análisis de protocolo", { duration: TOAST_DURATION })
      } finally {
        setIsLoadingProtocols(false)
      }
    },
    [apiRequest, filters, enrichProtocolAnalyses],
  )

  const saveResult = async (protocolAnalysisId: number) => {
    const resultData = resultValues[protocolAnalysisId]
    if (!resultData || !resultData.value.trim()) {
      toast.error("El valor del resultado es requerido", { duration: TOAST_DURATION })
      return
    }

    setIsSaving(true)
    try {
      let existingResult: any = null
      for (const protocolGroup of protocolsWithPanelAnalyses) {
        const pa = protocolGroup.panelAnalyses.find((pa) => pa.id === protocolAnalysisId)
        if (pa?.result) {
          existingResult = pa.result
          break
        }
      }

      const method = existingResult ? "PUT" : "POST"
      const url = existingResult ? ANALYSIS_ENDPOINTS.RESULT_DETAIL(existingResult.id) : ANALYSIS_ENDPOINTS.RESULTS

      const requestBody = existingResult
        ? {
            protocol_analysis: protocolAnalysisId,
            value: resultData.value,
            is_abnormal: resultData.is_abnormal,
            note: resultData.note,
          }
        : {
            protocol_analysis: protocolAnalysisId,
            value: resultData.value,
            note: resultData.note,
            is_abnormal: resultData.is_abnormal,
          }

      console.log("[v0] Exact request details:")
      console.log("[v0] Method:", method)
      console.log("[v0] URL:", url)
      console.log("[v0] Request body:", requestBody)
      console.log("[v0] Protocol Analysis ID type:", typeof protocolAnalysisId, protocolAnalysisId)
      console.log("[v0] Value type:", typeof resultData.value, resultData.value)
      console.log("[v0] Note type:", typeof resultData.note, resultData.note)
      console.log("[v0] Is abnormal type:", typeof resultData.is_abnormal, resultData.is_abnormal)

      const response = await apiRequest(url, {
        method,
        body: requestBody, // Pass object directly, not JSON string
      })

      console.log("[v0] Response status:", response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log("[v0] Success response data:", responseData)
        toast.success(existingResult ? "Resultado actualizado correctamente" : "Resultado guardado correctamente", {
          duration: TOAST_DURATION,
        })
        if (selectedPanel) {
          await fetchProtocolAnalysesByPanel(selectedPanel.id)
        }
        const currentPA = protocolsWithPanelAnalyses
          .flatMap((pg) => pg.panelAnalyses)
          .find((pa) => pa.id === protocolAnalysisId)
        if (currentPA) {
          const historyKey = `${currentPA.protocol.patient.id}-${currentPA.analysis.id}`
          setHistoricalResults((prev) => {
            const newResults = { ...prev }
            delete newResults[historyKey]
            return newResults
          })
        }
        onStatsUpdate()
      } else {
        const errorText = await response.text()
        console.error("[v0] Error response status:", response.status)
        console.error("[v0] Error response text:", errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
          console.error("[v0] Error response JSON:", errorData)
        } catch (e) {
          console.error("[v0] Could not parse error response as JSON")
          errorData = { detail: errorText }
        }

        toast.error(errorData.detail || errorData.non_field_errors?.[0] || "Error al guardar el resultado", {
          duration: TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("[v0] Network or other error:", error)
      toast.error("Error al guardar el resultado", { duration: TOAST_DURATION })
    } finally {
      setIsSaving(false)
    }
  }

  const updateResultValue = (protocolAnalysisId: number, field: "value" | "is_abnormal" | "note", value: any) => {
    setResultValues((prev) => ({
      ...prev,
      [protocolAnalysisId]: {
        ...prev[protocolAnalysisId],
        [field]: value,
      },
    }))
  }

  const toggleProtocol = (protocolId: number) => {
    setExpandedProtocols((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(protocolId)) {
        newSet.delete(protocolId)
      } else {
        newSet.add(protocolId)
      }
      return newSet
    })
  }

  useEffect(() => {
    fetchPanels()
  }, [fetchPanels])

  useEffect(() => {
    if (selectedPanel) {
      fetchProtocolAnalysesByPanel(selectedPanel.id)
    }
  }, [selectedPanel, fetchProtocolAnalysesByPanel])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-[#204983]" />
          <h3 className="text-lg font-semibold text-gray-800">Seleccionar Panel para Carga de Resultados</h3>
        </div>

        <PanelSelector
          panels={panels}
          selectedPanel={selectedPanel}
          isLoading={isLoadingPanels}
          onPanelSelect={setSelectedPanel}
        />
      </div>

      {selectedPanel && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-[#204983]/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#204983]" />
                  <span>Panel: {selectedPanel.name}</span>
                </div>
                <Badge variant="outline" className="text-[#204983] border-[#204983]/30">
                  {protocolsWithPanelAnalyses.length} protocolos
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>

          {isLoadingProtocols ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#204983] mb-2" />
                <p className="text-gray-600">Cargando protocolos...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {protocolsWithPanelAnalyses.map((protocolGroup) => (
                <Card
                  key={protocolGroup.protocol.id}
                  className="overflow-hidden border-gray-200 hover:shadow-lg transition-all duration-200"
                >
                  <CardContent className="p-0">
                    <ProtocolHeader
                      protocol={protocolGroup.protocol}
                      pendingCount={protocolGroup.pendingCount}
                      totalCount={protocolGroup.totalCount}
                      isExpanded={expandedProtocols.has(protocolGroup.protocol.id)}
                      onToggle={() => toggleProtocol(protocolGroup.protocol.id)}
                    />

                    {expandedProtocols.has(protocolGroup.protocol.id) && (
                      <div className="p-6 bg-white">
                        {/* Protocol Info */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Médico Solicitante:</span>
                              <p className="text-gray-900">
                                {protocolGroup.protocol.medico.first_name} {protocolGroup.protocol.medico.last_name}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Obra Social:</span>
                              <p className="text-gray-900">{protocolGroup.protocol.ooss.name}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Estado:</span>
                              <p className="text-gray-900">{protocolGroup.protocol.state.replace("_", " ")}</p>
                            </div>
                          </div>
                        </div>

                        {/* Panel Analyses List */}
                        <div className="space-y-4">
                          <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                            <TestTube2 className="h-4 w-4 text-[#204983]" />
                            Análisis del Panel {selectedPanel.name}
                          </h5>

                          {protocolGroup.panelAnalyses.map((pa, index) => {
                            const historyKey = `${pa.protocol.patient.id}-${pa.analysis.id}`
                            const isActive = activeAnalysisHistory.protocolAnalysisId === pa.id
                            const history = historicalResults[historyKey] || []
                            const isCalculated = isCalculatedAnalysis(pa.analysis.name)

                            const getNextInputRef = () => {
                              const nextIndex = index + 1
                              const nextAnalysis = protocolGroup.panelAnalyses[nextIndex]
                              if (
                                nextAnalysis &&
                                !nextAnalysis.result &&
                                !isCalculatedAnalysis(nextAnalysis.analysis.name)
                              ) {
                                return document.querySelector(
                                  `input[data-analysis-id="${nextAnalysis.id}"]`,
                                ) as HTMLInputElement
                              }
                              return null
                            }

                            return (
                              <Card
                                key={pa.id}
                                className={`${
                                  pa.result
                                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                                } ${isActive ? "ring-2 ring-[#204983]/30" : ""}`}
                              >
                                <CardContent className="p-4">
                                  <div className="grid grid-cols-1 gap-4">
                                    <AnalysisInput
                                      analysis={pa.analysis}
                                      result={
                                        pa.result
                                          ? {
                                              id: pa.result.id,
                                              value: pa.result.value,
                                              is_abnormal: pa.result.is_abnormal,
                                              note: pa.result.notes, // Map notes to note
                                              validated_at: pa.result.validated_at,
                                            }
                                          : undefined
                                      }
                                      resultValue={resultValues[pa.id] || { value: "", is_abnormal: false, note: "" }}
                                      isCalculated={isCalculated}
                                      isSaving={isSaving}
                                      onValueChange={(field, value) => updateResultValue(pa.id, field, value)}
                                      onSave={() => saveResult(pa.id)}
                                      onFocus={() =>
                                        handleAnalysisInputFocus(pa.protocol.patient.id, pa.analysis.id, pa.id)
                                      }
                                      onShowHistory={() =>
                                        handleShowHistory(pa.protocol.patient.id, pa.analysis.id, pa.id)
                                      }
                                      onEnterSave={() => saveResult(pa.id)}
                                      nextInputRef={getNextInputRef}
                                    />

                                    {isActive && (
                                      <AnalysisHistory
                                        analysisName={pa.analysis.name}
                                        measureUnit={pa.analysis.measure_unit}
                                        history={history}
                                        isLoading={isLoadingHistory}
                                      />
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
