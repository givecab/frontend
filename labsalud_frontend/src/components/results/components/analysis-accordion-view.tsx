"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion"
import { Badge } from "../../ui/badge"
import { Input } from "../../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Loader2, FileText, User, Calendar, Activity, AlertCircle, Search, Filter, FlaskConical } from "lucide-react"
import { useApi } from "../../../hooks/use-api"
import { ANALYSIS_ENDPOINTS } from "../../../config/api"
import { AnalysisInput } from "./analysis-input"
import { useToast } from "../../../hooks/use-toast"
import { useInfiniteScroll } from "../../../hooks/use-infinite-scroll"
import type { PaginatedResponse, ResultValue } from "../../../types" // Importing undeclared variables

interface Panel {
  id: number
  name: string
  code: string
}

interface Protocol {
  id: number
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
  protocol_analysis_id?: number
  result_id?: number
  analysis_name?: string
  analysis_measure_unit?: string
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

export function AnalysisAccordionView() {
  const { apiRequest } = useApi()
  const { success, error: showError } = useToast()

  const [panels, setPanels] = useState<Panel[]>([])
  const [loadingPanels, setLoadingPanels] = useState(true)
  const [panelsHasMore, setPanelsHasMore] = useState(true)
  const [panelsNextUrl, setPanelsNextUrl] = useState<string | null>(null)
  const [isLoadingMorePanels, setIsLoadingMorePanels] = useState(false)

  const [selectedPanelId, setSelectedPanelId] = useState<number | null>(null)

  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loadingProtocols, setLoadingProtocols] = useState(false)
  const [protocolsHasMore, setProtocolsHasMore] = useState(true)
  const [protocolsNextUrl, setProtocolsNextUrl] = useState<string | null>(null)
  const [isLoadingMoreProtocols, setIsLoadingMoreProtocols] = useState(false)

  const [loadingResults, setLoadingResults] = useState<Record<number, boolean>>({})
  const [protocolResults, setProtocolResults] = useState<Record<number, ProtocolAnalysisResult[]>>({})
  const [resultValues, setResultValues] = useState<Record<string, ResultValue>>({})
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [focusedAnalysis, setFocusedAnalysis] = useState<string | null>(null)

  const [panelSearchTerm, setPanelSearchTerm] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [stateFilter, setStateFilter] = useState("all")

  const fetchActivePanels = useCallback(
    async (reset = true) => {
      if (reset) {
        setLoadingPanels(true)
      } else {
        setIsLoadingMorePanels(true)
      }

      try {
        const url = reset ? ANALYSIS_ENDPOINTS.ACTIVE_PANELS : panelsNextUrl
        if (!url) return

        const response = await apiRequest(url)
        if (response.ok) {
          const data: PaginatedResponse<Panel> = await response.json()

          if (reset) {
            setPanels(data.results)
          } else {
            setPanels((prev) => [...prev, ...data.results])
          }

          setPanelsNextUrl(data.next)
          setPanelsHasMore(!!data.next)
        } else {
          showError("Error al cargar paneles activos")
        }
      } catch (error) {
        console.error("[v0] Error fetching active panels:", error)
        showError("Error al cargar paneles")
      } finally {
        setLoadingPanels(false)
        setIsLoadingMorePanels(false)
      }
    },
    [apiRequest, showError, panelsNextUrl],
  )

  const loadMorePanels = useCallback(() => {
    if (!isLoadingMorePanels && panelsHasMore && panelsNextUrl) {
      fetchActivePanels(false)
    }
  }, [isLoadingMorePanels, panelsHasMore, panelsNextUrl, fetchActivePanels])

  const panelsSentinelRef = useInfiniteScroll({
    loading: isLoadingMorePanels,
    hasMore: panelsHasMore,
    onLoadMore: loadMorePanels,
    dependencies: [panelsHasMore, panelsNextUrl],
  })

  useEffect(() => {
    fetchActivePanels()
  }, [])

  const fetchProtocolsByPanel = useCallback(
    async (panelId: number, reset = true) => {
      if (reset) {
        setProtocols([])
        setProtocolResults({})
        setResultValues({})
        setLoadingProtocols(true)
        setSelectedPanelId(panelId)
      } else {
        setIsLoadingMoreProtocols(true)
      }

      try {
        const url = reset ? ANALYSIS_ENDPOINTS.PROTOCOLS_BY_PANEL(panelId) : protocolsNextUrl
        if (!url) return

        const response = await apiRequest(url)
        if (response.ok) {
          const data: PaginatedResponse<Protocol> = await response.json()

          if (reset) {
            setProtocols(data.results)
          } else {
            setProtocols((prev) => [...prev, ...data.results])
          }

          setProtocolsNextUrl(data.next)
          setProtocolsHasMore(!!data.next)
        } else {
          showError("Error al cargar protocolos del panel")
        }
      } catch (error) {
        console.error("[v0] Error fetching protocols by panel:", error)
        showError("Error al cargar protocolos")
      } finally {
        setLoadingProtocols(false)
        setIsLoadingMoreProtocols(false)
      }
    },
    [apiRequest, showError, protocolsNextUrl],
  )

  const loadMoreProtocols = useCallback(() => {
    if (!isLoadingMoreProtocols && protocolsHasMore && protocolsNextUrl && selectedPanelId) {
      fetchProtocolsByPanel(selectedPanelId, false)
    }
  }, [isLoadingMoreProtocols, protocolsHasMore, protocolsNextUrl, selectedPanelId, fetchProtocolsByPanel])

  const protocolsSentinelRef = useInfiniteScroll({
    loading: isLoadingMoreProtocols,
    hasMore: protocolsHasMore,
    onLoadMore: loadMoreProtocols,
    dependencies: [protocolsHasMore, protocolsNextUrl],
  })

  const fetchProtocolResults = useCallback(
    async (protocolId: number) => {
      if (protocolResults[protocolId]) return

      setLoadingResults((prev) => ({ ...prev, [protocolId]: true }))
      try {
        const url = `${ANALYSIS_ENDPOINTS.PROTOCOL_RESULTS(protocolId)}?panel_id=${selectedPanelId}`
        const response = await apiRequest(url)
        if (response.ok) {
          const responseData = await response.json()
          const data: ProtocolAnalysisResult[] = Array.isArray(responseData) ? responseData : responseData.results || []

          const processedData = data
            .filter((item) => {
              if (!item.analysis_name || !item.protocol_analysis_id) {
                console.warn("[v0] Skipping item with missing required fields:", item)
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
              is_valid: item.is_valid,
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
    [apiRequest, protocolResults, showError, selectedPanelId],
  )

  const handleValueChange = useCallback(
    (
      protocolId: number,
      protocolAnalysisId: number,
      field: "value" | "is_abnormal" | "note" | "is_valid",
      value: any,
    ) => {
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
              is_valid: resultValue.is_valid,
            }
          : {
              protocol_analysis: protocolAnalysisId,
              value: resultValue.value,
              is_abnormal: resultValue.is_abnormal,
              notes: resultValue.note,
              is_valid: resultValue.is_valid,
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
                    created_at: updatedData.created_at,
                    created_by: updatedData.created_by,
                    previous_results: updatedData.previous_results || item.previous_results,
                    is_valid: updatedData.is_valid,
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
              is_valid: updatedData.is_valid,
            },
          }))
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
    [resultValues, showError, success, apiRequest],
  )

  const filteredPanels = useMemo(() => {
    return panels.filter((panel) => {
      return (
        panelSearchTerm === "" ||
        panel.name.toLowerCase().includes(panelSearchTerm.toLowerCase()) ||
        String(panel.code || "")
          .toLowerCase()
          .includes(panelSearchTerm.toLowerCase())
      )
    })
  }, [panels, panelSearchTerm])

  const filteredProtocols = useMemo(() => {
    return protocols.filter((protocol) => {
      const matchesSearch =
        searchTerm === "" ||
        protocol.patient_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.patient_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.patient_dni.includes(searchTerm)

      const matchesState = stateFilter === "all" || protocol.state === stateFilter

      return matchesSearch && matchesState
    })
  }, [protocols, searchTerm, stateFilter])

  if (loadingPanels) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#204983]" />
          <p className="text-gray-600">Cargando paneles...</p>
        </div>
      </div>
    )
  }

  if (!selectedPanelId) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">Selecciona un panel para ver los protocolos asociados</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar paneles por nombre o código..."
            value={panelSearchTerm}
            onChange={(e) => setPanelSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        {filteredPanels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-3 text-gray-400" />
            <p className="text-lg font-medium">
              {panelSearchTerm ? "No se encontraron paneles" : "No hay paneles activos"}
            </p>
            {panelSearchTerm && <p className="text-sm">Intenta ajustar la búsqueda</p>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPanels.map((panel) => (
                <button
                  key={panel.id}
                  onClick={() => fetchProtocolsByPanel(panel.id)}
                  className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-[#204983] transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FlaskConical className="h-6 w-6 text-[#204983] group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[#204983] transition-colors">
                      {panel.name}
                    </h3>
                  </div>
                  <Badge variant="outline" className="bg-gray-50">
                    {panel.code}
                  </Badge>
                </button>
              ))}
            </div>

            {panelsHasMore && !loadingPanels && filteredPanels.length > 0 && (
              <div ref={panelsSentinelRef} className="flex justify-center py-4">
                {isLoadingMorePanels && (
                  <div className="flex items-center">
                    <Loader2 className="h-6 w-6 text-[#204983] animate-spin mr-2" />
                    <span className="text-gray-600">Cargando más paneles...</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const selectedPanel = panels.find((p) => p.id === selectedPanelId)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <button
          onClick={() => {
            setSelectedPanelId(null)
            setProtocols([])
            setProtocolResults({})
            setResultValues({})
          }}
          className="px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700"
        >
          ← Volver a Paneles
        </button>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-[#204983]" />
          <span className="font-semibold text-[#204983]">{selectedPanel?.name}</span>
          <Badge variant="outline" className="bg-white">
            {selectedPanel?.code}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por paciente o DNI..."
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
              <SelectItem value="completed">Finalizado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loadingProtocols ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#204983]" />
            <p className="text-gray-600">Cargando protocolos...</p>
          </div>
        </div>
      ) : filteredProtocols.length === 0 ? (
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
                  className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors [&[data-state=open]>svg]:rotate-180 hover:no-underline"
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
                            protocolAnalysisId={item.protocol_analysis_id!}
                            analysisName={item.analysis_name!}
                            measureUnit={item.analysis_measure_unit!}
                            hasExistingResult={hasExistingResult}
                            isValidated={!!item.validated_at}
                            isValid={item.is_valid}
                            validatedBy={item.validated_by}
                            validatedAt={item.validated_at}
                            createdBy={item.created_by}
                            createdAt={item.created_at}
                            previousResults={item.previous_results || []}
                            resultValue={
                              resultValues[key] || { value: "", is_abnormal: false, note: "", is_valid: false }
                            }
                            isSaving={savingStates[key] || false}
                            onValueChange={(field, value) =>
                              handleValueChange(protocol.id, item.protocol_analysis_id!, field, value)
                            }
                            onSave={() =>
                              handleSave(protocol.id, item.protocol_analysis_id!, hasExistingResult, item.result_id)
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

          {protocolsHasMore && !loadingProtocols && filteredProtocols.length > 0 && (
            <div ref={protocolsSentinelRef} className="flex justify-center py-4">
              {isLoadingMoreProtocols && (
                <div className="flex items-center">
                  <Loader2 className="h-6 w-6 text-[#204983] animate-spin mr-2" />
                  <span className="text-gray-600">Cargando más protocolos...</span>
                </div>
              )}
            </div>
          )}

          {!protocolsHasMore && filteredProtocols.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>No hay más protocolos para mostrar</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const getStateLabel = (state: string): string => {
  const stateMap: Record<string, string> = {
    pending_entry: "Carga Pendiente",
    entry_complete: "Carga Completa",
    pending_validation: "Validación Pendiente",
    completed: "Finalizado",
    cancelled: "Cancelado",
  }
  return stateMap[state] || state
}

const getStateBadgeVariant = (state: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (state) {
    case "pending_entry":
      return "secondary" // naranja
    case "entry_complete":
      return "outline"
    case "pending_validation":
      return "outline" // amarillo
    case "completed":
      return "default" // verde
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
    case "completed":
      return "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
  }
}
