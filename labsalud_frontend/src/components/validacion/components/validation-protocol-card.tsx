"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Loader2, CheckCircle, AlertTriangle, History, Beaker, ChevronDown, ChevronUp, XCircle } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { RESULTS_ENDPOINTS } from "@/config/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ProtocolWithLoadedResults, Result } from "@/types"
import { Textarea } from "@/components/ui/textarea"

interface GroupedAnalysis {
  analysisId: number
  analysisName: string
  results: Result[]
}

interface ValidationProtocolCardProps {
  protocol: ProtocolWithLoadedResults
  onProtocolValidated: (protocolId: number) => void
  isExpanded: boolean
}

const groupResultsByAnalysis = (results: Result[]): GroupedAnalysis[] => {
  const groupMap = new Map<number, GroupedAnalysis>()

  results.forEach((result) => {
    const analysisId = result.analysis.id
    if (!groupMap.has(analysisId)) {
      groupMap.set(analysisId, {
        analysisId: analysisId,
        analysisName: result.analysis.name,
        results: [],
      })
    }
    groupMap.get(analysisId)!.results.push(result)
  })

  return Array.from(groupMap.values())
}

const getValidationStatus = (result: Result) => {
  if (result.is_wrong) return "wrong"
  if (result.is_valid) return "valid"
  return "pending"
}

export function ValidationProtocolCard({ protocol, onProtocolValidated, isExpanded }: ValidationProtocolCardProps) {
  const { apiRequest } = useApi()
  const [results, setResults] = useState<Result[]>([])
  const [groupedResults, setGroupedResults] = useState<GroupedAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedAnalysis, setExpandedAnalysis] = useState<string[]>([])
  const [validationNotes, setValidationNotes] = useState<Record<number, string>>({})
  const [validatingIds, setValidatingIds] = useState<Set<number>>(new Set())
  const [rejectingIds, setRejectingIds] = useState<Set<number>>(new Set())
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set())
  const [previousResults, setPreviousResults] = useState<Record<number, Result[]>>({})
  const [loadingPrevious, setLoadingPrevious] = useState<Set<number>>(new Set())
  const [expandedHistory, setExpandedHistory] = useState<Set<number>>(new Set())
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    if (isExpanded && results.length === 0) {
      loadProtocolResults()
    }
  }, [isExpanded])

  const loadProtocolResults = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest(RESULTS_ENDPOINTS.BY_PROTOCOL_WITH_VALUE(protocol.id))

      if (!response.ok) {
        throw new Error("Error al cargar los resultados")
      }

      const data = await response.json()
      const resultsData: Result[] = data.results || data
      setResults(resultsData)
      const grouped = groupResultsByAnalysis(resultsData)
      setGroupedResults(grouped)

      setExpandedAnalysis(grouped.map((g) => g.analysisId.toString()))
    } catch (err) {
      console.error("Error loading protocol results:", err)
      toast.error("Error al cargar los resultados del protocolo")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleHistory = useCallback((resultId: number) => {
    setExpandedHistory((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(resultId)) {
        newSet.delete(resultId)
      } else {
        newSet.add(resultId)
      }
      return newSet
    })
  }, [])

  const loadPreviousResults = useCallback(
    async (resultId: number, determinationId: number) => {
      if (previousResults[resultId] || loadingPrevious.has(resultId)) return

      setLoadingPrevious((prev) => new Set(prev).add(resultId))
      try {
        const response = await apiRequest(RESULTS_ENDPOINTS.PREVIOUS_RESULTS(protocol.patient.id, determinationId))

        if (!response.ok) {
          throw new Error("Error al cargar historial")
        }

        const data: Result[] = await response.json()
        setPreviousResults((prev) => ({ ...prev, [resultId]: data }))
      } catch (error) {
        console.error("Error loading previous results:", error)
      } finally {
        setLoadingPrevious((prev) => {
          const newSet = new Set(prev)
          newSet.delete(resultId)
          return newSet
        })
      }
    },
    [apiRequest, protocol.patient.id, previousResults, loadingPrevious],
  )

  const handleDeterminationHover = useCallback(
    (resultId: number, determinationId: number) => {
      if (!previousResults[resultId] && !loadingPrevious.has(resultId)) {
        loadPreviousResults(resultId, determinationId)
      }
      setExpandedHistory((prev) => new Set(prev).add(resultId))
    },
    [previousResults, loadingPrevious, loadPreviousResults],
  )

  const handleDeterminationLeave = useCallback((e: React.MouseEvent, resultId: number) => {
    const relatedTarget = e.relatedTarget as Node | null
    const currentTarget = e.currentTarget as Node
    if (relatedTarget && currentTarget.contains(relatedTarget)) {
      return
    }
    setExpandedHistory((prev) => {
      const newSet = new Set(prev)
      newSet.delete(resultId)
      return newSet
    })
  }, [])

  const handleValidateResult = async (resultId: number) => {
    const pendingResults = results.filter((r) => !r.is_valid && !r.is_wrong)
    const isLast = pendingResults.length === 1 && pendingResults[0].id === resultId

    try {
      setValidatingIds((prev) => new Set(prev).add(resultId))

      const response = await apiRequest(RESULTS_ENDPOINTS.VALIDATE(resultId), {
        method: "POST",
        body: { is_valid: true, notes: validationNotes[resultId] || "" },
      })

      if (!response.ok) {
        throw new Error("Error al validar el resultado")
      }

      const updatedResult: Result = await response.json()

      setResults((prev) => prev.map((r) => (r.id === resultId ? updatedResult : r)))
      setGroupedResults((prev) =>
        prev.map((group) => ({
          ...group,
          results: group.results.map((r) => (r.id === resultId ? updatedResult : r)),
        })),
      )

      toast.success("Resultado validado correctamente")

      if (isLast) {
        setShowConfirmModal(true)
      }
    } catch (err) {
      console.error("Error validating result:", err)
      toast.error("Error al validar el resultado")
    } finally {
      setValidatingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(resultId)
        return newSet
      })
    }
  }

  const handleRejectResult = async (resultId: number) => {
    try {
      setRejectingIds((prev) => new Set(prev).add(resultId))

      const response = await apiRequest(RESULTS_ENDPOINTS.VALIDATE(resultId), {
        method: "POST",
        body: { is_valid: false, notes: validationNotes[resultId] || "" },
      })

      if (!response.ok) {
        throw new Error("Error al rechazar el resultado")
      }

      const updatedResult: Result = await response.json()

      setResults((prev) => prev.map((r) => (r.id === resultId ? updatedResult : r)))
      setGroupedResults((prev) =>
        prev.map((group) => ({
          ...group,
          results: group.results.map((r) => (r.id === resultId ? updatedResult : r)),
        })),
      )

      toast.success("Resultado marcado como incorrecto")
    } catch (err) {
      console.error("Error rejecting result:", err)
      toast.error("Error al rechazar el resultado")
    } finally {
      setRejectingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(resultId)
        return newSet
      })
    }
  }

  const handleToggleValidation = async (resultId: number, currentIsValid: boolean) => {
    try {
      setTogglingIds((prev) => new Set(prev).add(resultId))

      const response = await apiRequest(RESULTS_ENDPOINTS.VALIDATE(resultId), {
        method: "POST",
        body: { is_valid: !currentIsValid },
      })

      if (!response.ok) {
        throw new Error("Error al cambiar el estado de validación")
      }

      const updatedResult: Result = await response.json()

      setResults((prev) => prev.map((r) => (r.id === resultId ? updatedResult : r)))
      setGroupedResults((prev) =>
        prev.map((group) => ({
          ...group,
          results: group.results.map((r) => (r.id === resultId ? updatedResult : r)),
        })),
      )

      toast.success("Estado de validación actualizado")
    } catch (err) {
      console.error("Error toggling validation:", err)
      toast.error("Error al cambiar el estado de validación")
    } finally {
      setTogglingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(resultId)
        return newSet
      })
    }
  }

  const handleConfirmComplete = () => {
    setShowConfirmModal(false)
    onProtocolValidated(protocol.id)
    toast.success("Protocolo completamente validado")
  }

  const handleContinueEditing = () => {
    setShowConfirmModal(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#204983]" />
      </div>
    )
  }

  if (groupedResults.length === 0) {
    return <p className="text-center text-gray-500 py-4">No hay resultados cargados para validar.</p>
  }

  return (
    <>
      <Accordion type="multiple" value={expandedAnalysis} onValueChange={setExpandedAnalysis} className="space-y-3">
        {groupedResults.map((group) => (
          <AccordionItem
            key={group.analysisId}
            value={group.analysisId.toString()}
            className="border rounded-lg bg-white relative"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Beaker className="h-5 w-5 text-[#204983]" />
                <span className="font-semibold text-gray-900">{group.analysisName}</span>
                <Badge variant="outline" className="text-xs">
                  {group.results.length} determinaciones
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {group.results.map((result) => {
                  const validationStatus = getValidationStatus(result)
                  const isValidating = validatingIds.has(result.id)
                  const isRejecting = rejectingIds.has(result.id)
                  const isToggling = togglingIds.has(result.id)
                  const prevResults = previousResults[result.id] || []
                  const isLoadingHistory = loadingPrevious.has(result.id)
                  const isHistoryExpanded = expandedHistory.has(result.id)

                  return (
                    <div
                      key={result.id}
                      className={`relative p-4 border rounded-lg shadow-sm ${
                        validationStatus === "wrong"
                          ? "border-red-300 bg-red-50"
                          : validationStatus === "valid"
                            ? "border-green-300 bg-green-50"
                            : "border-blue-300 bg-white"
                      }`}
                      onMouseEnter={() => handleDeterminationHover(result.id, result.determination.id)}
                      onMouseLeave={(e) => handleDeterminationLeave(e, result.id)}
                    >
                      {validationStatus !== "pending" && (
                        <div className="absolute top-4 right-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent"
                            onClick={() => handleToggleValidation(result.id, result.is_valid)}
                            disabled={isToggling}
                          >
                            {isToggling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cambiar"}
                          </Button>
                        </div>
                      )}

                      {validationStatus === "pending" && (
                        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleValidateResult(result.id)}
                              disabled={isValidating || isRejecting || isToggling}
                            >
                              {isValidating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Validar
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                              onClick={() => handleRejectResult(result.id)}
                              disabled={isValidating || isRejecting || isToggling}
                            >
                              {isRejecting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rechazar
                                </>
                              )}
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Notas (opcional)"
                            className="text-sm resize-none w-64"
                            rows={2}
                            value={validationNotes[result.id] || ""}
                            onChange={(e) => setValidationNotes((prev) => ({ ...prev, [result.id]: e.target.value }))}
                          />
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-72">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{result.determination.name}</h4>
                            {validationStatus === "valid" && (
                              <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Validado
                              </Badge>
                            )}
                            {validationStatus === "wrong" && (
                              <Badge variant="outline" className="bg-red-50 border-red-300 text-red-700 text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Requiere revisión
                              </Badge>
                            )}
                            {validationStatus === "pending" && (
                              <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 text-xs">
                                Pendiente
                              </Badge>
                            )}
                          </div>
                          <p className="text-lg text-[#204983] font-medium mt-1">
                            {result.value || "Sin valor"} {result.determination.measure_unit}
                          </p>
                        </div>

                        {validationStatus === "valid" && result.validated_by && (
                          <div className="text-xs text-gray-500">
                            Validado por: {result.validated_by.first_name} {result.validated_by.last_name}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-500 hover:text-[#204983] mb-3"
                        onClick={() => {
                          toggleHistory(result.id)
                          if (!previousResults[result.id]) {
                            loadPreviousResults(result.id, result.determination.id)
                          }
                        }}
                      >
                        <History className="h-3 w-3 mr-1" />
                        Historial
                        {isHistoryExpanded ? (
                          <ChevronUp className="h-3 w-3 ml-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-1" />
                        )}
                      </Button>

                      {/* Panel de historial */}
                      {isHistoryExpanded && (
                        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Resultados Previos del Paciente
                          </h4>
                          {isLoadingHistory ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Cargando historial...</span>
                            </div>
                          ) : prevResults.length === 0 ? (
                            <p className="text-sm text-gray-500">No hay resultados previos para esta determinación.</p>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {prevResults.map((prev, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg font-semibold text-[#204983]">{prev.value}</span>
                                    <span className="text-xs text-gray-500">{prev.determination?.measure_unit}</span>
                                    {(prev as any).date && (
                                      <span className="text-xs text-gray-400">
                                        {new Date((prev as any).date).toLocaleDateString("es-AR", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {prev.is_valid ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-50 border-green-300 text-green-700 text-xs"
                                      >
                                        Validado
                                      </Badge>
                                    ) : prev.is_wrong ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-red-50 border-red-300 text-red-700 text-xs"
                                      >
                                        No válido
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-50 border-amber-300 text-amber-700 text-xs"
                                      >
                                        Pendiente
                                      </Badge>
                                    )}
                                    {prev.validated_by && (
                                      <span className="text-xs text-gray-400">
                                        por {prev.validated_by.first_name} {prev.validated_by.last_name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mostrar notas si ya existen */}
                      {result.notes && validationStatus !== "pending" && (
                        <p className="text-sm text-gray-600 mt-2 italic">Notas: {result.notes}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Modal de confirmación */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validación Completada</DialogTitle>
            <DialogDescription>
              Has validado todos los resultados de este protocolo. ¿Deseas realizar algún cambio adicional o finalizar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleContinueEditing}>
              Seguir editando
            </Button>
            <Button className="bg-[#204983] hover:bg-[#204983]/90" onClick={handleConfirmComplete}>
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
