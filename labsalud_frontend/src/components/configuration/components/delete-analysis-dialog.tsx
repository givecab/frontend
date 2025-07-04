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
import type { AnalysisItem } from "../configuration-page"

interface DeleteAnalysisDialogProps {
  open: boolean // Cambiado de isOpen a open
  onOpenChange: (open: boolean) => void // Cambiado de onClose a onOpenChange
  onSuccess: () => void
  analysis: AnalysisItem | null
}

export const DeleteAnalysisDialog: React.FC<DeleteAnalysisDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  analysis,
}) => {
  const { apiRequest } = useApi()
  const toastActions = useToast() // Corregido
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!analysis) return

    setIsLoading(true)
    try {
      // Para "eliminar" (desactivar) una determinación, usualmente se hace un PATCH
      // cambiando `is_active` a `false`. Un DELETE real podría ser destructivo.
      // Si la API realmente usa DELETE para desactivar, entonces está bien.
      // Si usa PATCH, hay que cambiar el método y el body.
      // Asumiendo que la API usa DELETE para marcar como inactivo (como dice el toast):
      const response = await apiRequest(import.meta.env.VITE_API_BASE_URL + "/analysis/analyses/" + analysis.id + "/", {
        method: "DELETE", // O "PATCH" con body: { is_active: false } si la API lo requiere
      })

      if (response.ok || response.status === 204) {
        // 204 No Content es común para DELETE exitoso
        toastActions.success("Éxito", { description: `Determinación "${analysis.name}" marcada como inactiva.` })
        onSuccess()
        onOpenChange(false)
      } else {
        const errorData = await response.json().catch(() => ({})) // Evitar error si no hay JSON body
        toastActions.error("Error", {
          description: errorData.detail || "No se pudo eliminar/desactivar la determinación.",
        })
      }
    } catch (error) {
      console.error("Error deleting analysis:", error)
      toastActions.error("Error", { description: "Ocurrió un error inesperado." })
    } finally {
      setIsLoading(false)
    }
  }

  if (!analysis) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <Trash2 className="mr-2 h-5 w-5 text-red-500" />
            Confirmar Desactivación
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas marcar la determinación "<strong>{analysis.name}</strong>" (Código:{" "}
            {analysis.code}) como inactiva? Esta acción es reversible editando la determinación.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sí, marcar como inactiva
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
