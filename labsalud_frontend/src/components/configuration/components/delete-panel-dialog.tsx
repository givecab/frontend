"use client"

import type React from "react"

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
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2 } from "lucide-react"
import type { AnalysisPanel } from "../configuration-page"

interface DeletePanelDialogProps {
  open: boolean // Cambiado de isOpen a open
  onOpenChange: (open: boolean) => void // Cambiado de onClose a onOpenChange
  onSuccess: () => void
  panel: AnalysisPanel | null
}

export const DeletePanelDialog: React.FC<DeletePanelDialogProps> = ({ open, onOpenChange, onSuccess, panel }) => {
  const { apiRequest } = useApi()
  const toastActions = useToast() // Cambiado a toastActions
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!panel) return

    setIsLoading(true)
    try {
      const response = await apiRequest(import.meta.env.VITE_API_BASE_URL + "/analysis/panels/" + panel.id + "/", {
        method: "DELETE",
      })

      if (response.ok) {
        toastActions.success("Éxito", { description: `Panel "${panel.name}" marcado como inactivo.` })
        onSuccess()
        onOpenChange(false) // Usar onOpenChange
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" })) // Manejo de error si no es JSON
        toastActions.error("Error", { description: errorData.detail || "No se pudo eliminar el panel." })
      }
    } catch (error) {
      console.error("Error deleting panel:", error)
      toastActions.error("Error", { description: "Ocurrió un error inesperado." })
    } finally {
      setIsLoading(false)
    }
  }

  if (!panel) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {" "}
      {/* Usar 'open' y 'onOpenChange' */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <Trash2 className="mr-2 h-5 w-5 text-red-500" />
            Confirmar Desactivación
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas marcar el panel "<strong>{panel.name}</strong>" (Código: {panel.code}) como
            inactivo? Esta acción es reversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={isLoading}>
            {" "}
            {/* Usar onOpenChange */}
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sí, marcar como inactivo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
