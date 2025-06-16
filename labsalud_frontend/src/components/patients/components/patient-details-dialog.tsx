"use client"

import type { Patient } from "../patients-page"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Mail, Phone, MapPin, User, Clock, CreditCard } from "lucide-react"

interface PatientDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient | null
}

export function PatientDetailsDialog({ isOpen, onClose, patient }: PatientDetailsDialogProps) {
  if (!patient) return null

  // Reemplazar la función formatDateForDisplay con esta versión corregida:
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

    // Si viene en formato ISO o yyyy-mm-dd, usar parsing directo para evitar problemas de zona horaria
    if (dateString.includes("-")) {
      const [year, month, day] = dateString.split("-")
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
    }

    return dateString
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES")
  }

  // Reemplazar la función calculateAge con esta versión corregida:
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

  // Función para mapear género correctamente
  const getGenderDisplay = (gender: string) => {
    if (gender === "M" || gender === "Masculino") return "Masculino"
    if (gender === "F" || gender === "Femenino") return "Femenino"
    return gender
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Detalles del Paciente</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información principal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">DNI</p>
                <p className="text-lg font-mono font-semibold text-[#204983]">{formatDni(patient.dni)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Estado</p>
              <Badge variant={patient.is_active ? "default" : "outline"}>
                {patient.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>

          {/* Información personal */}
          <div>
            <p className="text-sm font-medium text-gray-500">Nombre completo</p>
            <p className="text-xl font-semibold">{`${patient.first_name} ${patient.last_name}`}</p>
          </div>

          {/* Información demográfica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de nacimiento</p>
                <p>
                  {formatDateForDisplay(patient.birth_date)} ({calculateAge(patient.birth_date)} años)
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Género</p>
              <Badge variant={patient.gender === "M" || patient.gender === "Masculino" ? "default" : "secondary"}>
                {getGenderDisplay(patient.gender)}
              </Badge>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Información de Contacto</h3>

            <div className="grid grid-cols-2 gap-4">
              {patient.phone_mobile && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono móvil</p>
                    <p>{patient.phone_mobile}</p>
                  </div>
                </div>
              )}

              {patient.phone_landline && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono fijo</p>
                    <p>{patient.phone_landline}</p>
                  </div>
                </div>
              )}
            </div>

            {patient.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{patient.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Información de ubicación */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Ubicación</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">País</p>
                <p>{patient.country}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Provincia</p>
                <p>{patient.province}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Ciudad</p>
                <p>{patient.city}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Dirección</p>
                <p>{patient.address}</p>
              </div>
            </div>
          </div>

          {/* Información de auditoría */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Información de Auditoría</span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Creado por</p>
                <p>{`${patient.created_by.first_name} ${patient.created_by.last_name} (${patient.created_by.username})`}</p>
                <p className="text-xs text-gray-400">{formatDateTime(patient.created_at)}</p>
              </div>

              {patient.updated_by.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Última modificación</p>
                  {patient.updated_by.slice(0, 3).map((updater, index) => (
                    <div key={index} className="text-sm">
                      <p>{`${updater.first_name} ${updater.last_name} (${updater.username})`}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(updater.updated_at)}</p>
                    </div>
                  ))}
                  {patient.updated_by.length > 3 && (
                    <p className="text-xs text-gray-400">... y {patient.updated_by.length - 3} más</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
