"use client"

import { Badge } from "../../ui/badge"
import { FileText, User, Calendar, Building2, AlertCircle, TestTube2, ChevronDown, ChevronUp } from "lucide-react"

interface Patient {
  id: number
  dni: string
  first_name: string
  last_name: string
  birth_date: string
  gender: string
  phone_mobile?: string
  email?: string
}

interface Medico {
  id: number
  first_name: string
  last_name: string
  license: string
}

interface Ooss {
  id: number
  name: string
}

interface Protocol {
  id: number
  patient: Patient
  medico: Medico
  ooss: Ooss
  ooss_number: string
  contact_method: string
  state: string
  paid: boolean
  created_at: string
  is_urgent: boolean
}

interface ProtocolHeaderProps {
  protocol: Protocol
  pendingCount: number
  totalCount: number
  isExpanded: boolean
  onToggle: () => void
}

export function ProtocolHeader({ protocol, pendingCount, totalCount, isExpanded, onToggle }: ProtocolHeaderProps) {
  const patientName = protocol?.patient
    ? `${protocol.patient.first_name || "N/A"} ${protocol.patient.last_name || "N/A"}`
    : "N/A"
  const patientDni = protocol?.patient?.dni || "N/A"
  const oossName = protocol?.ooss?.name || "N/A"
  const protocolState = protocol?.state?.replace("_", " ") || "N/A"
  const createdDate = protocol?.created_at ? new Date(protocol.created_at).toLocaleDateString() : "N/A"

  if (!protocol) {
    return (
      <div className="p-4 bg-gray-100 border-b">
        <div className="text-gray-500">Cargando información del protocolo...</div>
      </div>
    )
  }

  return (
    <div
      className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 cursor-pointer hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Main Info */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-[#204983]" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">Protocolo #{protocol.id}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-3 w-3" />
                <span>{patientName}</span>
                <span className="text-gray-400">•</span>
                <span>DNI: {patientDni}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{createdDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span>{oossName}</span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {protocol.is_urgent && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Urgente
              </Badge>
            )}
            <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-300 text-yellow-700">
              <TestTube2 className="h-3 w-3 mr-1" />
              {pendingCount} pendientes de {totalCount}
            </Badge>
            <Badge
              variant="secondary"
              className={`text-xs ${
                protocol.state === "pending_entry"
                  ? "bg-yellow-100 text-yellow-800"
                  : protocol.state === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {protocolState}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  )
}
