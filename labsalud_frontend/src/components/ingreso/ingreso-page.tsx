"use client"

import { useState, useEffect } from "react"
import { FileText } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { toast } from "sonner"
import { ProtocolForm } from "./components/protocol-form"
import { PatientInfo } from "./components/patient-info"
import { CreatePatientForm } from "./components/create-patient-form"
import { EditPatientDialog } from "./components/edit-patient-dialog"
import { CreateMedicoForm } from "./components/create-medico-form"
import { CreateObraSocialForm } from "./components/create-obra-social-form"
import { ProtocolSuccess } from "./components/protocol-success"
import { useApi } from "../../hooks/use-api"
import useAuth from "../../contexts/auth-context"
import type { Patient, Medico, ObraSocial, AnalysisPanel } from "../../types"

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export default function IngresoPage() {
  const { hasPermission } = useAuth()
  const { apiRequest } = useApi()

  // Estados principales
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null)
  const [patientNotFound, setPatientNotFound] = useState(false)
  const [searchedDni, setSearchedDni] = useState("")
  const [selectedAnalyses, setSelectedAnalyses] = useState<AnalysisPanel[]>([])
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null)
  const [selectedObraSocial, setSelectedObraSocial] = useState<ObraSocial | null>(null)
  const [showEditPatient, setShowEditPatient] = useState(false)
  const [paid, setPaid] = useState(false)
  const [contactMethod, setContactMethod] = useState("email")
  const [oossNumber, setOossNumber] = useState("")

  // Estados de datos
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estados de formularios adicionales
  const [showCreateMedico, setShowCreateMedico] = useState(false)
  const [showCreateObraSocial, setShowCreateObraSocial] = useState(false)
  const [protocolCreated, setProtocolCreated] = useState<any>(null)
  const [isCreatingProtocol, setIsCreatingProtocol] = useState(false)

  // Verificar permisos
  const canCreateProtocol = hasPermission(71) // add_protocol

  useEffect(() => {
    if (canCreateProtocol) {
      loadInitialData()
    }
  }, [canCreateProtocol])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const baseUrl = import.meta.env.VITE_API_BASE_URL

      const [medicosResponse, oossResponse] = await Promise.all([
        apiRequest(`${baseUrl}/api/analysis/medicos/active/?limit=20&offset=0`),
        apiRequest(`${baseUrl}/api/analysis/ooss/?limit=20&offset=0&is_active=true`),
      ])

      if (medicosResponse.ok) {
        const medicosData: PaginatedResponse<Medico> = await medicosResponse.json()
        setMedicos(medicosData.results)
      }

      if (oossResponse.ok) {
        const oossData: PaginatedResponse<ObraSocial> = await oossResponse.json()
        setObrasSociales(oossData.results)
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
      toast.error("Error al cargar los datos iniciales")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditPatient = () => {
    setShowEditPatient(true)
  }

  const handlePatientUpdated = (updatedPatient: Patient) => {
    setCurrentPatient(updatedPatient)
    setShowEditPatient(false)
  }

  const handlePatientFound = (patient: Patient) => {
    setCurrentPatient(patient)
    setPatientNotFound(false)
    setSearchedDni("")
  }

  const handlePatientNotFound = (dni: string) => {
    setCurrentPatient(null)
    setPatientNotFound(true)
    setSearchedDni(dni)
  }

  const handlePatientCreated = (patient: Patient) => {
    setCurrentPatient(patient)
    setPatientNotFound(false)
    setSearchedDni("")
  }

  const handleMedicoCreated = (medico: Medico) => {
    setMedicos([...medicos, medico])
    setShowCreateMedico(false)
    toast.success("Médico creado exitosamente")
  }

  const handleObraSocialCreated = (obraSocial: ObraSocial) => {
    setObrasSociales([...obrasSociales, obraSocial])
    setShowCreateObraSocial(false)
    toast.success("Obra social creada exitosamente")
  }

  const handleReset = () => {
    setCurrentPatient(null)
    setPatientNotFound(false)
    setSearchedDni("")
    setSelectedAnalyses([])
    setSelectedMedico(null)
    setSelectedObraSocial(null)
    setShowCreateMedico(false)
    setShowCreateObraSocial(false)
    setProtocolCreated(null)
    setPaid(false)
    setContactMethod("email")
    setOossNumber("")
  }

  const handleProtocolCreated = (protocol: any) => {
    setProtocolCreated(protocol)
    // Reset después de 5 segundos
    setTimeout(() => {
      handleReset()
    }, 5000)
  }

  const handleCreateProtocol = async () => {
    if (!currentPatient) {
      toast.error("Seleccione un paciente")
      return
    }

    if (!selectedMedico) {
      toast.error("Seleccione un médico")
      return
    }

    if (!selectedObraSocial) {
      toast.error("Seleccione una obra social")
      return
    }

    if (selectedAnalyses.length === 0) {
      toast.error("Seleccione al menos un panel")
      return
    }

    try {
      setIsCreatingProtocol(true)
      const baseUrl = import.meta.env.VITE_API_BASE_URL

      // Paso 1: Crear el protocolo
      const protocolData = {
        patient: Number(currentPatient.id),
        medico: Number(selectedMedico.id),
        ooss: Number(selectedObraSocial.id),
        ooss_number: oossNumber || null,
        contact_method: contactMethod,
        paid: paid,
      }

      console.log("Creating protocol with data:", protocolData)

      const protocolResponse = await apiRequest(`${baseUrl}/api/analysis/protocols/`, {
        method: "POST",
        body: protocolData,
      })

      if (!protocolResponse.ok) {
        const errorData = await protocolResponse.json()
        console.error("Protocol creation error:", errorData)
        throw new Error(`Error creating protocol: ${JSON.stringify(errorData)}`)
      }

      // Obtener la URL del header Location
      const locationHeader = protocolResponse.headers.get("Location")
      if (!locationHeader) {
        throw new Error("No se recibió el header Location del servidor")
      }

      console.log("Protocol created, location header:", locationHeader)

      // Paso 2: Generar análisis usando el endpoint /generate-analyses/
      const generateAnalysesUrl = `${locationHeader}generate-analyses/`
      const panelIds = selectedAnalyses.map((panel) => panel.id)

      console.log("Generating analyses for panels:", panelIds)

      const generateAnalysesResponse = await apiRequest(generateAnalysesUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          panels: panelIds,
        }),
      })

      if (!generateAnalysesResponse.ok) {
        const errorData = await generateAnalysesResponse.json()
        console.error("Generate analyses error:", errorData)
        throw new Error(`Error generating analyses: ${JSON.stringify(errorData)}`)
      }

      console.log("Analyses generated successfully")

      // Obtener los datos del protocolo creado
      const newProtocol = await protocolResponse.json()

      // Esperar a que termine la animación del botón (3 segundos)
      await new Promise((resolve) => setTimeout(resolve, 3000))

      handleProtocolCreated(newProtocol)
      toast.success("Protocolo creado exitosamente")
    } catch (error) {
      console.error("Error creating protocol:", error)
      toast.error("Error al crear el protocolo")
    } finally {
      setIsCreatingProtocol(false)
    }
  }

  if (!canCreateProtocol) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin Permisos</h3>
            <p className="text-gray-600 text-center">No tienes permisos para crear protocolos.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#204983]" />
      </div>
    )
  }

  const showRightPanel = currentPatient || patientNotFound
  const isFormValid = currentPatient && selectedMedico && selectedObraSocial && selectedAnalyses.length > 0

  return (
    <div className="min-h-screen p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con contenedor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Ingreso de Protocolos</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Busque un paciente y configure su protocolo de análisis
            </p>
          </div>
        </div>

        {/* Layout responsive: columnas en desktop, stack en móvil */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 justify-center">
          {/* Panel Principal */}
          <div
            className={`
              w-full transition-all duration-500 ease-in-out
              ${showRightPanel ? "lg:w-full lg:max-w-xl lg:transform lg:-translate-x-2" : "lg:max-w-3xl"}
            `}
          >
            <ProtocolForm
              patient={currentPatient}
              medicos={medicos}
              obrasSociales={obrasSociales}
              selectedAnalyses={selectedAnalyses}
              selectedMedico={selectedMedico}
              selectedObraSocial={selectedObraSocial}
              paid={paid}
              contactMethod={contactMethod}
              oossNumber={oossNumber}
              onAnalysisChange={setSelectedAnalyses}
              onMedicoSelect={setSelectedMedico}
              onObraSocialSelect={setSelectedObraSocial}
              onPatientFound={handlePatientFound}
              onPatientNotFound={handlePatientNotFound}
              onReset={handleReset}
              onShowCreateMedico={() => setShowCreateMedico(true)}
              onShowCreateObraSocial={() => setShowCreateObraSocial(true)}
              onPaidChange={setPaid}
              onContactMethodChange={setContactMethod}
              onOossNumberChange={setOossNumber}
            />
          </div>

          {/* Panel Derecho - En móvil aparece debajo, en desktop a la derecha */}
          <div
            className={`
              w-full transition-all duration-500 ease-in-out
              ${
                showRightPanel
                  ? "lg:w-full lg:max-w-xl opacity-100 transform translate-x-0"
                  : "lg:w-0 lg:opacity-0 lg:transform lg:translate-x-full lg:overflow-hidden"
              }
            `}
          >
            {currentPatient && (
              <div className="space-y-4">
                <PatientInfo patient={currentPatient} onEdit={handleEditPatient} />

                {showCreateMedico && (
                  <CreateMedicoForm onMedicoCreated={handleMedicoCreated} onCancel={() => setShowCreateMedico(false)} />
                )}

                {showCreateObraSocial && (
                  <CreateObraSocialForm
                    onObraSocialCreated={handleObraSocialCreated}
                    onCancel={() => setShowCreateObraSocial(false)}
                  />
                )}
              </div>
            )}

            {patientNotFound && (
              <CreatePatientForm
                initialDni={searchedDni}
                onPatientCreated={handlePatientCreated}
                onCancel={() => setPatientNotFound(false)}
              />
            )}
          </div>
        </div>

        {/* Botón de crear protocolo - Responsive */}
        {currentPatient && (
          <div className="mt-4 sm:mt-6 flex justify-center px-2 sm:px-0">
            <div
              className={`
                w-full transition-all duration-500 ease-in-out
                ${showRightPanel ? "max-w-full lg:max-w-4xl" : "max-w-full lg:max-w-3xl"}
              `}
            >
              <Button
                onClick={handleCreateProtocol}
                disabled={!isFormValid}
                className={`
                  w-full h-12 sm:h-14 lg:h-16 text-white text-base sm:text-lg font-semibold 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  relative overflow-hidden transition-all duration-300
                  ${
                    isCreatingProtocol
                      ? "bg-[#3a5a8a] hover:bg-[#3a5a8a] cursor-wait"
                      : "bg-[#204983] hover:bg-[#2d5a9b]"
                  }
                `}
              >
                {/* Barra de progreso dentro del botón */}
                {isCreatingProtocol && (
                  <div
                    className="absolute inset-0 bg-[#204983] transition-all duration-3000 ease-out"
                    style={{
                      width: "100%",
                      animation: "fillButton 3s ease-out forwards",
                    }}
                  />
                )}

                {/* Contenido del botón */}
                <div className="relative z-10 flex items-center justify-center">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="text-sm sm:text-base lg:text-lg">
                    {isCreatingProtocol ? "Creando protocolo..." : "Crear Protocolo"}
                  </span>
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* Edit Patient Dialog */}
        <EditPatientDialog
          isOpen={showEditPatient}
          onClose={() => setShowEditPatient(false)}
          patient={currentPatient}
          onPatientUpdated={handlePatientUpdated}
        />

        {/* Protocol Success Modal */}
        {protocolCreated && (
          <ProtocolSuccess
            protocol={protocolCreated}
            patient={currentPatient}
            onClose={() => setProtocolCreated(null)}
          />
        )}
      </div>

      <style>{`
        @keyframes fillButton {
          0% { 
            width: 0%; 
            background-color: #3a5a8a;
          }
          50% { 
            width: 50%; 
            background-color: #2d5a9b;
          }
          100% { 
            width: 100%; 
            background-color: #204983;
          }
        }
      `}</style>
    </div>
  )
}
