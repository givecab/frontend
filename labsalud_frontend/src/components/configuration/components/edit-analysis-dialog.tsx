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

interface EditAnalysisDialogProps {
  open: boolean // Cambiado de isOpen a open
  onOpenChange: (open: boolean) => void // Cambiado de onClose a onOpenChange
  onSuccess: (updatedAnalysis: AnalysisItem) => void
  analysis: AnalysisItem | null
  panelId: number
}

export const EditAnalysisDialog: React.FC<EditAnalysisDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  analysis,
  panelId,
}) => {
  const { apiRequest } = useApi()
  const toastActions = useToast() // Corregido
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [measureUnit, setMeasureUnit] = useState("")
  const [formula, setFormula] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (analysis && open) {
      setCode(analysis.code)
      setName(analysis.name)
      setMeasureUnit(analysis.measure_unit)
      setFormula(analysis.formula || "")
      setIsActive(analysis.is_active)
      setErrors({})
      setIsLoading(false)
    }
  }, [analysis, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "El nombre es requerido."
    if (!code.trim()) newErrors.code = "El código es requerido."
    if (!measureUnit.trim()) newErrors.measureUnit = "La unidad de medida es requerida."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!analysis || !validateForm()) return

    setIsLoading(true)
    try {
      const analysisUpdateData: Partial<
        Omit<AnalysisItem, "id" | "created_at" | "updated_at" | "created_by" | "updated_by" | "panel">
      > & { panel?: number } = {} // panel es opcional aquí

      if (code !== analysis.code) analysisUpdateData.code = code
      if (name !== analysis.name) analysisUpdateData.name = name
      if (measureUnit !== analysis.measure_unit) analysisUpdateData.measure_unit = measureUnit
      if (formula !== (analysis.formula || "")) analysisUpdateData.formula = formula
      if (isActive !== analysis.is_active) analysisUpdateData.is_active = isActive
      // No incluimos panelId en el PATCH a menos que la API lo requiera explícitamente para actualizar la relación.
      // Si el panel de una determinación puede cambiar, entonces sí se incluiría.
      // Por ahora, asumimos que el panel no cambia al editar una determinación.

      if (Object.keys(analysisUpdateData).length === 0) {
        toastActions.info("Sin cambios", { description: "No se realizaron modificaciones." })
        onOpenChange(false)
        return
      }

      const response = await apiRequest(
        `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_ANALYSIS_ANALYSES_ENDPOINT}${analysis.id}/`,
        {
          method: "PATCH",
          body: analysisUpdateData,
        },
      )

      if (response.ok) {
        const updatedAnalysis = await response.json()
        toastActions.success("Éxito", { description: "Determinación actualizada correctamente." })
        onSuccess(updatedAnalysis)
        onOpenChange(false)
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
          setErrors({ form: String(backendErrors) || "Error al actualizar la determinación." })
        }
        toastActions.error("Error", { description: "No se pudo actualizar la determinación." })
      }
    } catch (error) {
      console.error("Error updating analysis:", error)
      setErrors({ form: "Ocurrió un error de red o servidor." })
      toastActions.error("Error", { description: "Ocurrió un error inesperado." })
    } finally {
      setIsLoading(false)
    }
  }

  if (!analysis) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Determinación: {analysis.name}</DialogTitle>
          <DialogDescription>Modifica los datos de la determinación (Panel ID: {panelId}).</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {errors.form && <p className="text-sm text-red-500 col-span-2">{errors.form}</p>}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-analysis-code" className="text-right">
              Código
            </Label>
            <Input
              id="edit-analysis-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="col-span-3"
            />
            {errors.code && <p className="text-sm text-red-500 col-span-4 col-start-2">{errors.code}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-analysis-name" className="text-right">
              Nombre
            </Label>
            <Input
              id="edit-analysis-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
            {errors.name && <p className="text-sm text-red-500 col-span-4 col-start-2">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-analysis-measureUnit" className="text-right">
              Unidad Med.
            </Label>
            <Input
              id="edit-analysis-measureUnit"
              value={measureUnit}
              onChange={(e) => setMeasureUnit(e.target.value)}
              className="col-span-3"
            />
            {errors.measureUnit && <p className="text-sm text-red-500 col-span-4 col-start-2">{errors.measureUnit}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-analysis-formula" className="text-right">
              Fórmula
            </Label>
            <Input
              id="edit-analysis-formula"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="col-span-3"
              placeholder="Opcional"
            />
            {errors.formula && <p className="text-sm text-red-500 col-span-4 col-start-2">{errors.formula}</p>}
          </div>
          <div className="flex items-center space-x-2 col-span-4 justify-end">
            <Label htmlFor="edit-analysis-isActive">Activa</Label>
            <Switch id="edit-analysis-isActive" checked={isActive} onCheckedChange={setIsActive} />
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
