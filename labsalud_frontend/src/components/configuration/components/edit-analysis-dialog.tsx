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
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import type { AnalysisItem } from "../configuration-page"
import { ANALYSIS_ENDPOINTS } from "@/config/api"

interface EditAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (updatedAnalysis: AnalysisItem) => void
  analysis: AnalysisItem
  panelId?: number
}

export const EditAnalysisDialog: React.FC<EditAnalysisDialogProps> = ({ open, onOpenChange, onSuccess, analysis }) => {
  const { apiRequest } = useApi()
  const toastActions = useToast()
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [measureUnit, setMeasureUnit] = useState("")
  const [formula, setFormula] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (analysis && open) {
      setCode(analysis.code)
      setName(analysis.name)
      setMeasureUnit(analysis.measure_unit)
      setFormula(analysis.formula || "")
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
      > & { panel?: number } = {}

      if (code !== analysis.code) analysisUpdateData.code = code
      if (name !== analysis.name) analysisUpdateData.name = name
      if (measureUnit !== analysis.measure_unit) analysisUpdateData.measure_unit = measureUnit
      if (formula !== (analysis.formula || "")) {
        analysisUpdateData.formula = formula.trim() || undefined
      }

      if (Object.keys(analysisUpdateData).length === 0) {
        toastActions.info("Sin cambios", { description: "No se realizaron modificaciones." })
        onOpenChange(false)
        return
      }

      const response = await apiRequest(ANALYSIS_ENDPOINTS.ANALYSIS_DETAIL(analysis.id), {
        method: "PATCH",
        body: analysisUpdateData,
      })

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Determinación: {analysis.name}</DialogTitle>
          <DialogDescription>Modifica los datos de la determinación.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{errors.form}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-analysis-code">Código *</Label>
            <Input
              id="edit-analysis-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ingrese el código de la determinación"
            />
            {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-analysis-name">Nombre *</Label>
            <Input
              id="edit-analysis-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingrese el nombre de la determinación"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-analysis-measureUnit">Unidad de Medida *</Label>
            <Input
              id="edit-analysis-measureUnit"
              value={measureUnit}
              onChange={(e) => setMeasureUnit(e.target.value)}
              placeholder="ej: mg/dL, UI/L, etc."
            />
            {errors.measureUnit && <p className="text-sm text-red-500">{errors.measureUnit}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-analysis-formula">Fórmula (Opcional)</Label>
            <Textarea
              id="edit-analysis-formula"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Ingrese la fórmula de cálculo si aplica"
              rows={3}
            />
            {errors.formula && <p className="text-sm text-red-500">{errors.formula}</p>}
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
