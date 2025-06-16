"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { env } from "@/config/env"

interface CreatePatientDialogProps {
  isOpen: boolean
  onClose: () => void
  setPatients: React.Dispatch<React.SetStateAction<any[]>>
  addPatient: (newPatient: any) => void
  apiRequest: (url: string, options?: any) => Promise<Response>
}

export function CreatePatientDialog({
  isOpen,
  onClose,
  setPatients,
  addPatient,
  apiRequest,
}: CreatePatientDialogProps) {
  const [formData, setFormData] = useState({
    dni: "",
    first_name: "",
    last_name: "",
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

  const resetForm = () => {
    setFormData({
      dni: "",
      first_name: "",
      last_name: "",
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

  const handleCreatePatient = async () => {
    if (!validateForm()) return

    try {
      const loadingId = toast.loading("Creando paciente...")

      if (env.DEBUG_MODE) {
        console.log("Creando paciente:", `${formData.first_name} ${formData.last_name} - DNI: ${formData.dni}`)
      }

      // Preparar datos para enviar con fecha en formato yyyy/mm/dd
      const dataToSend = {
        ...formData,
        birth_date: formatDateForAPI(formData.birth_date),
      }

      if (env.DEBUG_MODE) {
        console.log("Datos a enviar (crear):", dataToSend)
        console.log("Fecha original (input):", formData.birth_date)
        console.log("Fecha para backend:", dataToSend.birth_date)
      }

      const response = await apiRequest(env.PATIENTS_ENDPOINT, {
        method: "POST",
        body: dataToSend,
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const newPatient = await response.json()
        addPatient(newPatient)
        toast.success("Paciente creado", {
          description: `El paciente ${newPatient.first_name} ${newPatient.last_name} (DNI: ${newPatient.dni}) ha sido creado exitosamente.`,
          duration: env.TOAST_DURATION,
        })
        resetForm()
        onClose()
      } else {
        const errorData = await response.json()
        console.error("Error al crear - Datos enviados:", dataToSend)
        console.error("Error al crear - Respuesta del servidor:", errorData)
        toast.error("Error al crear paciente", {
          description: errorData.detail || "Ha ocurrido un error al crear el paciente.",
          duration: env.TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("Error al crear paciente:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al crear el paciente.",
        duration: env.TOAST_DURATION,
      })
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const formatDniDisplay = (dni: string) => {
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Paciente</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* DNI - Campo principal */}
          <div className="space-y-2">
            <Label htmlFor="dni" className="text-base font-semibold">
              DNI *
            </Label>
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
            {formData.dni && <p className="text-xs text-gray-500">Vista previa: {formatDniDisplay(formData.dni)}</p>}
          </div>

          {/* Información personal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="Nombre"
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
                placeholder="Apellido"
                required
              />
            </div>
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

          {/* Información de contacto */}
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

          {/* Información de ubicación */}
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
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button className="bg-[#204983]" onClick={handleCreatePatient}>
            Crear Paciente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
