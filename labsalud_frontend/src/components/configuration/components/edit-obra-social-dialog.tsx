"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"

interface User {
  id: number
  username: string
  photo?: string
}

interface ObraSocial {
  id: number
  name: string
  is_active: boolean
  created_by: User | null
  updated_by: User[]
  created_at: string
  updated_at: string
}

interface EditObraSocialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  obraSocial: ObraSocial
  onSuccess: () => void
}

interface FormData {
  name: string
}

interface ValidationState {
  name: { isValid: boolean; message: string }
}

export function EditObraSocialDialog({ open, onOpenChange, obraSocial, onSuccess }: EditObraSocialDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
  })
  const [validation, setValidation] = useState<ValidationState>({
    name: { isValid: true, message: "" },
  })
  const [loading, setLoading] = useState(false)

  const { apiRequest } = useApi()

  useEffect(() => {
    if (obraSocial) {
      setFormData({
        name: obraSocial.name,
      })
      setValidation({
        name: { isValid: true, message: "Nombre válido" },
      })
    }
  }, [obraSocial])

  const validateField = (name: keyof FormData, value: string) => {
    let isValid = false
    let message = ""

    switch (name) {
      case "name":
        isValid = value.trim().length >= 3
        message = isValid ? "Nombre válido" : "El nombre debe tener al menos 3 caracteres"
        break
    }

    setValidation((prev) => ({
      ...prev,
      [name]: { isValid, message },
    }))
  }

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  const isFormValid = () => {
    return Object.values(validation).every((field) => field.isValid)
  }

  const getChangedFields = () => {
    const changes: Partial<FormData> = {}
    if (formData.name !== obraSocial.name) changes.name = formData.name
    return changes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    const changes = getChangedFields()
    if (Object.keys(changes).length === 0) {
      toast.info("No hay cambios para guardar")
      return
    }

    try {
      setLoading(true)
      const response = await apiRequest(`/api/analysis/ooss/${obraSocial.id}/`, {
        method: "PATCH",
        body: changes,
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        console.error("Error updating obra social:", errorData)
        toast.error(errorData.detail || errorData.message || "Error al actualizar la obra social")
      }
    } catch (error) {
      console.error("Error updating obra social:", error)
      toast.error("Error al actualizar la obra social")
    } finally {
      setLoading(false)
    }
  }

  const renderValidationIcon = (field: keyof ValidationState) => {
    if (!formData[field]) return null
    return validation[field].isValid ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-500" />
    )
  }

  const renderValidationMessage = (field: keyof ValidationState) => {
    if (!formData[field] || !validation[field].message) return null
    return (
      <p className={`text-xs mt-1 ${validation[field].isValid ? "text-green-600" : "text-red-600"}`}>
        {validation[field].message}
      </p>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Obra Social</DialogTitle>
          <DialogDescription>Modifica el nombre de la obra social.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <div className="relative">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ingresa el nombre de la obra social"
                  className={`pr-10 ${
                    formData.name
                      ? validation.name.isValid
                        ? "border-green-500 focus:border-green-500"
                        : "border-red-500 focus:border-red-500"
                      : ""
                  }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">{renderValidationIcon("name")}</div>
              </div>
              {renderValidationMessage("name")}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isFormValid() || loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
