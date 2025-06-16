"use client"

import type React from "react"
import type { User } from "@/components/admin/management-page"
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
import { env } from "@/config/env"

interface DeleteUserDialogProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  apiRequest: (url: string, options?: any) => Promise<Response>
}

export function DeleteUserDialog({ isOpen, onClose, user, setUsers, apiRequest }: DeleteUserDialogProps) {
  const handleDeleteUser = async () => {
    if (!user) return

    try {
      const loadingId = toast.loading("Eliminando usuario...")

      const response = await apiRequest(`${env.USERS_ENDPOINT}${user.id}/`, {
        method: "DELETE",
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id))
        toast.success("Usuario eliminado", {
          description: "El usuario ha sido eliminado exitosamente.",
          duration: env.TOAST_DURATION,
        })
        onClose()
      } else {
        const errorData = await response.json()
        toast.error("Error al eliminar usuario", {
          description: errorData.detail || "Ha ocurrido un error al eliminar el usuario.",
          duration: env.TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al eliminar el usuario.",
        duration: env.TOAST_DURATION,
      })
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El usuario <strong>{user?.username}</strong> será eliminado
            permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
