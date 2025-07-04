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
import type { AnalysisItem } from "../configuration-page"

interface CreateAnalysisDialogProps {
  open: boolean // Cambiado de isOpen a open
  onOpenChange: (open: boolean) => void // Cambiado de onClose a onOpenChange
  onSuccess: (newAnalysis: AnalysisItem) => void
  panelId: number
}

export const CreateAnalysisDialog: React.FC<CreateAnalysisDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  panelId,
}) => {
  const { apiRequest } = useApi()
  const toastActions = useToast() // Corregido: usar el objeto devuelto directamente
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [measureUnit, setMeasureUnit] = useState("")
  const [formula, setFormula] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setCode("")
      setName("")
      setMeasureUnit("")
      setFormula("")
      setIsActive(true)
      setErrors({})
      setIsLoading(false)
    }
  }, [open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "El nombre es requerido."
    if (!code.trim()) newErrors.code = "El código es requerido."
    if (!measureUnit.trim()) newErrors.measureUnit = "La unidad de medida es requerida."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const analysisData = {
        panel: panelId,
        code,
        name,
        measure_unit: measureUnit,
        formula,
        is_active: isActive,
      }
      const response = await apiRequest(
        `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_ANALYSIS_ANALYSES_ENDPOINT}`,
        {
          method: "POST",
          body: analysisData,
        },
      )

      if (response.ok) {
        const newAnalysis = await response.json()
        toastActions.success("Éxito", { description: "Determinación creada correctamente." })
        onSuccess(newAnalysis)
        onOpenChange(false) // Cerrar el diálogo
      } else {
        const errorData = await response.json()
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
          setErrors({ form: String(backendErrors) || "Error al crear la determinación." })
        }
        toastActions.error("Error", { description: "No se pudo crear la determinación." })
      }
    } catch (error) {
      console.error("Error creating analysis:", error)
      setErrors({ form: "Ocurrió un error de red o servidor." })
      toastActions.error("Error", { description: "Ocurrió un error inesperado." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Determinación para Panel ID: {panelId}</DialogTitle>
          <DialogDescription>Completa los datos para la nueva determinación.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {errors.form && <p className="text-sm text-red-500 col-span-2">{errors.form}</p>}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="analysis-code" className="text-right">
              Código
            </Label>
            <Input id="analysis-code" value={code} onChange={(e) => setCode(e.target.value)} className="col-span-3" />
            {errors.code && <p className="text-sm text-red-500 col-span-4 col-start-2">{errors.code}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="analysis-name" className="text-right">
              Nombre
            </Label>
            <Input id="analysis-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            {errors.name && <p className="text-sm text-red-500 col-span-4 col-start-2">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="analysis-measureUnit" className="text-right">
              Unidad Med.
            </Label>
            <Input
              id="analysis-measureUnit"
              value={measureUnit}
              onChange={(e) => setMeasureUnit(e.target.value)}
              className="col-span-3"
            />
            {errors.measureUnit && <p className="text-sm text-red-500 col-span-4 col-start-2">{errors.measureUnit}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="analysis-formula" className="text-right">
              Fórmula
            </Label>
            <Input
              id="analysis-formula"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="col-span-3"
              placeholder="Opcional"
            />
            {errors.formula && <p className="text-sm text-red-500 col-span-4 col-start-2">{errors.formula}</p>}
          </div>
          <div className="flex items-center space-x-2 col-span-4 justify-end">
            <Label htmlFor="analysis-isActive">Activa</Label>
            <Switch id="analysis-isActive" checked={isActive} onCheckedChange={setIsActive} />
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
            Crear Determinación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
