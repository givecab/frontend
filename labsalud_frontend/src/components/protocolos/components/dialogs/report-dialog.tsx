"use client"

import { Loader2, FileText, Printer, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../ui/dialog"
import { Button } from "../../../ui/button"
import { Label } from "../../../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select"

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocolId: number
  reportType: "full" | "summary"
  onReportTypeChange: (type: "full" | "summary") => void
  onGenerateReport: () => void
  onSendEmail: () => void
  isGenerating: boolean
  isSending: boolean
}

export function ReportDialog({
  open,
  onOpenChange,
  protocolId,
  reportType,
  onReportTypeChange,
  onGenerateReport,
  onSendEmail,
  isGenerating,
  isSending,
}: ReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* // Improved responsive width */}
      <DialogContent className="w-[95vw] max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Reportes - Protocolo #{protocolId}
          </DialogTitle>
          <DialogDescription>Genere un reporte PDF o envíelo por email al paciente.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Tipo de Reporte</Label>
            <Select value={reportType} onValueChange={onReportTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Completo</SelectItem>
                <SelectItem value="summary">Resumen</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {reportType === "full"
                ? "Incluye todos los análisis y resultados detallados"
                : "Incluye solo un resumen de los análisis"}
            </p>
          </div>
        </div>
        {/* // Responsive footer with stacked buttons on mobile */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto order-3 sm:order-1">
            Cancelar
          </Button>
          <Button
            onClick={onGenerateReport}
            disabled={isGenerating}
            variant="outline"
            className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white bg-transparent w-full sm:w-auto order-1 sm:order-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Reporte
              </>
            )}
          </Button>
          <Button
            onClick={onSendEmail}
            disabled={isSending}
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto order-2 sm:order-3"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar por Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
