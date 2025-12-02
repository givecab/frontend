import { Loader2, History } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../ui/dialog"
import { HistoryList } from "@/components/common/history-list"
import type { HistoryEntry } from "@/types"

interface AuditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocolId: number
  history?: HistoryEntry[]
  totalChanges?: number
  isLoading: boolean
}

export function AuditDialog({ open, onOpenChange, protocolId, history, totalChanges, isLoading }: AuditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#204983]" />
            Historial de Auditoría - Protocolo #{protocolId}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Total de cambios: {totalChanges || history.length}</span>
              </div>
              <HistoryList history={history} emptyMessage="No hay historial disponible para este protocolo" />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay historial disponible para este protocolo
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
