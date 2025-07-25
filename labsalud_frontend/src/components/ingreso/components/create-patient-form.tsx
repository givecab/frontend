"use client"

import type React from "react"

import { useState } from "react"
import { User, Save, X } from "lucide-react"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { useApi } from "../../../hooks/use-api"
import { toast } from "sonner"
import type { Patient } from "../../../types"

interface CreatePatientFormProps {
  initialDni: string
  onPatientCreated: (patient: Patient) => void
  onCancel: () => void
}

export function CreatePatientForm({ initialDni, onPatientCreated, onCancel }: CreatePatientFormProps) {
  const { apiRequest } = useApi()
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dni: initialDni,
    birth_date: "",
    gender: "",
    phone_mobile: "",
    phone_landline: "",
    email: "",
    country: "Argentina",
    province: "Córdoba",
    city: "Leones",
    address: "",
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "dni") {
      const numericValue = value.replace(/\D/g, "")
      setFormData((prev) => ({ ...prev, [name]: numericValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreatePatient = async () => {
    if (!formData.first_name || !formData.last_name || !formData.dni || !formData.birth_date || !formData.gender) {
      toast.error("Complete los campos obligatorios")
      return
    }

    try {
      setIsCreating(true)
      const baseUrl = import.meta.env.VITE_API_BASE_URL

      console.log("Creating patient with data:", formData)

      const response = await apiRequest(`${baseUrl}${import.meta.env.VITE_PATIENTS_ENDPOINT}`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const newPatient = await response.json()
        console.log("Patient created:", newPatient)
        onPatientCreated(newPatient)
        toast.success("Paciente creado exitosamente")
      } else {
        const errorData = await response.json()
        console.error("Patient creation error:", errorData)
        toast.error("Error al crear paciente", {
          description: errorData.detail || "Ha ocurrido un error al crear el paciente.",
        })
      }
    } catch (error) {
      console.error("Error creating patient:", error)
      toast.error("Error al crear el paciente")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-[#204983]">
          <User className="h-5 w-5 text-[#204983]" />
          Crear Nuevo Paciente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Nombre *</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="Juan"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Apellido *</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Pérez"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dni">DNI *</Label>
          <Input
            id="dni"
            name="dni"
            value={formData.dni}
            onChange={handleInputChange}
            placeholder="12345678"
            maxLength={8}
            className="font-mono text-lg"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birth_date">Fecha de nacimiento *</Label>
            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Género *</Label>
            <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone_mobile">Teléfono móvil</Label>
            <Input
              id="phone_mobile"
              name="phone_mobile"
              value={formData.phone_mobile}
              onChange={handleInputChange}
              placeholder="Teléfono móvil"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_landline">Teléfono fijo</Label>
            <Input
              id="phone_landline"
              name="phone_landline"
              value={formData.phone_landline}
              onChange={handleInputChange}
              placeholder="Teléfono fijo"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="País"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Provincia</Label>
            <Input
              id="province"
              name="province"
              value={formData.province}
              onChange={handleInputChange}
              placeholder="Provincia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="Ciudad" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Dirección completa"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleCreatePatient}
            disabled={isCreating}
            className="flex-1 bg-[#204983] hover:bg-[#1a3d6f]"
          >
            {isCreating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isCreating ? "Creando..." : "Crear Paciente"}
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
