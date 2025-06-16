"use client"

import type React from "react"
import type { Patient } from "../patients-page"
import { PatientCard } from "./patient-card"
import { AlertCircle } from "lucide-react"

interface PatientGridProps {
  patients: Patient[]
  onSelectPatient: (patient: Patient, action: string) => void
  canEdit: boolean
  canDelete: boolean
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>
  updatePatient: (updatedPatient: any) => void
  apiRequest: (url: string, options?: any) => Promise<Response>
}

export function PatientGrid({
  patients,
  onSelectPatient,
  canEdit,
  canDelete,
  setPatients,
  updatePatient,
  apiRequest,
}: PatientGridProps) {
  if (patients.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-12">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <AlertCircle className="h-16 w-16 mb-4" />
          <h3 className="text-xl font-medium mb-2">No hay pacientes disponibles</h3>
          <p className="text-sm">No se encontraron pacientes que coincidan con tu búsqueda.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {patients.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          onSelectPatient={onSelectPatient}
          canEdit={canEdit}
          canDelete={canDelete}
          setPatients={setPatients}
          updatePatient={updatePatient}
          apiRequest={apiRequest}
        />
      ))}
    </div>
  )
}

