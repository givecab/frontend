"use client"

import { User, Building, CreditCard, Send, DollarSign, Printer, History } from "lucide-react"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import type { PaymentStatus } from "@/types"
import { getPaymentStatusInfo } from "./protocol-header"

interface ProtocolDetailsSectionProps {
  patientName: string
  doctorName: string
  insuranceName: string
  affiliateNumber?: string
  sendMethodName: string
  valuePaid: string
  paymentStatus?: PaymentStatus | null
  balance: number
  insuranceUbValue?: string
  privateUbValue?: string
  isPrinted?: boolean
  onOpenHistoryDialog: () => void
  // New payment fields
  insuranceTotalToPay?: string
  privateTotalToPay?: string
  patientToLabAmount?: string
  labToPatientAmount?: string
}

export function ProtocolDetailsSection({
  patientName,
  doctorName,
  insuranceName,
  affiliateNumber,
  sendMethodName,
  valuePaid,
  paymentStatus,
  balance,
  insuranceUbValue,
  privateUbValue,
  isPrinted,
  onOpenHistoryDialog,
  // New payment fields
  insuranceTotalToPay,
  privateTotalToPay,
  patientToLabAmount,
  labToPatientAmount,
}: ProtocolDetailsSectionProps) {
  const paymentStatusInfo = getPaymentStatusInfo(paymentStatus)
  const paymentStatusId = paymentStatus?.id ?? 0

  const patientDebt = Number.parseFloat(patientToLabAmount || "0")
  const labDebt = Number.parseFloat(labToPatientAmount || "0")
  const insuranceTotal = Number.parseFloat(insuranceTotalToPay || "0")
  const privateTotal = Number.parseFloat(privateTotalToPay || "0")

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 w-28 flex-shrink-0">Paciente:</span>
          <span className="font-medium">{patientName}</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 w-28 flex-shrink-0">Médico:</span>
          <span className="font-medium">{doctorName}</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 w-28 flex-shrink-0">Obra Social:</span>
          <span className="font-medium">{insuranceName}</span>
        </div>

        {affiliateNumber && (
          <div className="flex items-center gap-3 text-sm">
            <CreditCard className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 w-28 flex-shrink-0">N° Afiliado:</span>
            <span className="font-medium">{affiliateNumber}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm">
          <Send className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 w-28 flex-shrink-0">Envío:</span>
          <span className="font-medium">{sendMethodName}</span>
        </div>

        {insuranceTotal > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 w-28 flex-shrink-0">Paga O.Social:</span>
            <span className="font-medium text-blue-600">${insuranceTotal.toFixed(2)}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm">
          <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 w-28 flex-shrink-0">A Pagar:</span>
          <span className="font-medium">${privateTotal.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 w-28 flex-shrink-0">Pagado:</span>
          <span className="font-medium text-green-600">${Number.parseFloat(valuePaid || "0").toFixed(2)}</span>
        </div>

        {/* Show patient debt if exists */}
        {patientDebt > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span className="text-gray-600 w-28 flex-shrink-0">Debe Paciente:</span>
            <span className="font-medium text-yellow-600">${patientDebt.toFixed(2)}</span>
          </div>
        )}

        {/* Show lab debt (refund) if exists */}
        {labDebt > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-gray-600 w-28 flex-shrink-0">A Devolver:</span>
            <span className="font-medium text-red-600">${labDebt.toFixed(2)}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm">
          <CreditCard className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 w-28 flex-shrink-0">Estado Pago:</span>
          <Badge className={`${paymentStatusInfo.bgColor} ${paymentStatusInfo.color}`}>{paymentStatusInfo.label}</Badge>
        </div>

        {insuranceUbValue && (
          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 w-28 flex-shrink-0">UB O.Social:</span>
            <span className="font-medium">${insuranceUbValue}</span>
          </div>
        )}

        {privateUbValue && (
          <div className="flex items-center gap-3 text-sm">
            <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 w-28 flex-shrink-0">UB Particular:</span>
            <span className="font-medium">${privateUbValue}</span>
          </div>
        )}

        {isPrinted !== undefined && (
          <div className="flex items-center gap-3 text-sm">
            <Printer className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 w-28 flex-shrink-0">Impreso/Enviado:</span>
            <Badge variant={isPrinted ? "default" : "secondary"}>{isPrinted ? "Sí" : "No"}</Badge>
          </div>
        )}
      </div>

      <div className="pt-4 pb-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <History className="h-4 w-4 text-gray-400" />
            Historial de Cambios
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onOpenHistoryDialog()
            }}
            className="text-xs"
            data-no-expand
          >
            <History className="h-3 w-3 mr-1" />
            Ver Historial
          </Button>
        </div>
      </div>
    </div>
  )
}
