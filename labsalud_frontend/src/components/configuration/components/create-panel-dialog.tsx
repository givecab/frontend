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

interface CreatePanelDialogProps {
  open: boolean // Cambiado de isOpen a open
  onOpenChange: (open: boolean) => void // Cambiado de onClose a onOpenChange
  onSuccess: (newPanel: AnalysisPanel) => void
}

export const CreatePanelDialog: React.FC<CreatePanelDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const { apiRequest } = useApi()
  const toastActions = useToast() // Cambiado a toastActions
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [bioUnit, setBioUnit] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      // Usar 'open'
      // Reset form
      setCode("")
      setName("")
      setBioUnit("")
      setIsUrgent(false)
      setIsActive(true)
      setErrors({})
      setIsLoading(false)
    }
  }, [open]) // Dependencia 'open'

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
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const panelData = {
        code: Number.parseInt(code, 10),
        name,
        bio_unit: bioUnit,
        is_urgent: isUrgent,
        is_active: isActive,
      }
      const response = await apiRequest(import.meta.env.VITE_API_BASE_URL + "/analysis/panels/", {
        method: "POST",
        body: panelData,
      })

      if (response.ok) {
        const newPanel = await response.json()
        toastActions.success("Éxito", { description: "Panel creado correctamente." })
        onSuccess(newPanel)
        onOpenChange(false) // Usar onOpenChange
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" })) // Manejo de error si no es JSON
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
          setErrors({ form: backendErrors || "Error al crear el panel." })
        }
        toastActions.error("Error", { description: "No se pudo crear el panel." })
      }
    } catch (error) {
      console.error("Error creating panel:", error)
      setErrors({ form: "Ocurrió un error de red o servidor." })
      toastActions.error("Error", { description: "Ocurrió un error inesperado." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {" "}
      {/* Usar 'open' y 'onOpenChange' */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Panel de Análisis</DialogTitle>
          <DialogDescription>Completa los datos para el nuevo panel.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {errors.form && <p className="text-sm text-red-500 col-span-2">{errors.form}</p>}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Código
            </Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} className="col-span-3" />
            {errors.code && <p className="text-sm text-red-500 col-span-4 col-start-2">{errors.code}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            {errors.name && <p className="text-sm text-red-500 col-span-4 col-start-2">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bioUnit" className="text-right">
              Unidad Bioq.
            </Label>
            <Input id="bioUnit" value={bioUnit} onChange={(e) => setBioUnit(e.target.value)} className="col-span-3" />
            {errors.bioUnit && <p className="text-sm text-red-500 col-span-4 col-start-2">{errors.bioUnit}</p>}
          </div>
          <div className="flex items-center space-x-2 col-span-4 justify-end">
            <Label htmlFor="isUrgent">Urgente</Label>
            <Switch id="isUrgent" checked={isUrgent} onCheckedChange={setIsUrgent} />
          </div>
          <div className="flex items-center space-x-2 col-span-4 justify-end">
            <Label htmlFor="isActive">Activo</Label>
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              {" "}
              {/* Usar onOpenChange */}
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
            Crear Panel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
