"use client"

import { Badge } from "../../ui/badge"
import { History, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"

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

interface AnalysisHistoryProps {
  analysisName: string
  measureUnit: string
  history: HistoricalResult[]
  isLoading: boolean
}

export function AnalysisHistory({ analysisName, measureUnit, history, isLoading }: AnalysisHistoryProps) {
  const getTrendIndicator = (currentValue: string, previousValue: string) => {
    const current = Number.parseFloat(currentValue)
    const previous = Number.parseFloat(previousValue)

    if (isNaN(current) || isNaN(previous)) return null

    if (current > previous) {
      return <TrendingUp className="h-3 w-3 text-red-500" />
    } else if (current < previous) {
      return <TrendingDown className="h-3 w-3 text-green-500" />
    } else {
      return <Minus className="h-3 w-3 text-gray-500" />
    }
  }

  return (
    <div className="border-t pt-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-[#204983]" />
        <h6 className="font-medium text-gray-800">Historial de {analysisName}</h6>
        <Badge variant="outline" className="text-xs">
          {history.length} resultados anteriores
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-[#204983]" />
        </div>
      ) : history.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
          {history.slice(0, 6).map((histResult, index) => {
            const previousResult = history[index + 1]
            const trend = previousResult ? getTrendIndicator(histResult.value, previousResult.value) : null

            return (
              <div key={histResult.id} className="bg-white border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 flex items-center gap-1">
                    {histResult.value} {measureUnit}
                    {trend}
                  </span>
                  <Badge variant={histResult.is_abnormal ? "destructive" : "default"} className="text-xs">
                    {histResult.is_abnormal ? "Anormal" : "Normal"}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mb-1">{new Date(histResult.created_at).toLocaleDateString()}</div>
                {histResult.validated_at && (
                  <Badge variant="outline" className="text-xs bg-green-50 border-green-300 text-green-700">
                    Validado
                  </Badge>
                )}
                {histResult.note && (
                  <p className="text-xs text-gray-600 mt-1 truncate" title={histResult.note}>
                    {histResult.note}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">No hay resultados anteriores para este análisis</div>
      )}
    </div>
  )
}
