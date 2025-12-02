"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HistoryList } from "@/components/common/history-list"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useApi } from "@/hooks/use-api"
import { CATALOG_ENDPOINTS } from "@/config/api"
import type { HistoryEntry } from "@/types"

interface AnalysisHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysisId: number | null
  analysisName: string
}

export function AnalysisHistoryDialog({ open, onOpenChange, analysisId, analysisName }: AnalysisHistoryDialogProps) {
  const { apiRequest } = useApi()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [totalChanges, setTotalChanges] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && analysisId) {
      loadHistory()
    }
  }, [open, analysisId])

  const loadHistory = async () => {
    if (!analysisId) return

    setLoading(true)
    try {
      const response = await apiRequest(CATALOG_ENDPOINTS.ANALYSIS_DETAIL(analysisId))
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
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Historial de Cambios - {analysisName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <HistoryList history={history} totalChanges={totalChanges} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
