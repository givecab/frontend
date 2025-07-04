"use client"

import type React from "react"
import type { Patient } from "../patients-page"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface DeletePatientDialogProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient | null
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>
  apiRequest: (url: string, options?: any) => Promise<Response>
}

export default function DeletePatientDialog({
  isOpen,
  onClose,
  patient,
  setPatients,
  apiRequest,
}: DeletePatientDialogProps) {
  const handleDeletePatient = async () => {
    if (!patient) return

    try {
      const loadingId = toast.loading("Eliminando paciente...")

      const response = await apiRequest(
        `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_PATIENTS_ENDPOINT}${patient.id}/`,
        {
          method: "DELETE",
        },
      )

      toast.dismiss(loadingId)

      if (response.ok) {
        setPatients((prev) => prev.filter((p) => p.id !== patient.id))
        toast.success("Paciente eliminado", {
          description: "El paciente ha sido eliminado exitosamente.",
          duration: Number(import.meta.env.REACT_APP_TOAST_DURATION),
        })
        onClose()
      } else {
        const errorData = await response.json()
        toast.error("Error al eliminar paciente", {
          description: errorData.detail || "Ha ocurrido un error al eliminar el paciente.",
          duration: Number(import.meta.env.REACT_APP_TOAST_DURATION),
        })
      }
    } catch (error) {
      console.error("Error al eliminar paciente:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al eliminar el paciente.",
        duration: Number(import.meta.env.REACT_APP_TOAST_DURATION),
      })
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El paciente{" "}
            <strong>{patient ? `${patient.first_name} ${patient.last_name}` : ""}</strong> será eliminado
            permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeletePatient} className="bg-red-600 hover:bg-red-700">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { DeletePatientDialog }
