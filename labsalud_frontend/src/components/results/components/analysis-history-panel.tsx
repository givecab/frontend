"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { ScrollArea } from "../../ui/scroll-area"
import { Separator } from "../../ui/separator"
import {
  History,
  Calendar,
  TestTube2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  User,
  FileText,
  AlertCircle,
  X,
} from "lucide-react"
import { useApi } from "../../../hooks/use-api"
import { ANALYSIS_ENDPOINTS } from "../../../config/api"
import { Button } from "../../ui/button"

interface HistoricalResult {
  id: number
  value: string
  is_abnormal: boolean
  note: string
  validated_at: string | null
  validated_by: {
    id: number
    username: string
  } | null
  created_at: string
  protocol: {
    id: number
    created_at: string
    medico: {
      first_name: string
      last_name: string
    }
    ooss: {
      name: string
    }
  }
}

interface AnalysisHistoryPanelProps {
  patientId: number
  analysisId: number
  analysisName: string
  measureUnit: string
  isOpen: boolean
  onClose: () => void
}

export function AnalysisHistoryPanel({
  patientId,
  analysisId,
  analysisName,
  measureUnit,
  isOpen,
  onClose,
}: AnalysisHistoryPanelProps) {
  const { apiRequest } = useApi()
  const [historicalResults, setHistoricalResults] = useState<HistoricalResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchHistoricalResults = async () => {
    if (!patientId || !analysisId) return

    setIsLoading(true)
    try {
      // Buscar todos los resultados de este análisis para este paciente
      const params = new URLSearchParams()
      params.append("protocol_analysis__protocol__patient", patientId.toString())
      params.append("protocol_analysis__analysis", analysisId.toString())
      params.append("ordering", "-created_at") // Más recientes primero

      const response = await apiRequest(`${ANALYSIS_ENDPOINTS.RESULTS}?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()

        // Enriquecer los resultados con información del protocolo
        const enrichedResults: HistoricalResult[] = []

        for (const result of data.results || []) {
          try {
            // Obtener información del protocol_analysis
            const paResponse = await apiRequest(`${ANALYSIS_ENDPOINTS.PROTOCOL_ANALYSES}${result.protocol_analysis}/`)
            if (paResponse.ok) {
              const paData = await paResponse.json()

              // Obtener información del protocolo
              const protocolResponse = await apiRequest(`${ANALYSIS_ENDPOINTS.PROTOCOLS}${paData.protocol}/`)
              if (protocolResponse.ok) {
                const protocolData = await protocolResponse.json()

                enrichedResults.push({
                  ...result,
                  protocol: {
                    id: protocolData.id,
                    created_at: protocolData.created_at,
                    medico: protocolData.medico,
                    ooss: protocolData.ooss,
                  },
                })
              }
            }
          } catch (error) {
            console.error("Error enriching result:", error)
          }
        }

        setHistoricalResults(enrichedResults)
      }
    } catch (error) {
      console.error("Error fetching historical results:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrendIcon = (currentValue: string, previousValue: string) => {
    const current = Number.parseFloat(currentValue)
    const previous = Number.parseFloat(previousValue)

    if (isNaN(current) || isNaN(previous)) return <Minus className="h-3 w-3 text-gray-400" />

    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-600" />
    if (current < previous) return <TrendingDown className="h-3 w-3 text-red-600" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  useEffect(() => {
    if (isOpen) {
      fetchHistoricalResults()
    }
  }, [isOpen, patientId, analysisId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#204983]" />
            <h3 className="font-semibold text-gray-900">Historial de Resultados</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2">
          <p className="font-medium text-gray-800">{analysisName}</p>
          <p className="text-sm text-gray-600">Unidad: {measureUnit}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#204983] mb-4"></div>
                <p className="text-gray-600">Cargando historial...</p>
              </div>
            ) : historicalResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <TestTube2 className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-600 text-center">No hay resultados anteriores</p>
                <p className="text-gray-500 text-sm text-center">Este es el primer resultado para este análisis</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">Resultados Anteriores</h4>
                  <Badge variant="outline" className="text-[#204983] border-[#204983]/30">
                    {historicalResults.length} resultado{historicalResults.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {historicalResults.map((result, index) => (
                    <Card key={result.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header con fecha y tendencia */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(result.created_at).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                              {index < historicalResults.length - 1 && (
                                <div className="flex items-center gap-1">
                                  {getTrendIcon(result.value, historicalResults[index + 1].value)}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {result.validated_at ? (
                                <Badge variant="default" className="bg-green-600 text-white text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Validado
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-orange-50 border-orange-300 text-orange-700"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Sin Validar
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Valor del resultado */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TestTube2 className="h-4 w-4 text-[#204983]" />
                              <span className="text-lg font-bold text-gray-900">
                                {result.value} {measureUnit}
                              </span>
                            </div>
                            <Badge
                              variant={result.is_abnormal ? "destructive" : "default"}
                              className={result.is_abnormal ? "" : "bg-green-100 text-green-800"}
                            >
                              {result.is_abnormal ? (
                                <>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Anormal
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Normal
                                </>
                              )}
                            </Badge>
                          </div>

                          {/* Información del protocolo */}
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>Protocolo #{result.protocol.id}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>
                                Dr. {result.protocol.medico.first_name} {result.protocol.medico.last_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>OOSS: {result.protocol.ooss.name}</span>
                            </div>
                          </div>

                          {/* Notas si existen */}
                          {result.note && (
                            <>
                              <Separator />
                              <div>
                                <p className="text-xs font-medium text-gray-700 mb-1">Notas:</p>
                                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{result.note}</p>
                              </div>
                            </>
                          )}

                          {/* Información de validación */}
                          {result.validated_at && result.validated_by && (
                            <>
                              <Separator />
                              <div className="text-xs text-gray-500">
                                <p>
                                  Validado por {result.validated_by.username} el{" "}
                                  {new Date(result.validated_at).toLocaleDateString("es-ES", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
