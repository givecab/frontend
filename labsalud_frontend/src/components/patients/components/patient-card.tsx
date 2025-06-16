"use client"

import type React from "react"
import { useState } from "react"
import type { Patient } from "../patients-page"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Edit,
  Check,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { env } from "@/config/env"

interface PatientCardProps {
  patient: Patient
  onSelectPatient: (patient: Patient, action: string) => void
  canEdit: boolean
  canDelete: boolean
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>
  updatePatient: (updatedPatient: any) => void
  apiRequest: (url: string, options?: any) => Promise<Response>
}

export function PatientCard({
  patient,
  onSelectPatient,
  canEdit,
  canDelete,
  setPatients,
  updatePatient,
  apiRequest,
}: PatientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
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

  // Función para convertir fecha del backend (dd/mm/yyyy o yyyy/mm/dd) a formato input (yyyy-mm-dd)
  function formatDateForInput(dateString: string) {
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

  // Función para mostrar fecha en formato dd/mm/yyyy
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ""

    if (dateString.includes("/")) {
      const parts = dateString.split("/")
      // Si el primer elemento tiene 4 dígitos, es yyyy/mm/dd
      if (parts[0].length === 4) {
        const [year, month, day] = parts
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
      } else {
        // Si no, ya está en dd/mm/yyyy
        return dateString
      }
    }

    // Si viene en formato ISO o yyyy-mm-dd, usar UTC para evitar problemas de zona horaria
    if (dateString.includes("-")) {
      const [year, month, day] = dateString.split("-")
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
    }

    return dateString
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0

    let year, month, day

    if (birthDate.includes("/")) {
      const parts = birthDate.split("/")
      if (parts[0].length === 4) {
        // yyyy/mm/dd
        ;[year, month, day] = parts.map(Number)
      } else {
        // dd/mm/yyyy
        ;[day, month, year] = parts.map(Number)
      }
    } else if (birthDate.includes("-")) {
      // yyyy-mm-dd
      ;[year, month, day] = birthDate.split("-").map(Number)
    } else {
      return 0
    }

    // Crear fecha sin problemas de zona horaria
    const birthDateObj = new Date(year, month - 1, day) // month - 1 porque los meses en JS van de 0-11
    const today = new Date()

    let age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--
    }

    return age
  }

  const formatDni = (dni: string) => {
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES")
  }

  // Función para mapear género correctamente
  const getGenderDisplay = (gender: string) => {
    if (gender === "M" || gender === "Masculino") return "Masculino"
    if (gender === "F" || gender === "Femenino") return "Femenino"
    return gender
  }

  // Función para obtener el valor del género para el badge
  const getGenderBadgeVariant = (gender: string) => {
    return gender === "M" || gender === "Masculino" ? "default" : "secondary"
  }

  // Función para obtener la letra del género
  const getGenderLetter = (gender: string) => {
    if (gender === "M" || gender === "Masculino") return "M"
    if (gender === "F" || gender === "Femenino") return "F"
    return gender
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "dni") {
      const numericValue = value.replace(/\D/g, "")
      setEditData((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
    } else {
      setEditData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const hasChanges = () => {
    return (
      editData.dni !== patient.dni ||
      editData.first_name !== patient.first_name ||
      editData.last_name !== patient.last_name ||
      editData.birth_date !== formatDateForInput(patient.birth_date) ||
      editData.gender !== patient.gender ||
      editData.phone_mobile !== patient.phone_mobile ||
      editData.phone_landline !== patient.phone_landline ||
      editData.email !== patient.email ||
      editData.country !== patient.country ||
      editData.province !== patient.province ||
      editData.city !== patient.city ||
      editData.address !== patient.address
    )
  }

  const handleSave = async () => {
    if (!hasChanges()) {
      toast.info("Sin cambios", {
        description: "No se detectaron cambios para guardar.",
        duration: env.TOAST_DURATION,
      })
      setIsEditing(false)
      return
    }

    // Validación básica antes de enviar
    if (!editData.dni.trim() || editData.dni.length < 7 || editData.dni.length > 8) {
      toast.error("Error de validación", {
        description: "El DNI debe tener entre 7 y 8 dígitos.",
        duration: env.TOAST_DURATION,
      })
      return
    }

    if (!editData.first_name.trim() || !editData.last_name.trim()) {
      toast.error("Error de validación", {
        description: "El nombre y apellido son obligatorios.",
        duration: env.TOAST_DURATION,
      })
      return
    }

    try {
      const loadingId = toast.loading("Actualizando paciente...")

      // Convertir fecha de yyyy-mm-dd a yyyy-mm-dd para el backend (ya está en el formato correcto)
      const formatDateForAPI = (dateString: string) => {
        return dateString // El input date ya devuelve yyyy-mm-dd
      }

      const dataToSend = {
        ...editData,
        birth_date: formatDateForAPI(editData.birth_date),
      }

      if (env.DEBUG_MODE) {
        console.log("Datos originales del paciente:", patient)
        console.log("Datos editados:", editData)
        console.log("Datos a enviar:", dataToSend)
        console.log("Fecha original (input):", editData.birth_date)
        console.log("Fecha para backend:", dataToSend.birth_date)
        console.log("URL:", `${env.PATIENTS_ENDPOINT}${patient.id}/`)
      }

      const response = await apiRequest(`${env.PATIENTS_ENDPOINT}${patient.id}/`, {
        method: "PATCH",
        body: dataToSend,
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const updatedPatientData = await response.json()
        updatePatient(updatedPatientData)
        toast.success("Paciente actualizado", {
          description: `Los datos de ${updatedPatientData.first_name} ${updatedPatientData.last_name} han sido actualizados.`,
          duration: env.TOAST_DURATION,
        })
        setIsEditing(false)
      } else {
        const errorData = await response.json()
        console.error("Error - Datos enviados:", dataToSend)
        console.error("Error - Respuesta del servidor:", errorData)
        toast.error("Error al actualizar", {
          description: errorData.detail || errorData.message || "Ha ocurrido un error al actualizar el paciente.",
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

  const handleCancel = () => {
    setEditData({
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
    setIsEditing(false)
  }

  const renderUserAvatar = (
    user: { id: number; username: string; photo?: string },
    timestamp?: string,
    showName = false,
    index?: number,
  ) => {
    const displayName = user.username
    const tooltipText = timestamp ? `${displayName} - ${formatDateTime(timestamp)}` : displayName
    const uniqueKey = `${user.id}-${timestamp || "no-timestamp"}-${index || 0}`

    return (
      <div key={uniqueKey} className="relative group flex items-center">
        {user.photo ? (
          <img
            src={user.photo || "/placeholder.svg"}
            alt={displayName}
            className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer"
            title={!showName ? tooltipText : undefined}
          />
        ) : (
          <div
            className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#204983] flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer"
            title={!showName ? tooltipText : undefined}
          >
            <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </div>
        )}

        {showName && (
          <span className="ml-2 text-sm text-gray-600">
            {displayName}
            {timestamp && <span className="text-xs text-gray-400 block">{formatDateTime(timestamp)}</span>}
          </span>
        )}

        {/* Tooltip solo cuando no se muestra el nombre */}
        {!showName && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {tooltipText}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow bg-white/95 backdrop-blur-sm">
      <CardContent className="p-4 md:p-6">
        {/* Header de la card - Información principal - RESPONSIVE */}
        <div onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Información principal del paciente */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* DNI y nombre */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-[#204983]" />
                  <span className="font-mono font-bold text-lg md:text-xl text-[#204983]">
                    {formatDni(patient.dni)}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-lg md:text-xl text-gray-800">{`${patient.first_name} ${patient.last_name}`}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                    <span>{calculateAge(patient.birth_date)} años</span>
                    <Badge variant={getGenderBadgeVariant(patient.gender)} className="text-xs">
                      {getGenderLetter(patient.gender)}
                    </Badge>
                    <span className="hidden sm:inline">{patient.city}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Usuarios y botón expandir */}
            <div className="flex items-center justify-between lg:justify-end gap-4">
              {/* Usuarios - Responsive */}
              <div className="flex items-center space-x-2 text-xs md:text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500 hidden sm:inline">Creado:</span>
                  <span className="text-gray-500 sm:hidden">C:</span>
                  {renderUserAvatar(patient.created_by, patient.created_at, false, 0)}
                </div>

                {patient.updated_by.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500 hidden sm:inline">Modificado:</span>
                    <span className="text-gray-500 sm:hidden">M:</span>
                    <div className="flex -space-x-1">
                      {patient.updated_by
                        .slice(0, 2)
                        .map((user, index) => renderUserAvatar(user, patient.updated_at, false, index))}
                      {patient.updated_by.length > 2 && (
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm text-xs">
                          +{patient.updated_by.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón expandir */}
              <div className="flex items-center">
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </div>
        </div>

        {/* Información expandida - RESPONSIVE */}
        {isExpanded && (
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t space-y-4 md:space-y-6">
            {/* Botones de acción - Responsive */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {canEdit && !isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 sm:flex-none"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
                {isEditing && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Listo
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none">
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
              {canDelete && !isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectPatient(patient, "delete")}
                  className="border-red-200 hover:bg-red-50 w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                  Eliminar
                </Button>
              )}
            </div>

            {/* Información detallada - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {isEditing ? (
                // Modo edición - Responsive
                <>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-gray-800">Información Personal</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">DNI</Label>
                        <Input
                          name="dni"
                          value={editData.dni}
                          onChange={handleInputChange}
                          className="mt-1"
                          maxLength={8}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Género</Label>
                        <Select value={editData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Femenino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Nombre</Label>
                        <Input
                          name="first_name"
                          value={editData.first_name}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Apellido</Label>
                        <Input
                          name="last_name"
                          value={editData.last_name}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Fecha de nacimiento</Label>
                      <Input
                        name="birth_date"
                        type="date"
                        value={editData.birth_date}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-gray-800">Información de Contacto</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Teléfono móvil</Label>
                        <Input
                          name="phone_mobile"
                          value={editData.phone_mobile}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Teléfono fijo</Label>
                        <Input
                          name="phone_landline"
                          value={editData.phone_landline}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <Input
                        name="email"
                        type="email"
                        value={editData.email}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">País</Label>
                        <Input name="country" value={editData.country} onChange={handleInputChange} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Provincia</Label>
                        <Input
                          name="province"
                          value={editData.province}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Ciudad</Label>
                        <Input name="city" value={editData.city} onChange={handleInputChange} className="mt-1" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Dirección</Label>
                      <Input name="address" value={editData.address} onChange={handleInputChange} className="mt-1" />
                    </div>
                  </div>
                </>
              ) : (
                // Modo vista - Responsive
                <>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-gray-800">Información Personal</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Nacimiento: {formatDateForDisplay(patient.birth_date)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>Género: {getGenderDisplay(patient.gender)}</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span>{patient.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {patient.province}, {patient.country}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-gray-800">Información de Contacto</h4>
                    <div className="space-y-3 text-sm">
                      {patient.phone_mobile && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>Móvil: {patient.phone_mobile}</span>
                        </div>
                      )}
                      {patient.phone_landline && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>Fijo: {patient.phone_landline}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-start space-x-2">
                          <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="break-all">{patient.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Información de auditoría expandida - Responsive */}
            {!isEditing && (
              <div className="pt-4 md:pt-6 border-t">
                <h4 className="font-semibold text-lg text-gray-800 mb-4">Información de Auditoría</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Creado por:</p>
                    {renderUserAvatar(patient.created_by, patient.created_at, true, 0)}
                  </div>

                  {patient.updated_by.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Modificado por:</p>
                      <div className="space-y-2">
                        {patient.updated_by.slice(0, 5).map((user, index) => (
                          <div key={`audit-${user.id}-${index}`}>
                            {renderUserAvatar(user, patient.updated_at, true, index)}
                          </div>
                        ))}
                        {patient.updated_by.length > 5 && (
                          <p className="text-xs text-gray-400">... y {patient.updated_by.length - 5} más</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
