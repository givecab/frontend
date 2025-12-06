"use client"

import { Loader2, Edit, Save } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../ui/dialog"
import { Button } from "../../../ui/button"
import { Input } from "../../../ui/input"
import { Label } from "../../../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select"
import type { SendMethod } from "@/types"

interface EditFormData {
  send_method: string
  affiliate_number: string
}

interface EditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocolId: number
  formData: EditFormData
  onFormDataChange: (data: EditFormData) => void
  sendMethods: SendMethod[]
  onSave: () => void
  isSaving: boolean
  insuranceId?: number
}

export function EditDialog({
  open,
  onOpenChange,
  protocolId,
  formData,
  onFormDataChange,
  sendMethods,
  onSave,
  isSaving,
  insuranceId,
}: EditDialogProps) {
  const isParticular = insuranceId === 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* // Improved responsive width */}
      <DialogContent className="w-[95vw] max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-[#204983]" />
            Editar Protocolo #{protocolId}
          </DialogTitle>
          <DialogDescription>Modifique los campos que desee actualizar.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-send-method">Método de Envío</Label>
            <Select
              value={formData.send_method}
              onValueChange={(value) => onFormDataChange({ ...formData, send_method: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                {sendMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id.toString()}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isParticular && (
            <div className="grid gap-2">
              <Label htmlFor="edit-affiliate-number">Número de Afiliado</Label>
              <Input
                id="edit-affiliate-number"
                value={formData.affiliate_number}
                onChange={(e) => onFormDataChange({ ...formData, affiliate_number: e.target.value })}
                placeholder="Número de afiliado (opcional)"
              />
            </div>
          )}
        </div>
        {/* // Responsive footer buttons */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={isSaving} className="bg-[#204983] hover:bg-[#1a3a6a] w-full sm:w-auto">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
