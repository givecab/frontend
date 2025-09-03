"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Badge } from "../../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Textarea } from "../../ui/textarea"
import {
  TestTube2,
  Clock,
  AlertCircle,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Target,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { useApi } from "../../../hooks/use-api"
import { toast } from "sonner"

interface Analysis {
  id: number
  name: string
  measure_unit: string
  panel: {
    id: number
    name: string
  }
  pending_protocol_analyses_count: number
  urgent_protocol_analyses_count: number
}

interface ProtocolAnalysis {
  id: number
  protocol: {
    id: number
    patient: {
      first_name: string
      last_name: string
      dni: string
    }
    created_at: string
    is_urgent: boolean
    state: string
    medico: {
      first_name: string
      last_name: string
    }
    ooss: {
      name: string
    }
  }
  analysis: {
    id: number
    name: string
    measure_unit: string
  }
  result?: {
    id: number
    value: string
    is_normal: boolean
    observations: string
    validated_at: string | null
  }
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

export function ResultadosPorAnalisis({ filters, onStatsUpdate }: ResultadosPorAnalisisProps) {
  const { apiRequest } = useApi()

  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)
  const [protocolAnalyses, setProtocolAnalyses] = useState<ProtocolAnalysis[]>([])
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true)
  const [isLoadingProtocols, setIsLoadingProtocols] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())

  // Estados para los valores de los resultados
  const [resultValues, setResultValues] = useState<{
    [key: number]: {
      value: string
      is_normal: boolean
      observations: string
    }
  }>({})

  // Cargar análisis que tienen protocol-analyses sin resultados
  const fetchAnalyses = useCallback(async () => {
    setIsLoadingAnalyses(true)
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const params = new URLSearchParams()

      if (filters.search) params.append("search", filters.search)
      if (filters.date) params.append("date", filters.date)
      if (filters.state !== "all") params.append("protocol_state", filters.state)
      if (filters.urgency !== "all") params.append("is_urgent", filters.urgency)
      if (filters.analysisType !== "all") params.append("analysis_type", filters.analysisType)

      // Endpoint que devuelve análisis con conteo de protocol-analyses pendientes
      const response = await apiRequest(`${baseUrl}/api/analyses/with-pending-results/?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()
        setAnalyses(data.results || [])
      } else {
        console.error("Error fetching analyses:", response.status)
        setAnalyses([])
      }
    } catch (error) {
      console.error("Error fetching analyses:", error)
      toast.error("Error al cargar los análisis")
      setAnalyses([])
    } finally {
      setIsLoadingAnalyses(false)
    }
  }, [apiRequest, filters])

  // Cargar protocol-analyses para un análisis específico que no tienen resultado
  const fetchProtocolAnalyses = useCallback(
    async (analysisId: number) => {
      setIsLoadingProtocols(true)
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL
        const params = new URLSearchParams()

        params.append("analysis", analysisId.toString())
        params.append("include_unvalidated", "true") // Solo los que no tienen resultado
        if (filters.date) params.append("protocol_date", filters.date)
        if (filters.state !== "all") params.append("protocol_state", filters.state)
        if (filters.urgency !== "all") params.append("is_urgent", filters.urgency)

        const response = await apiRequest(`${baseUrl}/api/protocol-analyses/?${params.toString()}`)

        if (response.ok) {
          const data = await response.json()
          setProtocolAnalyses(data.results || [])

          // Inicializar valores de resultados (vacíos para nuevos, existentes para editar)
          const initialValues: { [key: number]: { value: string; is_normal: boolean; observations: string } } = {}
          data.results.forEach((pa: ProtocolAnalysis) => {
            initialValues[pa.id] = {
              value: pa.result?.value || "",
              is_normal: pa.result?.is_normal ?? true,
              observations: pa.result?.observations || "",
            }
          })
          setResultValues(initialValues)
        }
      } catch (error) {
        console.error("Error fetching protocol analyses:", error)
        toast.error("Error al cargar los protocol-analyses")
      } finally {
        setIsLoadingProtocols(false)
      }
    },
    [apiRequest, filters],
  )

  // Crear o actualizar resultado para un protocol-analysis
  const saveResult = async (protocolAnalysisId: number) => {
    const resultData = resultValues[protocolAnalysisId]
    if (!resultData || !resultData.value.trim()) {
      toast.error("El valor del resultado es requerido")
      return
    }

    setIsSaving(true)
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL

      // Buscar si ya existe un resultado
      const protocolAnalysis = protocolAnalyses.find((pa) => pa.id === protocolAnalysisId)
      const existingResultId = protocolAnalysis?.result?.id

      const method = existingResultId ? "PUT" : "POST"
      const url = existingResultId ? `${baseUrl}/api/results/${existingResultId}/` : `${baseUrl}/api/results/`

      const body = existingResultId
        ? {
            value: resultData.value,
            is_normal: resultData.is_normal,
            observations: resultData.observations,
          }
        : {
            protocol_analysis: protocolAnalysisId,
            value: resultData.value,
            is_normal: resultData.is_normal,
            observations: resultData.observations,
          }

      const response = await apiRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(existingResultId ? "Resultado actualizado correctamente" : "Resultado guardado correctamente")
        // Actualizar la lista
        if (selectedAnalysis) {
          await fetchProtocolAnalyses(selectedAnalysis.id)
        }
        onStatsUpdate()
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || "Error al guardar el resultado")
      }
    } catch (error) {
      console.error("Error saving result:", error)
      toast.error("Error al guardar el resultado")
    } finally {
      setIsSaving(false)
    }
  }

  // Actualizar valor de resultado
  const updateResultValue = (protocolAnalysisId: number, field: "value" | "is_normal" | "observations", value: any) => {
    setResultValues((prev) => ({
      ...prev,
      [protocolAnalysisId]: {
        ...prev[protocolAnalysisId],
        [field]: value,
      },
    }))
  }

  // Toggle card expandida
  const toggleCard = (protocolAnalysisId: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(protocolAnalysisId)) {
        newSet.delete(protocolAnalysisId)
      } else {
        newSet.add(protocolAnalysisId)
      }
      return newSet
    })
  }

  // Efectos
  useEffect(() => {
    fetchAnalyses()
  }, [fetchAnalyses])

  useEffect(() => {
    if (selectedAnalysis) {
      fetchProtocolAnalyses(selectedAnalysis.id)
    }
  }, [selectedAnalysis, fetchProtocolAnalyses])

  return (
    <div className="space-y-6">
      {/* Selector de Análisis */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-[#204983]" />
          <h3 className="text-lg font-semibold text-gray-800">Seleccionar Análisis para Carga de Resultados</h3>
        </div>

        {isLoadingAnalyses ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#204983] mb-2" />
              <p className="text-gray-600">Cargando análisis con protocol-analyses pendientes...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map((analysis) => (
              <Card
                key={analysis.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                  selectedAnalysis?.id === analysis.id
                    ? "border-[#204983] bg-blue-50 shadow-lg"
                    : "border-gray-200 hover:border-[#204983]/50"
                }`}
                onClick={() => setSelectedAnalysis(analysis)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TestTube2 className="h-4 w-4 text-[#204983]" />
                        <h4 className="font-semibold text-gray-900">{analysis.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{analysis.panel.name}</p>
                      <p className="text-xs text-gray-500">Unidad: {analysis.measure_unit}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        {analysis.pending_protocol_analyses_count} sin resultado
                      </Badge>
                      {analysis.urgent_protocol_analyses_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {analysis.urgent_protocol_analyses_count} urgentes
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoadingAnalyses && analyses.length === 0 && (
          <div className="text-center py-12">
            <TestTube2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No hay análisis con protocol-analyses pendientes</p>
            <p className="text-gray-500 text-sm">Todos los resultados han sido cargados o ajusta los filtros</p>
          </div>
        )}
      </div>

      {/* Protocol-Analyses del Análisis Seleccionado */}
      {selectedAnalysis && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-[#204983]/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#204983]" />
                  <span>Cargando resultados para: {selectedAnalysis.name}</span>
                </div>
                <Badge variant="outline" className="text-[#204983] border-[#204983]/30">
                  {protocolAnalyses.length} protocol-analyses sin resultado
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>

          {isLoadingProtocols ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#204983] mb-2" />
                <p className="text-gray-600">Cargando protocol-analyses sin resultado...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {protocolAnalyses.map((pa) => (
                <Card key={pa.id} className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    {/* Header del protocol-analysis */}
                    <div className="p-4 bg-gray-50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          {/* Info del Protocolo */}
                          <div>
                            <p className="font-semibold text-gray-900">Protocolo #{pa.protocol.id}</p>
                            <p className="text-sm text-gray-600">
                              {pa.protocol.patient.first_name} {pa.protocol.patient.last_name}
                            </p>
                            <p className="text-xs text-gray-500">DNI: {pa.protocol.patient.dni}</p>
                          </div>

                          {/* Badges de Estado */}
                          <div className="flex flex-wrap gap-1">
                            {pa.protocol.is_urgent && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Urgente
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(pa.protocol.created_at).toLocaleDateString()}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                pa.protocol.state === "carga_pendiente"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {pa.protocol.state.replace("_", " ")}
                            </Badge>
                            {pa.result && (
                              <Badge
                                variant={pa.result.validated_at ? "default" : "outline"}
                                className={`text-xs ${
                                  pa.result.validated_at
                                    ? "bg-green-600 text-white"
                                    : "bg-orange-100 text-orange-800 border-orange-300"
                                }`}
                              >
                                {pa.result.validated_at ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Validado
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Sin Validar
                                  </>
                                )}
                              </Badge>
                            )}
                          </div>

                          {/* Input de Valor */}
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder={`Valor (${selectedAnalysis.measure_unit})`}
                              value={resultValues[pa.id]?.value || ""}
                              onChange={(e) => updateResultValue(pa.id, "value", e.target.value)}
                              className="text-center"
                            />
                            <Select
                              value={resultValues[pa.id]?.is_normal ? "normal" : "abnormal"}
                              onValueChange={(value) => updateResultValue(pa.id, "is_normal", value === "normal")}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    Normal
                                  </div>
                                </SelectItem>
                                <SelectItem value="abnormal">
                                  <div className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3 text-red-600" />
                                    Anormal
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Botones */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveResult(pa.id)}
                              disabled={isSaving || !resultValues[pa.id]?.value?.trim() || !!pa.result?.validated_at}
                              className="bg-[#204983] hover:bg-[#204983]/90"
                            >
                              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              <span className="ml-1 text-xs">{pa.result ? "Actualizar" : "Guardar"}</span>
                            </Button>

                            <Button size="sm" variant="ghost" onClick={() => toggleCard(pa.id)}>
                              {expandedCards.has(pa.id) ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sección Expandida */}
                    {expandedCards.has(pa.id) && (
                      <div className="p-4 bg-white border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Información del Protocolo
                            </label>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>
                                <span className="font-medium">Médico:</span> {pa.protocol.medico.first_name}{" "}
                                {pa.protocol.medico.last_name}
                              </p>
                              <p>
                                <span className="font-medium">Obra Social:</span> {pa.protocol.ooss.name}
                              </p>
                              <p>
                                <span className="font-medium">Estado:</span> {pa.protocol.state.replace("_", " ")}
                              </p>
                              <p>
                                <span className="font-medium">Fecha:</span>{" "}
                                {new Date(pa.protocol.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Observaciones</label>
                            <Textarea
                              placeholder="Observaciones del resultado..."
                              value={resultValues[pa.id]?.observations || ""}
                              onChange={(e) => updateResultValue(pa.id, "observations", e.target.value)}
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {protocolAnalyses.length === 0 && (
                <div className="text-center py-12">
                  <TestTube2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No hay protocol-analyses sin resultado</p>
                  <p className="text-gray-500 text-sm">Para este análisis con los filtros aplicados</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
