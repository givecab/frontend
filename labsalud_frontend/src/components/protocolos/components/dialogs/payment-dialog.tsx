"use client"

import { Loader2, DollarSign } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../ui/dialog"
import { Button } from "../../../ui/button"
import { Input } from "../../../ui/input"
import { Label } from "../../../ui/label"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocolId: number
  balance: number
  valuePaid: string
  paymentAmount: string
  onPaymentAmountChange: (value: string) => void
  onConfirm: () => void
  isProcessing: boolean
}

export function PaymentDialog({
  open,
  onOpenChange,
  protocolId,
  balance,
  valuePaid,
  paymentAmount,
  onPaymentAmountChange,
  onConfirm,
  isProcessing,
}: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* // Improved responsive width */}
      <DialogContent className="w-[95vw] max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Registrar Pago - Protocolo #{protocolId}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Balance pendiente:</span>
              <span className="font-semibold text-red-600">${Math.abs(balance).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ya pagado:</span>
              <span className="font-semibold text-green-600">${Number.parseFloat(valuePaid || "0").toFixed(2)}</span>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payment-amount">Monto a pagar</Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={Math.abs(balance)}
              placeholder={`Máximo: $${Math.abs(balance).toFixed(2)}`}
              value={paymentAmount}
              onChange={(e) => onPaymentAmountChange(e.target.value)}
            />
            <p className="text-xs text-gray-500">Ingrese un monto entre $0.01 y ${Math.abs(balance).toFixed(2)}</p>
          </div>
        </div>
        {/* // Responsive footer buttons */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isProcessing || !paymentAmount}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Confirmar Pago
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
