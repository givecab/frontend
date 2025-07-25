"use client"

import type React from "react"

import { useState } from "react"
import { User } from "lucide-react"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { useApi } from "../../../hooks/use-api"
import { toast } from "sonner"
import type { Patient } from "../../../types"

interface CreatePatientDialogProps {
  initialDni?: string
  onPatientCreated: (patient: Patient) => void
  onCancel: () => void
}

export function CreatePatientDialog({ initialDni = "", onPatientCreated, onCancel }: CreatePatientDialogProps) {
  const { apiRequest } = useApi()
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    dni: initialDni,
    first_name: "",
    last_name: "",
    birth_date: "",
    gender: "",
    phone_mobile: "",
    phone_landline: "",
    email: "",
    country: "Argentina",
    province: "",
    city: "",
    address: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.dni || !formData.first_name || !formData.last_name || !formData.birth_date || !formData.gender) {
      toast.error("Complete los campos obligatorios")
      return
    }

    try {
      setIsCreating(true)
      const baseUrl = import.meta.env.VITE_API_BASE_URL

      const response = await apiRequest(`${baseUrl}/api/patients/`, {
        method: "POST",
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newPatient = await response.json()
        onPatientCreated(newPatient)
        toast.success("Paciente creado exitosamente")
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Error al crear paciente")
      }
    } catch (error) {
      console.error("Error creating patient:", error)
      toast.error("Error al crear paciente")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="pb-4 bg-[#204983] text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Crear Nuevo Paciente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => handleInputChange("dni", e.target.value)}
                placeholder="12345678"
                required
              />
            </div>
            <div>
              <Label htmlFor="gender">Género *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                placeholder="Juan"
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Apellido *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Pérez"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="birth_date">Fecha de Nacimiento *</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleInputChange("birth_date", e.target.value)}
              required
            />
          </div>

          {/* Información de contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone_mobile">Teléfono Móvil</Label>
              <Input
                id="phone_mobile"
                value={formData.phone_mobile}
                onChange={(e) => handleInputChange("phone_mobile", e.target.value)}
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            <div>
              <Label htmlFor="phone_landline">Teléfono Fijo</Label>
              <Input
                id="phone_landline"
                value={formData.phone_landline}
                onChange={(e) => handleInputChange("phone_landline", e.target.value)}
                placeholder="011 1234-5678"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="juan.perez@email.com"
            />
          </div>

          {/* Dirección */}
          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Av. Corrientes 1234"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Buenos Aires"
              />
            </div>
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => handleInputChange("province", e.target.value)}
                placeholder="Buenos Aires"
              />
            </div>
            <div>
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="Argentina"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isCreating} className="flex-1 bg-[#204983] hover:bg-[#1a3d6f] text-white">
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creando...
                </>
              ) : (
                "Crear Paciente"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isCreating}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
