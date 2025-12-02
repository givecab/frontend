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
import type { Determination } from "@/types"
import { CATALOG_ENDPOINTS } from "@/config/api"

interface CreateDeterminationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (newDetermination: Determination) => void
  analysisId: number
}

export const CreateDeterminationDialog: React.FC<CreateDeterminationDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  analysisId,
}) => {
  const { apiRequest } = useApi()
  const toastActions = useToast()
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [measureUnit, setMeasureUnit] = useState("")
  const [formula, setFormula] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setCode("")
      setName("")
      setMeasureUnit("")
      setFormula("")
      setErrors({})
      setIsLoading(false)
    }
  }, [open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!code.trim()) newErrors.code = "El código es requerido."
    if (!name.trim()) newErrors.name = "El nombre es requerido."
    if (!measureUnit.trim()) newErrors.measureUnit = "La unidad de medida es requerida."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const determinationData = {
        code,
        analysis: analysisId,
        name,
        measure_unit: measureUnit,
        formula: formula || "",
      }
      const response = await apiRequest(CATALOG_ENDPOINTS.DETERMINATIONS, {
        method: "POST",
        body: determinationData,
      })

      if (response.ok) {
        const newDetermination = await response.json()
        toastActions.success("Éxito", { description: "Determinación creada correctamente." })
        onSuccess(newDetermination)
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
          setErrors({ form: String(backendErrors) || "Error al crear la determinación." })
        }
        toastActions.error("Error", { description: "No se pudo crear la determinación." })
      }
    } catch (error) {
      console.error("Error creating determination:", error)
      setErrors({ form: "Ocurrió un error de red o servidor." })
      toastActions.error("Error", { description: "Ocurrió un error inesperado." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Determinación</DialogTitle>
          <DialogDescription>Completa los datos para la nueva determinación del análisis.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{errors.form}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="determination-code">Código *</Label>
            <Input
              id="determination-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ingrese el código de la determinación"
            />
            {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="determination-name">Nombre *</Label>
            <Input
              id="determination-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingrese el nombre de la determinación"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="determination-measureUnit">Unidad de Medida *</Label>
            <Input
              id="determination-measureUnit"
              value={measureUnit}
              onChange={(e) => setMeasureUnit(e.target.value)}
              placeholder="ej: mg/dL, UI/L, etc."
            />
            {errors.measureUnit && <p className="text-sm text-red-500">{errors.measureUnit}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="determination-formula">Fórmula (Opcional)</Label>
            <Textarea
              id="determination-formula"
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
            Crear Determinación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
