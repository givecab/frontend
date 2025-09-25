"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { AlertCircle, CheckCircle } from "lucide-react"
import { PATIENT_ENDPOINTS, TOAST_DURATION } from "@/config/api"

interface CreatePatientDialogProps {
  isOpen: boolean
  onClose: () => void
  addPatient: (newPatient: any) => void
  apiRequest: (url: string, options?: any) => Promise<Response>
}

interface ValidationState {
  dni: { isValid: boolean; message: string }
  first_name: { isValid: boolean; message: string }
  last_name: { isValid: boolean; message: string }
  email: { isValid: boolean; message: string }
  phone_mobile: { isValid: boolean; message: string }
  phone_landline: { isValid: boolean; message: string }
  birth_date: { isValid: boolean; message: string }
}

const initialValidation: ValidationState = {
  dni: { isValid: false, message: "Ingresa un DNI válido (7-8 dígitos)" },
  first_name: { isValid: false, message: "Ingresa el nombre" },
  last_name: { isValid: false, message: "Ingresa el apellido" },
  email: { isValid: true, message: "" },
  phone_mobile: { isValid: true, message: "" },
  phone_landline: { isValid: true, message: "" },
  birth_date: { isValid: false, message: "Selecciona la fecha de nacimiento" },
}

export function CreatePatientDialog({ isOpen, onClose, addPatient, apiRequest }: CreatePatientDialogProps) {
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

  const [validation, setValidation] = useState<ValidationState>(initialValidation)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Funciones de validación
  const validateDNI = (dni: string) => {
    if (!dni.trim()) {
      return { isValid: false, message: "El DNI es obligatorio" }
    }
    if (!/^\d+$/.test(dni)) {
      return { isValid: false, message: "El DNI solo debe contener números" }
    }
    if (dni.length < 7 || dni.length > 8) {
      return { isValid: false, message: "El DNI debe tener entre 7 y 8 dígitos" }
    }
    return { isValid: true, message: "DNI válido" }
  }

  const validateName = (name: string, field: string) => {
    if (!name.trim()) {
      return { isValid: false, message: `${field} es obligatorio` }
    }
    if (name.trim().length < 2) {
      return { isValid: false, message: "Mínimo 2 caracteres" }
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())) {
      return { isValid: false, message: "Solo letras y espacios" }
    }
    return { isValid: true, message: `${field} válido` }
  }

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return { isValid: true, message: "" } // Email es opcional
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Formato de email inválido (ejemplo: usuario@dominio.com)" }
    }
    return { isValid: true, message: "Email válido" }
  }

  const validatePhone = (phone: string, field: string) => {
    if (!phone.trim()) {
      return { isValid: true, message: "" } // Teléfonos son opcionales
    }
    if (!/^[\d\s\-+()]+$/.test(phone)) {
      return { isValid: false, message: `${field} solo puede contener números, espacios, guiones y paréntesis` }
    }
    if (phone.replace(/\D/g, "").length < 8) {
      return { isValid: false, message: `${field} debe tener al menos 8 dígitos` }
    }
    return { isValid: true, message: `${field} válido` }
  }

  const validateBirthDate = (date: string) => {
    if (!date) {
      return { isValid: false, message: "La fecha de nacimiento es obligatoria" }
    }
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()

    if (birthDate > today) {
      return { isValid: false, message: "La fecha no puede ser futura" }
    }
    if (age > 120) {
      return { isValid: false, message: "La fecha parece incorrecta (edad mayor a 120 años)" }
    }
    if (age < 0) {
      return { isValid: false, message: "La fecha parece incorrecta" }
    }
    return { isValid: true, message: "Fecha válida" }
  }

  // Validar campo específico
  const validateField = (name: string, value: string) => {
    let result
    switch (name) {
      case "dni":
        result = validateDNI(value)
        break
      case "first_name":
        result = validateName(value, "El nombre")
        break
      case "last_name":
        result = validateName(value, "El apellido")
        break
      case "email":
        result = validateEmail(value)
        break
      case "phone_mobile":
        result = validatePhone(value, "El teléfono móvil")
        break
      case "phone_landline":
        result = validatePhone(value, "El teléfono fijo")
        break
      case "birth_date":
        result = validateBirthDate(value)
        break
      default:
        return
    }

    setValidation((prev) => ({
      ...prev,
      [name]: result,
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Validación especial para DNI - solo números
    if (name === "dni") {
      const numericValue = value.replace(/\D/g, "")
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }))

      // Marcar como tocado
      setTouched((prev) => ({ ...prev, [name]: true }))

      // Validar en tiempo real
      validateField(name, numericValue)
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))

      // Marcar como tocado
      setTouched((prev) => ({ ...prev, [name]: true }))

      // Validar en tiempo real
      validateField(name, value)
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
    setValidation(initialValidation)
    setTouched({})
  }

  const isFormValid = () => {
    const requiredFields = ["dni", "first_name", "last_name", "birth_date"]
    const requiredFieldsValid = requiredFields.every((field) => {
      const fieldValidation = validation[field as keyof ValidationState]
      return fieldValidation.isValid
    })

    const optionalFieldsValid = ["email", "phone_mobile", "phone_landline"].every((field) => {
      const fieldValidation = validation[field as keyof ValidationState]
      return fieldValidation.isValid
    })

    return requiredFieldsValid && optionalFieldsValid && formData.gender !== ""
  }

  const handleCreatePatient = async () => {
    // Marcar todos los campos como tocados
    const allFields = ["dni", "first_name", "last_name", "birth_date", "email", "phone_mobile", "phone_landline"]
    const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    setTouched(newTouched)

    // Validar todos los campos
    allFields.forEach((field) => {
      validateField(field, formData[field as keyof typeof formData] as string)
    })

    if (!isFormValid() || !formData.gender) {
      toast.error("Formulario inválido", {
        description: "Por favor, corrige los errores antes de continuar.",
        duration: TOAST_DURATION,
      })
      return
    }

    try {
      const loadingId = toast.loading("Creando paciente...")

      const dataToSend = {
        ...formData,
        birth_date: formData.birth_date,
      }

      const response = await apiRequest(PATIENT_ENDPOINTS.PATIENTS, {
        method: "POST",
        body: dataToSend,
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const newPatient = await response.json()
        addPatient(newPatient)
        toast.success("Paciente creado", {
          description: `El paciente ${newPatient.first_name} ${newPatient.last_name} (DNI: ${newPatient.dni}) ha sido creado exitosamente.`,
          duration: TOAST_DURATION,
        })
        resetForm()
        onClose()
      } else {
        const errorData = await response.json()
        toast.error("Error al crear paciente", {
          description: errorData.detail || "Ha ocurrido un error al crear el paciente.",
          duration: TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("Error al crear paciente:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al crear el paciente.",
        duration: TOAST_DURATION,
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

  const getFieldStyle = (fieldName: string) => {
    if (!touched[fieldName]) return ""
    const field = validation[fieldName as keyof ValidationState]
    return field?.isValid ? "border-green-500 focus:ring-green-500" : "border-red-500 focus:ring-red-500"
  }

  const renderFieldMessage = (fieldName: string) => {
    if (!touched[fieldName]) return null
    const field = validation[fieldName as keyof ValidationState]
    if (!field || !field.message) return null

    return (
      <div className={`flex items-center gap-1 text-xs mt-1 ${field.isValid ? "text-green-600" : "text-red-600"}`}>
        {field.isValid ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
        <span>{field.message}</span>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
              className={`font-mono text-lg ${getFieldStyle("dni")}`}
              required
            />
            {renderFieldMessage("dni")}
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
                placeholder="Juan"
                className={getFieldStyle("first_name")}
                required
              />
              {renderFieldMessage("first_name")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido *</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Pérez"
                className={getFieldStyle("last_name")}
                required
              />
              {renderFieldMessage("last_name")}
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
                className={getFieldStyle("birth_date")}
                required
              />
              {renderFieldMessage("birth_date")}
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
                className={getFieldStyle("phone_mobile")}
              />
              {renderFieldMessage("phone_mobile")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_landline">Teléfono fijo</Label>
              <Input
                id="phone_landline"
                name="phone_landline"
                value={formData.phone_landline}
                onChange={handleInputChange}
                placeholder="Teléfono fijo"
                className={getFieldStyle("phone_landline")}
              />
              {renderFieldMessage("phone_landline")}
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
              className={getFieldStyle("email")}
            />
            {renderFieldMessage("email")}
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
          <Button className="bg-[#204983]" onClick={handleCreatePatient} disabled={!isFormValid()}>
            Crear Paciente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
