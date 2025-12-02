import { Loader2, TestTube } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../ui/dialog"
import { Badge } from "../../../ui/badge"
import { Switch } from "../../../ui/switch"
import type { ProtocolDetail } from "@/types"

interface AnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocolId: number
  details: ProtocolDetail[]
  isLoading: boolean
  updatingDetailId: number | null
  onToggleAuthorization: (detail: ProtocolDetail) => void
  isEditable?: boolean
  insuranceId?: number
}

export function AnalysisDialog({
  open,
  onOpenChange,
  protocolId,
  details,
  isLoading,
  updatingDetailId,
  onToggleAuthorization,
  isEditable = true,
  insuranceId,
}: AnalysisDialogProps) {
  const isParticular = insuranceId === 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-[#204983]" />
            Análisis del Protocolo #{protocolId}
          </DialogTitle>
          <DialogDescription>
            {isEditable && !isParticular
              ? "Puede cambiar la autorización de cada análisis. Esto puede afectar el costo total del protocolo."
              : isParticular
                ? "Vista de análisis. Los análisis particulares no requieren autorización."
                : "Vista de solo lectura. El protocolo está completado o cancelado."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : details.length > 0 ? (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Análisis</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UB</th>
                    {!isParticular && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Autorizado</th>
                    )}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Urgente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {details.map((detail) => (
                    <tr key={detail.id} className={!detail.is_active ? "bg-gray-100 opacity-60" : ""}>
                      <td className="px-4 py-3 text-sm font-mono">{detail.code}</td>
                      <td className="px-4 py-3 text-sm">{detail.name}</td>
                      <td className="px-4 py-3 text-sm">{detail.ub}</td>
                      {!isParticular && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={detail.is_authorized}
                              onCheckedChange={() => onToggleAuthorization(detail)}
                              disabled={!isEditable || updatingDetailId === detail.id || !detail.is_active}
                            />
                            {updatingDetailId === detail.id && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        {detail.is_urgent && (
                          <Badge variant="destructive" className="text-xs">
                            Urgente
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-sm text-gray-500 text-right">Total: {details.length} análisis</div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No hay análisis disponibles para este protocolo</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
