"use client"

import { User, Stethoscope, Building, TestTube, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Switch } from "../../ui/switch"
import { Label } from "../../ui/label"
import { Input } from "../../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { PatientSearch } from "./patient-search"
import { MedicoCombobox } from "./medico-combobox"
import { ObraSocialCombobox } from "./obra-social-combobox"
import { AnalysisSearch } from "./analysis-search"
import { AnalysisTable } from "./analysis-table"
import type { Patient, Medico, ObraSocial, AnalysisPanel } from "../../../types"

interface ProtocolFormProps {
  patient: Patient | null
  medicos: Medico[]
  obrasSociales: ObraSocial[]
  selectedAnalyses: AnalysisPanel[]
  selectedMedico: Medico | null
  selectedObraSocial: ObraSocial | null
  paid: boolean
  contactMethod: string
  oossNumber: string
  onAnalysisChange: (analyses: AnalysisPanel[]) => void
  onMedicoSelect: (medico: Medico | null) => void
  onObraSocialSelect: (obraSocial: ObraSocial | null) => void
  onPatientFound: (patient: Patient) => void
  onPatientNotFound: (dni: string) => void
  onReset: () => void
  onShowCreateMedico: () => void
  onShowCreateObraSocial: () => void
  onPaidChange: (paid: boolean) => void
  onContactMethodChange: (method: string) => void
  onOossNumberChange: (number: string) => void
}

export function ProtocolForm({
  medicos,
  obrasSociales,
  selectedAnalyses,
  selectedMedico,
  selectedObraSocial,
  paid,
  contactMethod,
  oossNumber,
  onAnalysisChange,
  onMedicoSelect,
  onObraSocialSelect,
  onPatientFound,
  onPatientNotFound,
  onReset,
  onShowCreateMedico,
  onShowCreateObraSocial,
  onPaidChange,
  onContactMethodChange,
  onOossNumberChange,
}: ProtocolFormProps) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="text-center text-[#204983] text-lg sm:text-xl">Configuración del Protocolo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Búsqueda de Paciente */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-[#204983]" />
            <h3 className="text-base sm:text-lg font-semibold text-[#204983]">Paciente</h3>
          </div>
          <PatientSearch onPatientFound={onPatientFound} onPatientNotFound={onPatientNotFound} onReset={onReset} />
        </div>

        {/* Selección de Médico */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-[#204983]" />
            <h3 className="text-base sm:text-lg font-semibold text-[#204983]">Médico</h3>
          </div>
          <MedicoCombobox
            medicos={medicos}
            selectedMedico={selectedMedico}
            onMedicoSelect={onMedicoSelect}
            onShowCreateMedico={onShowCreateMedico}
          />
        </div>

        {/* Selección de Obra Social */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 sm:h-5 sm:w-5 text-[#204983]" />
            <h3 className="text-base sm:text-lg font-semibold text-[#204983]">Obra Social</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="sm:flex-grow">
              <ObraSocialCombobox
                obrasSociales={obrasSociales}
                selectedObraSocial={selectedObraSocial}
                onObraSocialSelect={onObraSocialSelect}
                onShowCreateObraSocial={onShowCreateObraSocial}
              />
            </div>
            <div className="sm:w-1/3">
              <Input
                placeholder="Número de afiliado"
                value={oossNumber}
                onChange={(e) => onOossNumberChange(e.target.value)}
                className="h-10 w-full"
                required
              />
            </div>
          </div>
        </div>

        {/* Configuración de Pago */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 sm:h-5 sm:w-5 text-[#204983]" />
            <h3 className="text-base sm:text-lg font-semibold text-[#204983]">Configuración de Envío</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="paid" checked={paid} onCheckedChange={onPaidChange} />
              <Label htmlFor="paid" className="text-sm sm:text-base">
                Pagado
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_method" className="text-sm sm:text-base">
                Método de envío
              </Label>
              <Select value={contactMethod} onValueChange={onContactMethodChange}>
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="physical">Retiro físico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Búsqueda y Selección de Análisis */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2">
            <TestTube className="h-4 w-4 sm:h-5 sm:w-5 text-[#204983]" />
            <h3 className="text-base sm:text-lg font-semibold text-[#204983]">Búsqueda de Paneles</h3>
          </div>
          <AnalysisSearch selectedAnalyses={selectedAnalyses} onAnalysisChange={onAnalysisChange} />
        </div>

        {/* Tabla de Análisis Seleccionados */}
        <AnalysisTable selectedAnalyses={selectedAnalyses} onAnalysisChange={onAnalysisChange} />
      </CardContent>
    </Card>
  )
}
