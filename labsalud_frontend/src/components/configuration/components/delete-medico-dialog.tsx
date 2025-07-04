"use client"

import { useState } from "react"
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
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"

interface Medico {
  id: number
  first_name: string
  last_name: string
  license: string
}

interface DeleteMedicoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medico: Medico
  onSuccess: () => void
}

export function DeleteMedicoDialog({ open, onOpenChange, medico, onSuccess }: DeleteMedicoDialogProps) {
  const [loading, setLoading] = useState(false)
  const { apiRequest } = useApi()

  const handleDelete = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/api/analysis/medicos/${medico.id}/`, {
        method: "DELETE",
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Error al eliminar el médico")
      }
    } catch (error) {
      toast.error("Error al eliminar el médico")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente al médico{" "}
            <strong>{`${medico.first_name} ${medico.last_name}`}</strong> (MP {medico.license}). Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
