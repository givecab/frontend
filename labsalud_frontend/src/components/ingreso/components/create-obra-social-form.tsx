"use client"

import type React from "react"

import { useState } from "react"
import { Building, Save, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { useApi } from "../../../hooks/use-api"
import { toast } from "sonner"
import type { ObraSocial } from "../../../types"

interface CreateObraSocialFormProps {
  onObraSocialCreated: (obraSocial: ObraSocial) => void
  onCancel: () => void
}

export function CreateObraSocialForm({ onObraSocialCreated, onCancel }: CreateObraSocialFormProps) {
  const { apiRequest } = useApi()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCreateObraSocial = async () => {
    if (!formData.name) {
      toast.error("Complete el nombre de la obra social")
      return
    }

    try {
      setIsCreating(true)
      const baseUrl = import.meta.env.VITE_API_BASE_URL

      console.log("Creating obra social with data:", formData)

      const response = await apiRequest(`${baseUrl}/api/analysis/ooss/`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const newObraSocial = await response.json()
        console.log("Obra social created:", newObraSocial)
        onObraSocialCreated(newObraSocial)
        toast.success("Obra social creada exitosamente")
      } else {
        const errorData = await response.json()
        console.error("Obra social creation error:", errorData)
        toast.error("Error al crear obra social", {
          description: errorData.detail || "Ha ocurrido un error al crear la obra social.",
        })
      }
    } catch (error) {
      console.error("Error creating obra social:", error)
      toast.error("Error al crear la obra social")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-[#204983]">
          <Building className="h-5 w-5 text-[#204983]" />
          Crear Nueva Obra Social
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Nombre de la obra social"
            required
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleCreateObraSocial}
            disabled={isCreating}
            className="flex-1 bg-[#204983] hover:bg-[#1a3d6f]"
          >
            {isCreating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isCreating ? "Creando..." : "Crear Obra Social"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
