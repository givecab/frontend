"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import type { AnalysisPanel } from "../configuration-page"

interface EditPanelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (updatedPanel: AnalysisPanel) => void
  panel: AnalysisPanel
}

export const EditPanelDialog: React.FC<EditPanelDialogProps> = ({ open, onOpenChange, onSuccess, panel }) => {
  const { apiRequest } = useApi()
  const toastActions = useToast()
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [bioUnit, setBioUnit] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (panel && open) {
      setCode(panel.code.toString())
      setName(panel.name)
      setBioUnit(panel.bio_unit)
      setIsUrgent(panel.is_urgent)
      setErrors({})
    }
  }, [panel, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "El nombre es requerido."
    if (!code.trim()) newErrors.code = "El código es requerido."
    else if (isNaN(Number(code))) newErrors.code = "El código debe ser numérico."
    if (!bioUnit.trim()) newErrors.bioUnit = "La unidad bioquímica es requerida."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!panel || !validateForm()) return

    setIsLoading(true)
    try {
      const panelUpdateData: Partial<AnalysisPanel> = {}
      if (Number.parseInt(code, 10) !== panel.code) panelUpdateData.code = Number.parseInt(code, 10)
      if (name !== panel.name) panelUpdateData.name = name
      if (bioUnit !== panel.bio_unit) panelUpdateData.bio_unit = bioUnit
      if (isUrgent !== panel.is_urgent) panelUpdateData.is_urgent = isUrgent

      if (Object.keys(panelUpdateData).length === 0) {
        toastActions.info("Sin cambios", { description: "No se realizaron modificaciones." })
        onOpenChange(false)
        return
      }

      const response = await apiRequest(import.meta.env.VITE_API_BASE_URL + "/api/analysis/panels/" + `${panel.id}/`, {
        method: "PATCH",
        body: panelUpdateData,
      })

      if (response.ok) {
        const updatedPanel = await response.json()
        toastActions.success("Éxito", { description: "Panel actualizado correctamente." })
        onSuccess(updatedPanel)
        onOpenChange(false)
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        const backendErrors = errorData.errors || errorData.detail || errorData
        if (typeof backendErrors === "object" && backendErrors !== null) {
          const formattedErrors: Record<string, string> = {}
          for (const key in backendErrors) {
            if (Array.isArray(backendErrors[key])) {
              formattedErrors[key] = backendErrors[key].join(", ")
            } else {
              formattedErrors[key] = backendErrors[key]
            }
          }
          setErrors(formattedErrors)
        } else {
          setErrors({ form: backendErrors || "Error al actualizar el panel." })
        }
        toastActions.error("Error", { description: "No se pudo actualizar el panel." })
      }
    } catch (error) {
      console.error("Error updating panel:", error)
      setErrors({ form: "Ocurrió un error de red o servidor." })
      toastActions.error("Error", { description: "Ocurrió un error inesperado." })
    } finally {
      setIsLoading(false)
    }
  }

  if (!panel) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Panel: {panel.name}</DialogTitle>
          <DialogDescription>Modifica los datos del panel.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{errors.form}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-code">Código *</Label>
            <Input
              id="edit-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ingrese el código numérico"
            />
            {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingrese el nombre del panel"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-bioUnit">Unidad Bioquímica *</Label>
            <Input
              id="edit-bioUnit"
              value={bioUnit}
              onChange={(e) => setBioUnit(e.target.value)}
              placeholder="Ingrese la unidad bioquímica"
            />
            {errors.bioUnit && <p className="text-sm text-red-500">{errors.bioUnit}</p>}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="edit-isUrgent" className="font-medium">
                Panel Urgente
              </Label>
              <p className="text-sm text-gray-500">Marcar si este panel es de carácter urgente</p>
            </div>
            <Switch id="edit-isUrgent" checked={isUrgent} onCheckedChange={setIsUrgent} />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            style={{ backgroundColor: "#204983", color: "white" }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
