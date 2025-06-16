"use client"

import type { Patient } from "../patients-page"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash, AlertCircle, Eye } from "lucide-react"
import { useState } from "react"
import { PatientDetailsDialog } from "./patient-details-dialog"

interface PatientTableProps {
  patients: Patient[]
  onSelectPatient: (patient: Patient, action: string) => void
  canEdit: boolean
  canDelete: boolean
}

export function PatientTable({ patients, onSelectPatient, canEdit, canDelete }: PatientTableProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isViewingDetails, setIsViewingDetails] = useState(false)

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
    // Formatear DNI con puntos para mejor legibilidad
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  // Función para mapear género correctamente
  const getGenderDisplay = (gender: string) => {
    if (gender === "M" || gender === "Masculino") return "Masculino"
    if (gender === "F" || gender === "Femenino") return "Femenino"
    return gender
  }

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsViewingDetails(true)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">DNI</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Género</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length > 0 ? (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-mono font-medium text-[#204983]">{formatDni(patient.dni)}</TableCell>
                  <TableCell className="font-medium">{`${patient.first_name} ${patient.last_name}`}</TableCell>
                  <TableCell>{calculateAge(patient.birth_date)} años</TableCell>
                  <TableCell>
                    <Badge variant={patient.gender === "M" || patient.gender === "Masculino" ? "default" : "secondary"}>
                      {getGenderDisplay(patient.gender)}
                    </Badge>
                  </TableCell>
                  <TableCell>{patient.phone_mobile || patient.phone_landline}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{patient.email}</TableCell>
                  <TableCell>{patient.city}</TableCell>
                  <TableCell>
                    <Badge variant={patient.is_active ? "default" : "outline"}>
                      {patient.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Ver detalles */}
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(patient)}>
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Editar paciente */}
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => onSelectPatient(patient, "edit")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Eliminar paciente */}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 hover:bg-red-50"
                          onClick={() => onSelectPatient(patient, "delete")}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>No hay pacientes disponibles</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de detalles */}
      <PatientDetailsDialog
        isOpen={isViewingDetails}
        onClose={() => setIsViewingDetails(false)}
        patient={selectedPatient}
      />
    </>
  )
}
