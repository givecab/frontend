"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "../../ui/card"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Badge } from "../../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Textarea } from "../../ui/textarea"
import {
  FileText,
  AlertCircle,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  User,
  Calendar,
  Building2,
  TestTube2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import { useApi } from "../../../hooks/use-api"
import { useInfiniteScroll } from "../../../hooks/use-infinite-scroll"
import { toast } from "sonner"

interface Protocol {
  id: number
  patient: {
    id: number
    first_name: string
    last_name: string
    dni: string
  }
  state: string
  created_at: string
  is_urgent: boolean
  medico: {
    first_name: string
    last_name: string
  }
  ooss: {
    name: string
  }
  protocol_analyses: Array<{
    id: number
    analysis: {
      id: number
      name: string
      measure_unit: string
      panel: {
        name: string
      }
    }
    result?: {
      id: number
      value: string
      is_normal: boolean
      observations: string
      validated_at: string | null
    }
  }>
  pending_results_count: number
  total_analyses_count: number
  unvalidated_results_count: number
}

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Protocol[]
}

interface ResultadosPorProtocoloProps {
  filters: {
    search: string
    date: string
    state: string
    urgency: string
    analysisType: string
  }
  onStatsUpdate: () => void
}

export function ResultadosPorProtocolo({ filters, onStatsUpdate }: ResultadosPorProtocoloProps) {
  const { apiRequest } = useApi()

  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [expandedProtocols, setExpandedProtocols] = useState<Set<number>>(new Set())

  // Estados para los valores de los resultados
  const [resultValues, setResultValues] = useState<{
    [key: number]: {
      value: string
      is_normal: boolean
      observations: string
    }
  }>({})

  // Construir URL con filtros para protocolos con protocol-analyses sin resultados
  const buildUrl = useCallback(
    (offset = 0) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const params = new URLSearchParams({
        limit: "20",
        offset: offset.toString(),
        include_unvalidated: "true", // Solo protocolos que tienen protocol-analyses sin resultados
      })

      if (filters.search) params.append("search", filters.search)
      if (filters.date) params.append("date", filters.date)
      if (filters.state !== "all") params.append("state", filters.state)
      if (filters.urgency !== "all") params.append("is_urgent", filters.urgency)
      if (filters.analysisType !== "all") params.append("analysis_type", filters.analysisType)

      return `${baseUrl}/api/v1/analysis/protocols/?${params.toString()}`
    },
    [filters],
  )

  // Cargar protocolos que tienen protocol-analyses sin resultados
  const fetchProtocols = useCallback(
    async (reset = true) => {
      if (reset) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const url = reset ? buildUrl(0) : nextUrl
        if (!url) return

        const response = await apiRequest(url)

        if (response.ok) {
          const data: PaginatedResponse = await response.json()

          if (reset) {
            setProtocols(data.results)
            // Inicializar valores de resultados para todos los protocol-analyses (con y sin resultado)
            const initialValues: { [key: number]: { value: string; is_normal: boolean; observations: string } } = {}
            data.results.forEach((protocol) => {
              protocol.protocol_analyses.forEach((pa) => {
                initialValues[pa.id] = {
                  value: pa.result?.value || "",
                  is_normal: pa.result?.is_normal ?? true,
                  observations: pa.result?.observations || "",
                }
              })
            })
            setResultValues(initialValues)
          } else {
            setProtocols((prev) => [...prev, ...data.results])
            // Agregar valores de resultados para nuevos protocol-analyses sin resultado
            const newValues: { [key: number]: { value: string; is_normal: boolean; observations: string } } = {}
            data.results.forEach((protocol) => {
              protocol.protocol_analyses.forEach((pa) => {
                if (!pa.result) {
                  newValues[pa.id] = {
                    value: "",
                    is_normal: true,
                    observations: "",
                  }
                }
              })
            })
            setResultValues((prev) => ({ ...prev, ...newValues }))
          }

          setNextUrl(data.next)
          setHasMore(!!data.next)
        } else {
          console.error("Error fetching protocols:", response.status)
          if (reset) {
            setProtocols([])
            setResultValues({})
          }
          setNextUrl(null)
          setHasMore(false)
        }
      } catch (error) {
        console.error("Error fetching protocols:", error)
        toast.error("Error al cargar los protocolos")
        if (reset) {
          setProtocols([])
          setResultValues({})
        }
        setNextUrl(null)
        setHasMore(false)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [buildUrl, nextUrl, apiRequest],
  )

  // Cargar más protocolos
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && nextUrl) {
      fetchProtocols(false)
    }
  }, [fetchProtocols, isLoadingMore, hasMore, nextUrl])

  // Hook de scroll infinito
  const sentinelRef = useInfiniteScroll({
    loading: isLoadingMore,
    hasMore: hasMore,
    onLoadMore: loadMore,
    dependencies: [filters],
  })

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
      let existingResultId: number | null = null
      for (const protocol of protocols) {
        const pa = protocol.protocol_analyses.find((pa) => pa.id === protocolAnalysisId)
        if (pa?.result) {
          existingResultId = pa.result.id
          break
        }
      }

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
        await fetchProtocols(true)
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
        ...(prev[protocolAnalysisId] || { value: "", is_normal: true, observations: "" }),
        [field]: value,
      },
    }))
  }

  // Toggle protocolo expandido
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

  // Efectos
  useEffect(() => {
    fetchProtocols(true)
  }, [filters])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#204983] mb-2" />
          <p className="text-gray-600">Cargando protocolos con resultados pendientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-[#204983]" />
          <h3 className="text-lg font-semibold text-gray-800">Protocolos con Protocol-Analyses Pendientes</h3>
        </div>
        <Badge variant="outline" className="text-[#204983] border-[#204983]/30">
          {protocols.length} protocolos cargados
        </Badge>
      </div>

      {protocols.length === 0 ? (
        <div className="text-center py-12">
          <FlaskConical className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay protocolos con protocol-analyses pendientes</p>
          <p className="text-gray-500 text-sm">Todos los resultados han sido cargados o ajusta los filtros</p>
        </div>
      ) : (
        <div className="space-y-4">
          {protocols.map((protocol) => (
            <Card
              key={protocol.id}
              className="overflow-hidden border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <CardContent className="p-0">
                {/* Header del Protocolo */}
                <div
                  className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 cursor-pointer hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b"
                  onClick={() => toggleProtocol(protocol.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      {/* Info Principal */}
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-[#204983]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">Protocolo #{protocol.id}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-3 w-3" />
                            <span>
                              {protocol.patient.first_name} {protocol.patient.last_name}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span>DNI: {protocol.patient.dni}</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Adicional */}
                      <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(protocol.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{protocol.ooss.name}</span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {protocol.is_urgent && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Urgente
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-300 text-yellow-700">
                          <TestTube2 className="h-3 w-3 mr-1" />
                          {protocol.pending_results_count} sin resultado, {protocol.unvalidated_results_count || 0} sin
                          validar
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            protocol.state === "carga_pendiente"
                              ? "bg-yellow-100 text-yellow-800"
                              : protocol.state === "carga_completa"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {protocol.state.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {expandedProtocols.has(protocol.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Protocol-Analyses del Protocolo */}
                {expandedProtocols.has(protocol.id) && (
                  <div className="p-6 bg-white">
                    {/* Info del Médico */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Médico Solicitante:</span>
                          <p className="text-gray-900">
                            {protocol.medico.first_name} {protocol.medico.last_name}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Obra Social:</span>
                          <p className="text-gray-900">{protocol.ooss.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Estado:</span>
                          <p className="text-gray-900">{protocol.state.replace("_", " ")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Protocol-Analyses */}
                    <div className="space-y-4">
                      <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                        <TestTube2 className="h-4 w-4 text-[#204983]" />
                        Protocol-Analyses del Protocolo
                      </h5>

                      {protocol.protocol_analyses.map((pa) => (
                        <Card
                          key={pa.id}
                          className={`${
                            pa.result
                              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                              {/* Info del Análisis */}
                              <div className="lg:col-span-2">
                                <p className="font-semibold text-gray-900">{pa.analysis.name}</p>
                                <p className="text-sm text-gray-600">{pa.analysis.panel.name}</p>
                                <p className="text-xs text-gray-500">Unidad: {pa.analysis.measure_unit}</p>
                              </div>

                              {/* Input de Valor o Resultado Existente */}
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">
                                  Resultado ({pa.analysis.measure_unit})
                                </label>
                                {pa.result ? (
                                  <div className="p-2 bg-green-100 rounded text-center font-medium text-green-800">
                                    {pa.result.value}
                                  </div>
                                ) : (
                                  <Input
                                    placeholder="Valor"
                                    value={resultValues[pa.id]?.value || ""}
                                    onChange={(e) => updateResultValue(pa.id, "value", e.target.value)}
                                    className="text-center bg-white"
                                  />
                                )}
                              </div>

                              {/* Estado Normal/Anormal */}
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">Estado</label>
                                {pa.result ? (
                                  <div
                                    className={`p-2 rounded text-center text-xs font-medium ${
                                      pa.result.is_normal ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {pa.result.is_normal ? "Normal" : "Anormal"}
                                  </div>
                                ) : (
                                  <Select
                                    value={resultValues[pa.id]?.is_normal ? "normal" : "abnormal"}
                                    onValueChange={(value) => updateResultValue(pa.id, "is_normal", value === "normal")}
                                  >
                                    <SelectTrigger className="bg-white">
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
                                )}
                              </div>

                              {/* Observaciones */}
                              <div>
                                <label className="text-xs text-gray-600 block mb-1">Observaciones</label>
                                {pa.result ? (
                                  <div className="p-2 bg-gray-100 rounded text-xs min-h-[60px]">
                                    {pa.result.observations || "Sin observaciones"}
                                  </div>
                                ) : (
                                  <Textarea
                                    placeholder="Notas..."
                                    value={resultValues[pa.id]?.observations || ""}
                                    onChange={(e) => updateResultValue(pa.id, "observations", e.target.value)}
                                    className="min-h-[60px] bg-white text-xs"
                                  />
                                )}
                              </div>

                              {/* Botones de Acción o Estado */}
                              <div className="flex flex-col gap-2">
                                {pa.result?.validated_at ? (
                                  <Badge variant="default" className="bg-green-600 text-white text-xs justify-center">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Validado
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => saveResult(pa.id)}
                                    disabled={isSaving || !resultValues[pa.id]?.value?.trim()}
                                    className="bg-[#204983] hover:bg-[#204983]/90 text-xs"
                                  >
                                    {isSaving ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                    <span className="ml-1">{pa.result ? "Actualizar" : "Guardar"}</span>
                                  </Button>
                                )}

                                {pa.result && !pa.result.validated_at && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-orange-50 border-orange-300 text-orange-700 justify-center"
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    Sin Validar
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Infinite Scroll Sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {isLoadingMore && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-[#204983] animate-spin" />
                  <span className="text-gray-600">Cargando más protocolos...</span>
                </div>
              )}
            </div>
          )}

          {!hasMore && protocols.length > 0 && (
            <div className="text-center py-6">
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <CheckCircle2 className="h-5 w-5" />
                <p>Todos los protocolos han sido cargados</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
