"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Loader2, AlertCircle } from "lucide-react"
import { PatientGrid } from "./components/patient-grid"
import { CreatePatientDialog } from "./components/create-patient-dialog"
import { DeletePatientDialog } from "./components/delete-patient-dialog"
import { env } from "@/config/env"

// Interface para usuario como viene del endpoint
export interface User {
  id: number
  username: string
  photo?: string
}

// Interface para paciente como viene del endpoint - CORREGIDA
export interface Patient {
  id: number
  dni: string
  first_name: string
  last_name: string
  birth_date: string
  gender: string
  phone_mobile: string
  phone_landline: string
  email: string
  country: string
  province: string
  city: string
  address: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: User // Usuario que creó el paciente
  updated_by: User[] // Array directo de usuarios que modificaron
}

export default function PatientsPage() {
  const { hasPermission } = useAuth()
  const { apiRequest } = useApi()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Estados de diálogos
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Permisos para pacientes
  const canViewPatients = hasPermission("40") // view_patient
  const canConsultPatients = hasPermission("41") // consult_patient
  const canCreatePatient = hasPermission("37") // add_patient
  const canEditPatient = hasPermission("38") // change_patient
  const canDeletePatient = hasPermission("39") // delete_patient

  // El usuario necesita al menos view_patient o consult_patient para acceder
  const canAccessPatients = canViewPatients || canConsultPatients

  // Cargar pacientes
  useEffect(() => {
    const fetchPatients = async () => {
      if (!canAccessPatients) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        if (env.DEBUG_MODE) {
          console.log("Cargando pacientes...")
        }

        const response = await apiRequest(env.PATIENTS_ACTIVE_ENDPOINT)

        if (response.ok) {
          const patientsData = await response.json()

          if (env.DEBUG_MODE) {
            console.log(`✅ Pacientes cargados: ${patientsData.length}`)
            if (patientsData.length > 0) {
              console.log("Estructura del primer paciente:", patientsData[0])
              console.log("created_by:", patientsData[0].created_by)
              console.log("updated_by:", patientsData[0].updated_by)
            }
          }

          setPatients(patientsData)
          setFilteredPatients(patientsData)
        } else {
          console.error("❌ Error al cargar pacientes:", response.status)
          setError("Error al cargar los pacientes")
        }
      } catch (err) {
        console.error("❌ Error al cargar datos:", err)
        setError("Error al cargar los datos. Por favor, intenta nuevamente.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [apiRequest, canAccessPatients])

  // Filtrar pacientes por búsqueda - DNI como filtro principal
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients)
    } else {
      const filtered = patients.filter((patient) => {
        const searchLower = searchTerm.toLowerCase()

        // Priorizar búsqueda por DNI (exacta y parcial)
        if (patient.dni.includes(searchTerm)) {
          return true
        }

        // Búsqueda secundaria en otros campos
        return (
          `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchLower) ||
          patient.email.toLowerCase().includes(searchLower) ||
          patient.phone_mobile.includes(searchTerm) ||
          patient.phone_landline.includes(searchTerm)
        )
      })

      // Ordenar resultados: DNI exacto primero, luego DNI parcial, luego otros
      filtered.sort((a, b) => {
        const aExactDni = a.dni === searchTerm
        const bExactDni = b.dni === searchTerm
        const aPartialDni = a.dni.includes(searchTerm)
        const bPartialDni = b.dni.includes(searchTerm)

        if (aExactDni && !bExactDni) return -1
        if (!aExactDni && bExactDni) return 1
        if (aPartialDni && !bPartialDni) return -1
        if (!aPartialDni && bPartialDni) return 1

        return 0
      })

      setFilteredPatients(filtered)
    }
  }, [searchTerm, patients])

  // Función para actualizar un paciente
  const updatePatient = (updatedPatientData: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updatedPatientData.id ? updatedPatientData : p)))
  }

  // Función para agregar un nuevo paciente
  const addPatient = (newPatientData: Patient) => {
    setPatients((prev) => [...prev, newPatientData])
  }

  const handleSelectPatient = (patient: Patient, action: string) => {
    setSelectedPatient(patient)
    switch (action) {
      case "delete":
        setIsDeleting(true)
        break
    }
  }

  const closeAllDialogs = () => {
    setSelectedPatient(null)
    setIsCreating(false)
    setIsDeleting(false)
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-4 px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6 flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-[#204983] animate-spin mb-2" />
            <p className="text-gray-600">Cargando pacientes...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto py-4 px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Gestión de Pacientes</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        </div>
      </div>
    )
  }

  if (!canAccessPatients) {
    return (
      <div className="w-full max-w-7xl mx-auto py-4 px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Gestión de Pacientes</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>No tienes permisos para acceder a esta sección.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full mx-auto py-4 px-4">
      {/* Header Container - Responsive */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Gestión de Pacientes</h1>
          {canCreatePatient && (
            <Button className="bg-[#204983] w-full sm:w-auto" onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Paciente
            </Button>
          )}
        </div>
      </div>

      {/* Search Container - Responsive */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Buscar por DNI, nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-10 md:h-12 text-base md:text-lg"
          />
        </div>
        <p className="text-xs md:text-sm text-gray-500 mt-2">
          Tip: La búsqueda por DNI tiene prioridad y mostrará resultados exactos primero
        </p>
      </div>

      {/* Patients List */}
      <div className="space-y-4">
        <PatientGrid
          patients={filteredPatients}
          onSelectPatient={handleSelectPatient}
          canEdit={canEditPatient}
          canDelete={canDeletePatient}
          setPatients={setPatients}
          updatePatient={updatePatient}
          apiRequest={apiRequest}
        />
      </div>

      {/* Diálogos */}
      <CreatePatientDialog
        isOpen={isCreating}
        onClose={closeAllDialogs}
        setPatients={setPatients}
        addPatient={addPatient}
        apiRequest={apiRequest}
      />

      <DeletePatientDialog
        isOpen={isDeleting}
        onClose={closeAllDialogs}
        patient={selectedPatient}
        setPatients={setPatients}
        apiRequest={apiRequest}
      />
    </div>
  )
}
