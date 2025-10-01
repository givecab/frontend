"use client"

import { useState, useEffect } from "react"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { ANALYSIS_ENDPOINTS } from "@/config/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ProtocolSummary } from "@/types"

interface ValidationResult {
  result_id: number
  protocol_analysis_id: number
  analysis_id: number
  analysis_name: string
  analysis_measure_unit: string
  panel_id: number
  panel_name: string
  value: string
  created_at: string
  created_by: {
    username: string
    photo: string | null
  }
  is_abnormal: boolean
  notes: string
  is_valid?: boolean // Optional - only present when validated
  validated_at?: string | null
  validated_by?: {
    username: string
    photo: string | null
  } | null
  resultados_previos?: Array<{
    result_id: number
    protocol_id: number
    value: string
    created_at: string
    created_by: {
      username: string
      photo: string | null
    }
  }>
}

interface ValidationData {
  protocol_id: number
  patient_name: string
  patient_id: number
  results: ValidationResult[]
}

interface ValidationProtocolCardProps {
  protocol: ProtocolSummary
  onProtocolValidated: (protocolId: number) => void
}

export function ValidationProtocolCard({ protocol, onProtocolValidated }: ValidationProtocolCardProps) {
  const { apiRequest } = useApi()
  const [validationData, setValidationData] = useState<ValidationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [validatingResults, setValidatingResults] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadValidationData()
  }, [])

  const loadValidationData = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest(ANALYSIS_ENDPOINTS.PROTOCOL_VALIDATION_RESULTS(protocol.id))

      if (!response.ok) {
        throw new Error("Error al cargar los resultados")
      }

      const data: ValidationData = await response.json()
      setValidationData(data)
    } catch (err) {
      console.error("Error loading validation data:", err)
      toast.error("Error al cargar los resultados del protocolo")
    } finally {
      setIsLoading(false)
    }
  }

  const areAllResultsValidated = (results: ValidationResult[]) => {
    return results.every((r) => r.is_valid !== undefined)
  }

  const hasPendingResults = (results: ValidationResult[]) => {
    return results.some((r) => r.is_valid === undefined)
  }

  const handleValidate = async (resultId: number, isValid: boolean) => {
    if (!validationData) return

    try {
      setValidatingResults((prev) => new Set(prev).add(resultId))

      const response = await apiRequest(ANALYSIS_ENDPOINTS.VALIDATE_RESULT(resultId), {
        method: "POST",
        body: { is_valid: isValid },
      })

      if (!response.ok) {
        throw new Error("Error al validar el resultado")
      }

      toast.success(isValid ? "Resultado validado correctamente" : "Resultado marcado como no válido")

      await loadValidationData()

      const updatedResponse = await apiRequest(ANALYSIS_ENDPOINTS.PROTOCOL_VALIDATION_RESULTS(protocol.id))
      if (updatedResponse.ok) {
        const updatedData: ValidationData = await updatedResponse.json()

        if (areAllResultsValidated(updatedData.results)) {
          setTimeout(() => {
            onProtocolValidated(protocol.id)
            toast.success("Protocolo completamente validado")
          }, 1500)
        }
      }
    } catch (err) {
      console.error("Error validating result:", err)
      toast.error("Error al validar el resultado")
    } finally {
      setValidatingResults((prev) => {
        const newSet = new Set(prev)
        newSet.delete(resultId)
        return newSet
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const canChangeValidation = validationData ? hasPendingResults(validationData.results) : false

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#204983]" />
      </div>
    )
  }

  if (!validationData) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>No hay análisis disponibles para este protocolo</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!canChangeValidation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800 font-medium">
            ✓ Todos los resultados han sido validados. El protocolo se actualizará automáticamente.
          </p>
        </div>
      )}

      {validationData.results.map((result) => (
        <div key={result.result_id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900">{result.analysis_name}</h4>
              <p className="text-lg text-[#204983] font-medium mt-1">
                {result.value} {result.analysis_measure_unit}
              </p>
              <p className="text-xs text-gray-500 mt-1">{result.panel_name}</p>
            </div>
            <div className="flex items-center gap-2">
              {result.is_valid === undefined ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleValidate(result.result_id, true)}
                    disabled={validatingResults.has(result.result_id)}
                    className="border-green-500 text-green-600 hover:bg-green-50"
                  >
                    {validatingResults.has(result.result_id) ? (
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
                    onClick={() => handleValidate(result.result_id, false)}
                    disabled={validatingResults.has(result.result_id)}
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    {validatingResults.has(result.result_id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 ${result.is_valid ? "text-green-600" : "text-red-600"}`}>
                    {result.is_valid ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Validado</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">No válido</span>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleValidate(result.result_id, !result.is_valid)}
                    disabled={validatingResults.has(result.result_id)}
                    className="text-xs h-8 border-gray-300 hover:bg-gray-50"
                  >
                    {validatingResults.has(result.result_id) ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cambiar"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={result.created_by.photo || undefined} />
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                  {getInitials(result.created_by.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-gray-500">Cargado por</p>
                <p className="font-medium text-gray-900">{result.created_by.username}</p>
              </div>
            </div>

            {result.validated_by && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={result.validated_by.photo || undefined} />
                  <AvatarFallback className="text-xs bg-green-100 text-green-700">
                    {getInitials(result.validated_by.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-gray-500">Validado por</p>
                  <p className="font-medium text-gray-900">{result.validated_by.username}</p>
                </div>
              </div>
            )}
          </div>

          {result.resultados_previos && result.resultados_previos.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Resultados previos:</p>
              <div className="space-y-2">
                {result.resultados_previos.map((prev) => (
                  <div key={prev.result_id} className="text-sm bg-gray-50 rounded p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 font-medium">{prev.value}</span>
                      <span className="text-gray-500">{formatDate(prev.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={prev.created_by.photo || undefined} />
                        <AvatarFallback className="text-[10px] bg-gray-200 text-gray-600">
                          {getInitials(prev.created_by.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-600">{prev.created_by.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Notas:</p>
              <p className="text-sm text-gray-600">{result.notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
