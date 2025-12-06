"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MEDICAL_ENDPOINTS } from "@/config/api"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"
import { HistoryList } from "@/components/common/history-list"
import type { Medico } from "@/types"

interface MedicoDetailsDialogProps {
  isOpen: boolean
  medico: Medico
  onClose: () => void
}

export function MedicoDetailsDialog({ isOpen, medico, onClose }: MedicoDetailsDialogProps) {
  const [fullMedico, setFullMedico] = useState<Medico | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { apiRequest } = useApi()

  useEffect(() => {
    if (isOpen && medico.id) {
      fetchMedicoDetails()
    }
  }, [isOpen, medico.id])

  const fetchMedicoDetails = async () => {
    setIsLoading(true)
    try {
      const response = await apiRequest(`${MEDICAL_ENDPOINTS.DOCTORS}${medico.id}/`)

      if (!response.ok) {
        throw new Error("Error al cargar detalles del médico")
      }

      const data: Medico = await response.json()
      setFullMedico(data)
    } catch (error) {
      toast.error("Error al cargar los detalles del médico")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const medicoData = fullMedico || medico

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Médico</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#204983]"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border">{medicoData.first_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border">{medicoData.last_name}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border">{medicoData.license}</p>
                </div>
              </div>
            </div>

            {fullMedico?.history && fullMedico.history.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Historial de Cambios</h3>
                <HistoryList history={fullMedico.history} />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 text-center">Sin historial de cambios</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
