"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HistoryList } from "@/components/common/history-list"
import { Loader2, History } from "lucide-react"
import { useEffect, useState } from "react"
import { useApi } from "@/hooks/use-api"
import { PROTOCOL_ENDPOINTS } from "@/config/api"
import type { HistoryEntry } from "@/types"

interface ProtocolHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocolId: number
  protocolNumber: number
  history?: HistoryEntry[]
  totalChanges?: number
  isLoading?: boolean
}

export function ProtocolHistoryDialog({
  open,
  onOpenChange,
  protocolId,
  protocolNumber,
  history: preloadedHistory,
  totalChanges: preloadedTotalChanges,
  isLoading: preloadedIsLoading,
}: ProtocolHistoryDialogProps) {
  const { apiRequest } = useApi()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [totalChanges, setTotalChanges] = useState(0)
  const [loading, setLoading] = useState(false)

  const displayHistory = preloadedHistory ?? history
  const displayTotalChanges = preloadedTotalChanges ?? totalChanges
  const displayLoading = preloadedIsLoading ?? loading

  useEffect(() => {
    if (open && protocolId && !preloadedHistory) {
      loadHistory()
    }
  }, [open, protocolId, preloadedHistory])

  const loadHistory = async () => {
    if (!protocolId) return

    setLoading(true)
    try {
      const response = await apiRequest(PROTOCOL_ENDPOINTS.PROTOCOL_DETAIL(protocolId))
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
        setTotalChanges(data.total_changes || 0)
      }
    } catch (error) {
      console.error("Error al cargar historial:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* // Mejor responsive */}
      <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <History className="h-5 w-5 text-[#204983] flex-shrink-0" />
            <span>Historial de Cambios - Protocolo #{protocolNumber}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {displayLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {displayTotalChanges > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Total de cambios: {displayTotalChanges}</span>
                </div>
              )}
              <HistoryList history={displayHistory} emptyMessage="No hay historial disponible para este protocolo" />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
