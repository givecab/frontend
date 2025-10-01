"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion"
import { Badge } from "../../ui/badge"
import { Input } from "../../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Loader2, FileText, User, Calendar, Activity, AlertCircle, Search, Filter } from "lucide-react"
import { useApi } from "../../../hooks/use-api"
import { ANALYSIS_ENDPOINTS } from "../../../config/api"
import { AnalysisInput } from "./analysis-input"
import { useToast } from "../../../hooks/use-toast"
import { useInfiniteScroll } from "../../../hooks/use-infinite-scroll"

interface Protocol {
  id: number
  protocol_number: string
  patient_first_name: string
  patient_last_name: string
  patient_dni: string
  ooss: string
  created_at: string
  state: string
  loaded_results_count: number
  total_analyses_count: number
}

interface UserInfo {
  username: string
  photo: string
}

interface PreviousResult {
  protocol_id: number
  value: string
  created_at: string
  created_by: UserInfo
}

interface ProtocolAnalysisResult {
  protocol_analysis_id: number
  result_id?: number
  analysis_name: string
  analysis_measure_unit: string
  value?: string
  validated_at?: string | null
  validated_by?: UserInfo | null
  created_at?: string
  created_by?: UserInfo
  is_abnormal?: boolean
  is_valid?: boolean
  notes?: string
  previous_results?: PreviousResult[]
}

interface ResultValue {
  value: string
  is_abnormal: boolean
  note: string
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const getStateLabel = (state: string): string => {
  const stateMap: Record<string, string> = {
    pending_entry: "Carga Pendiente",
    entry_complete: "Carga Completa",
    pending_validation: "Validación Pendiente",
    review: "En Revisión",
    completed: "Finalizado",
    cancelled: "Cancelado",
  }
  return stateMap[state] || state
}

const getStateBadgeVariant = (state: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (state) {
    case "pending_entry":
      return "secondary"
    case "entry_complete":
      return "outline"
    case "pending_validation":
      return "outline"
    case "review":
      return "destructive"
    case "completed":
      return "default"
    case "cancelled":
      return "destructive"
    default:
      return "secondary"
  }
}

const getStateBadgeClasses = (state: string): string => {
  switch (state) {
    case "pending_entry":
      return "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200"
    case "pending_validation":
      return "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200"
    case "review":
      return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
    case "completed":
      return "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
  }
}

export function ProtocolAccordionView() {
  const { apiRequest } = useApi()
  const { success, error: showError } = useToast()

  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loadingProtocols, setLoadingProtocols] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingResults, setLoadingResults] = useState<Record<number, boolean>>({})
  const [protocolResults, setProtocolResults] = useState<Record<number, ProtocolAnalysisResult[]>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [stateFilter, setStateFilter] = useState<string>("all")

  const [resultValues, setResultValues] = useState<Record<string, ResultValue>>({})
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [focusedAnalysis, setFocusedAnalysis] = useState<string | null>(null)

  const buildUrl = useCallback(
    (search = "", offset = 0) => {
      const params = new URLSearchParams({
        limit: "20",
        offset: offset.toString(),
      })

      if (search.trim()) {
        params.append("search", search.trim())
      }

      if (stateFilter !== "all") {
        params.append("state", stateFilter)
      }

      return `${ANALYSIS_ENDPOINTS.PROTOCOLS_SUMMARY}?${params.toString()}`
    },
    [stateFilter],
  )

  const fetchActiveProtocols = useCallback(
    async (reset = true) => {
      if (reset) {
        setLoadingProtocols(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const url = reset ? buildUrl(searchTerm, 0) : nextUrl
        if (!url) return

        const response = await apiRequest(url)
        if (response.ok) {
          const data: PaginatedResponse<Protocol> = await response.json()

          if (reset) {
            setProtocols(data.results)
            setTotalCount(data.count)
          } else {
            setProtocols((prev) => [...prev, ...data.results])
          }

          setNextUrl(data.next)
          setHasMore(!!data.next)
        } else {
          showError("Error al cargar protocolos activos")
        }
      } catch (error) {
        console.error("[v0] Error fetching active protocols:", error)
        showError("Error al cargar protocolos")
      } finally {
        setLoadingProtocols(false)
        setIsLoadingMore(false)
      }
    },
    [apiRequest, showError, buildUrl, searchTerm, nextUrl],
  )

  const fetchProtocolResults = useCallback(
    async (protocolId: number) => {
      if (protocolResults[protocolId]) return

      setLoadingResults((prev) => ({ ...prev, [protocolId]: true }))
      try {
        const response = await apiRequest(ANALYSIS_ENDPOINTS.PROTOCOL_RESULTS(protocolId))
        if (response.ok) {
          const responseData = await response.json()
          const data: ProtocolAnalysisResult[] = Array.isArray(responseData) ? responseData : responseData.results || []

          const processedData = data
            .filter((item) => {
              if (!item.analysis_name) {
                console.warn("[v0] Skipping item with missing analysis_name:", item)
                return false
              }
              return true
            })
            .map((item) => ({
              ...item,
              previous_results: item.previous_results || [],
              notes: item.notes || "",
            }))

          setProtocolResults((prev) => ({ ...prev, [protocolId]: processedData }))

          const initialValues: Record<string, ResultValue> = {}
          processedData.forEach((item) => {
            const key = `${protocolId}-${item.protocol_analysis_id}`
            initialValues[key] = {
              value: item.value || "",
              is_abnormal: item.is_abnormal || false,
              note: item.notes || "",
            }
          })
          setResultValues((prev) => ({ ...prev, ...initialValues }))
        } else {
          showError("Error al cargar resultados del protocolo")
        }
      } catch (error) {
        console.error("[v0] Error fetching protocol results:", error)
        showError("Error al cargar resultados")
      } finally {
        setLoadingResults((prev) => ({ ...prev, [protocolId]: false }))
      }
    },
    [apiRequest, protocolResults, showError],
  )

  const handleValueChange = useCallback(
    (protocolId: number, protocolAnalysisId: number, field: "value" | "is_abnormal" | "note", value: any) => {
      const key = `${protocolId}-${protocolAnalysisId}`
      setResultValues((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value,
        },
      }))
    },
    [],
  )

  const handleSave = useCallback(
    async (protocolId: number, protocolAnalysisId: number, hasExistingResult: boolean, resultId?: number) => {
      const key = `${protocolId}-${protocolAnalysisId}`
      const resultValue = resultValues[key]

      if (!resultValue || !resultValue.value.trim()) {
        showError("El valor del resultado es requerido")
        return
      }

      setSavingStates((prev) => ({ ...prev, [key]: true }))
      try {
        const endpoint =
          hasExistingResult && resultId ? ANALYSIS_ENDPOINTS.RESULT_DETAIL(resultId) : ANALYSIS_ENDPOINTS.RESULTS

        const method = hasExistingResult ? "PATCH" : "POST"

        const body = hasExistingResult
          ? {
              value: resultValue.value,
              is_abnormal: resultValue.is_abnormal,
              notes: resultValue.note,
            }
          : {
              protocol_analysis: protocolAnalysisId,
              value: resultValue.value,
              is_abnormal: resultValue.is_abnormal,
              notes: resultValue.note,
            }

        const response = await apiRequest(endpoint, {
          method,
          body,
        })

        if (response.ok) {
          success(hasExistingResult ? "Resultado actualizado correctamente" : "Resultado guardado correctamente")

          const updatedData = await response.json()

          setProtocolResults((prev) => {
            const currentResults = prev[protocolId] || []
            const updatedResults = currentResults.map((item) =>
              item.protocol_analysis_id === protocolAnalysisId
                ? {
                    ...item,
                    result_id: updatedData.id || item.result_id,
                    value: updatedData.value,
                    is_abnormal: updatedData.is_abnormal,
                    notes: updatedData.notes,
                    created_at: updatedData.created_at || item.created_at,
                    created_by: updatedData.created_by || item.created_by,
                    previous_results: updatedData.previous_results || item.previous_results,
                    // Reset is_valid to undefined so it can be validated again
                    is_valid: undefined,
                    validated_at: undefined,
                    validated_by: undefined,
                  }
                : item,
            )
            return { ...prev, [protocolId]: updatedResults }
          })

          setResultValues((prev) => ({
            ...prev,
            [key]: {
              value: updatedData.value,
              is_abnormal: updatedData.is_abnormal,
              note: updatedData.notes || "",
            },
          }))

          setProtocols((prev) =>
            prev.map((protocol) => {
              if (protocol.id === protocolId && protocol.state === "review") {
                // Check if there are any remaining invalid results
                const currentResults = protocolResults[protocolId] || []
                const hasInvalidResults = currentResults.some(
                  (r) => r.protocol_analysis_id !== protocolAnalysisId && r.is_valid === false,
                )

                // If no more invalid results, change state back to entry_complete or pending_validation
                if (!hasInvalidResults) {
                  const allResultsLoaded = currentResults.every(
                    (r) => r.protocol_analysis_id === protocolAnalysisId || r.value,
                  )
                  return {
                    ...protocol,
                    state: allResultsLoaded ? "entry_complete" : "pending_entry",
                    loaded_results_count: (protocol.loaded_results_count || 0) + (hasExistingResult ? 0 : 1),
                  }
                }
              }
              return protocol
            }),
          )
        } else {
          const errorData = await response.json()
          showError(errorData.message || "Error al guardar el resultado")
        }
      } catch (error) {
        console.error("[v0] Error saving result:", error)
        showError("Error al guardar el resultado")
      } finally {
        setSavingStates((prev) => ({ ...prev, [key]: false }))
      }
    },
    [resultValues, showError, success, apiRequest, protocolResults],
  )

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && nextUrl) {
      fetchActiveProtocols(false)
    }
  }, [isLoadingMore, hasMore, nextUrl, fetchActiveProtocols])

  const sentinelRef = useInfiniteScroll({
    loading: isLoadingMore,
    hasMore: hasMore,
    onLoadMore: loadMore,
    dependencies: [hasMore, nextUrl],
  })

  const filteredProtocols = useMemo(() => {
    return protocols.filter((protocol) => {
      const matchesSearch =
        searchTerm === "" ||
        protocol.patient_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.patient_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.patient_dni.includes(searchTerm) ||
        String(protocol.protocol_number || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const matchesState = stateFilter === "all" || protocol.state === stateFilter

      return matchesSearch && matchesState
    })
  }, [protocols, searchTerm, stateFilter])

  useEffect(() => {
    fetchActiveProtocols()
  }, [])

  useEffect(() => {
    setProtocols([])
    setNextUrl(null)
    setHasMore(true)
    fetchActiveProtocols()
  }, [stateFilter])

  if (loadingProtocols) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#204983]" />
          <p className="text-gray-600">Cargando protocolos activos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por paciente, DNI o número de protocolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <div className="sm:w-64">
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="bg-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending_entry">Carga Pendiente</SelectItem>
              <SelectItem value="entry_complete">Carga Completa</SelectItem>
              <SelectItem value="pending_validation">Validación Pendiente</SelectItem>
              <SelectItem value="review">En Revisión</SelectItem>
              <SelectItem value="completed">Finalizado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProtocols.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <AlertCircle className="h-12 w-12 mb-3 text-gray-400" />
          <p className="text-lg font-medium">No se encontraron protocolos</p>
          <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <>
          <Accordion type="multiple" className="w-full space-y-2">
            {filteredProtocols.map((protocol) => (
              <AccordionItem
                key={protocol.id}
                value={`protocol-${protocol.id}`}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger
                  className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors hover:no-underline"
                  onClick={() => fetchProtocolResults(protocol.id)}
                >
                  <div className="flex items-center gap-3 flex-wrap w-full">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#204983]" />
                      <span className="font-semibold text-[#204983]">Protocolo #{protocol.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {protocol.patient_first_name} {protocol.patient_last_name}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-gray-50">
                      DNI: {protocol.patient_dni}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                      {protocol.ooss}
                    </Badge>
                    <Badge variant="outline" className={`font-medium ${getStateBadgeClasses(protocol.state)}`}>
                      {getStateLabel(protocol.state)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm font-medium text-[#204983]">
                      <Activity className="h-4 w-4" />
                      {protocol.loaded_results_count || 0}/{protocol.total_analyses_count || 0}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(protocol.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-4 bg-gray-50">
                  {loadingResults[protocol.id] ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#204983]" />
                    </div>
                  ) : protocolResults[protocol.id]?.length > 0 ? (
                    <div className="space-y-3">
                      {protocolResults[protocol.id].map((item, index) => {
                        const key = `${protocol.id}-${item.protocol_analysis_id}`
                        const hasExistingResult = !!item.value
                        const nextIndex = index + 1
                        const nextKey =
                          nextIndex < protocolResults[protocol.id].length
                            ? `${protocol.id}-${protocolResults[protocol.id][nextIndex].protocol_analysis_id}`
                            : null

                        return (
                          <AnalysisInput
                            key={key}
                            protocolAnalysisId={item.protocol_analysis_id}
                            analysisName={item.analysis_name}
                            measureUnit={item.analysis_measure_unit}
                            hasExistingResult={hasExistingResult}
                            isValidated={!!item.validated_at}
                            isValid={item.is_valid}
                            validatedBy={item.validated_by}
                            validatedAt={item.validated_at}
                            createdBy={item.created_by}
                            createdAt={item.created_at}
                            previousResults={item.previous_results || []}
                            resultValue={resultValues[key] || { value: "", is_abnormal: false, note: "" }}
                            isSaving={savingStates[key] || false}
                            onValueChange={(field, value) =>
                              handleValueChange(protocol.id, item.protocol_analysis_id, field, value)
                            }
                            onSave={() =>
                              handleSave(protocol.id, item.protocol_analysis_id, hasExistingResult, item.result_id)
                            }
                            onFocus={() => {
                              setFocusedAnalysis(key)
                            }}
                            onShowHistory={() => {
                              console.log("[v0] Show history for:", item.analysis_name, item.previous_results)
                            }}
                            nextInputKey={nextKey}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <AlertCircle className="h-8 w-8 mb-2" />
                      <p>No hay análisis disponibles para este protocolo</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {hasMore && !loadingProtocols && filteredProtocols.length > 0 && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              {isLoadingMore && (
                <div className="flex items-center">
                  <Loader2 className="h-6 w-6 text-[#204983] animate-spin mr-2" />
                  <span className="text-gray-600">Cargando más protocolos...</span>
                </div>
              )}
            </div>
          )}

          {!hasMore && filteredProtocols.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>No hay más protocolos para mostrar</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
