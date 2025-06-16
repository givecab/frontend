"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Patient } from "../patients-page"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { env } from "@/config/env"

interface EditPatientDialogProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient | null
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>
  apiRequest: (url: string, options?: any) => Promise<Response>
}

export function EditPatientDialog({ isOpen, onClose, patient, setPatients, apiRequest }: EditPatientDialogProps) {
  const [formData, setFormData] = useState({
    dni: "",
    first_name: "",
    last_name: "",
    birth_date: "",
    gender: "",
    phone_mobile: "",
    phone_landline: "",
    email: "",
    country: "",
    province: "",
    city: "",
    address: "",
  })

  useEffect(() => {
    if (patient) {
      // Función para convertir fecha del backend (dd/mm/yyyy o yyyy/mm/dd) a formato input (yyyy-mm-dd)
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return ""

        if (dateString.includes("/")) {
          const parts = dateString.split("/")
          // Si el primer elemento tiene 4 dígitos, es yyyy/mm/dd
          if (parts[0].length === 4) {
            const [year, month, day] = parts
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          } else {
            // Si no, es dd/mm/yyyy
            const [day, month, year] = parts
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          }
        }
        return dateString.split("T")[0] // Si viene en formato ISO
      }

      setFormData({
        dni: patient.dni,
        first_name: patient.first_name,
        last_name: patient.last_name,
        birth_date: formatDateForInput(patient.birth_date),
        gender: patient.gender,
        phone_mobile: patient.phone_mobile,
        phone_landline: patient.phone_landline,
        email: patient.email,
        country: patient.country,
        province: patient.province,
        city: patient.city,
        address: patient.address,
      })
    }
  }, [patient])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Validación especial para DNI - solo números
    if (name === "dni") {
      const numericValue = value.replace(/\D/g, "")
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Convertir fecha de yyyy-mm-dd a yyyy-mm-dd para el backend (ya está en el formato correcto)
  const formatDateForAPI = (dateString: string) => {
    return dateString // El input date ya devuelve yyyy-mm-dd
  }

  const validateForm = () => {
    if (!formData.dni.trim()) {
      toast.error("Error de validación", {
        description: "El DNI es obligatorio.",
        duration: env.TOAST_DURATION,
      })
      return false
    }

    if (formData.dni.length < 7 || formData.dni.length > 8) {
      toast.error("Error de validación", {
        description: "El DNI debe tener entre 7 y 8 dígitos.",
        duration: env.TOAST_DURATION,
      })
      return false
    }

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("Error de validación", {
        description: "El nombre y apellido son obligatorios.",
        duration: env.TOAST_DURATION,
      })
      return false
    }

    if (!formData.birth_date) {
      toast.error("Error de validación", {
        description: "La fecha de nacimiento es obligatoria.",
        duration: env.TOAST_DURATION,
      })
      return false
    }

    if (!formData.gender) {
      toast.error("Error de validación", {
        description: "El género es obligatorio.",
        duration: env.TOAST_DURATION,
      })
      return false
    }

    return true
  }

  const handleUpdatePatient = async () => {
    if (!patient || !validateForm()) return

    try {
      const loadingId = toast.loading("Actualizando paciente...")

      if (env.DEBUG_MODE) {
        console.log("Actualizando paciente:", patient.id)
      }

      // Preparar datos para enviar con fecha en formato yyyy/mm/dd
      const dataToSend = {
        ...formData,
        birth_date: formatDateForAPI(formData.birth_date),
      }

      if (env.DEBUG_MODE) {
        console.log("Datos a enviar (editar):", dataToSend)
        console.log("Fecha original (input):", formData.birth_date)
        console.log("Fecha para backend:", dataToSend.birth_date)
      }

      const response = await apiRequest(`${env.PATIENTS_ENDPOINT}${patient.id}/`, {
        method: "PATCH",
        body: dataToSend,
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const updatedPatient = await response.json()
        setPatients((prev) => prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)))
        toast.success("Paciente actualizado", {
          description: `El paciente ${updatedPatient.first_name} ${updatedPatient.last_name} (DNI: ${updatedPatient.dni}) ha sido actualizado exitosamente.`,
          duration: env.TOAST_DURATION,
        })
        onClose()
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        toast.error("Error al actualizar paciente", {
          description: errorData.detail || "Ha ocurrido un error al actualizar el paciente.",
          duration: env.TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("Error al actualizar paciente:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al actualizar el paciente.",
        duration: env.TOAST_DURATION,
      })
    }
  }

  const formatDniDisplay = (dni: string) => {
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* DNI - Campo principal */}
          <div className="space-y-2">
            <Label htmlFor="edit-dni" className="text-base font-semibold">
              DNI *
            </Label>
            <Input
              id="edit-dni"
              name="dni"
              value={formData.dni}
              onChange={handleInputChange}
              placeholder="12345678"
              maxLength={8}
              className="font-mono text-lg"
              required
            />
            {formData.dni && <p className="text-xs text-gray-500">Vista previa: {formatDniDisplay(formData.dni)}</p>}
          </div>

          {/* Información personal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-first_name">Nombre *</Label>
              <Input
                id="edit-first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="Nombre"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-last_name">Apellido *</Label>
              <Input
                id="edit-last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Apellido"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-birth_date">Fecha de nacimiento *</Label>
              <Input
                id="edit-birth_date"
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-gender">Género *</Label>
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

          {/* Información de contacto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phone_mobile">Teléfono móvil</Label>
              <Input
                id="edit-phone_mobile"
                name="phone_mobile"
                value={formData.phone_mobile}
                onChange={handleInputChange}
                placeholder="Teléfono móvil"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone_landline">Teléfono fijo</Label>
              <Input
                id="edit-phone_landline"
                name="phone_landline"
                value={formData.phone_landline}
                onChange={handleInputChange}
                placeholder="Teléfono fijo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="correo@ejemplo.com"
            />
          </div>

          {/* Información de ubicación */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-country">País</Label>
              <Input
                id="edit-country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="País"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-province">Provincia</Label>
              <Input
                id="edit-province"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                placeholder="Provincia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-city">Ciudad</Label>
              <Input
                id="edit-city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Ciudad"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address">Dirección</Label>
            <Input
              id="edit-address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Dirección completa"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button className="bg-[#204983]" onClick={handleUpdatePatient}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
