"use client"

import { X, History, Calendar } from "lucide-react"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"

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

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  previousResults: PreviousResult[]
  measureUnit: string
  analysisName: string
}

export function HistoryPanel({ isOpen, onClose, previousResults, measureUnit, analysisName }: HistoryPanelProps) {
  if (!isOpen) return null

  const sortedResults = [...previousResults].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
      <div className="bg-[#204983] text-white p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 sm:h-5 sm:w-5" />
          <h3 className="font-semibold text-sm sm:text-base">Historial</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full h-7 w-7 sm:h-8 sm:w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Analysis Name */}
      <div className="p-2 sm:p-3 bg-gray-50 border-b border-gray-200">
        <p className="text-xs font-medium text-gray-600">Análisis</p>
        <p className="text-xs sm:text-sm font-semibold text-[#204983] line-clamp-2">{analysisName}</p>
      </div>

      {/* Results List */}
      <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
        {sortedResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-gray-500">
            <History className="h-8 w-8 sm:h-10 sm:w-10 mb-2 text-gray-300" />
            <p className="text-xs">No hay resultados anteriores</p>
          </div>
        ) : (
          sortedResults.map((result, index) => (
            <div
              key={`${result.protocol_id}-${index}`}
              className="p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4 border-l-[#204983]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-3">
                <Badge variant="outline" className="bg-gray-50 text-xs font-medium w-fit">
                  Protocolo #{result.protocol_id}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(result.created_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-100">
                <p className="text-xl sm:text-2xl font-bold text-[#204983]">
                  {result.value} <span className="text-xs sm:text-sm font-normal text-gray-600">{measureUnit}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                  <AvatarImage src={result.created_by.photo || undefined} alt={result.created_by.username} />
                  <AvatarFallback className="text-xs bg-slate-200 text-slate-700">
                    {result.created_by.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <span className="font-medium">Cargado por:</span>
                  <span className="truncate max-w-[120px] sm:max-w-none">{result.created_by.username}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
