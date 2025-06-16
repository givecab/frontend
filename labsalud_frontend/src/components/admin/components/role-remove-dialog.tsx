"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "@/components/admin/management-page"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { env } from "@/config/env"

interface RoleRemoveDialogProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  apiRequest: (url: string, options?: any) => Promise<Response>
}

export function RoleRemoveDialog({ isOpen, onClose, user, setUsers, apiRequest }: RoleRemoveDialogProps) {
  const [roleData, setRoleData] = useState({
    role_id: "",
  })

  useEffect(() => {
    if (user && user.groups && user.groups.length > 0) {
      setRoleData({
        role_id: user.groups[0].id.toString(),
      })
    }
  }, [user])

  const handleRemoveRole = async () => {
    if (!user || !roleData.role_id) return

    try {
      const loadingId = toast.loading("Eliminando rol...")

      const response = await apiRequest(`${env.USERS_ENDPOINT}${user.id}/remove-role/`, {
        method: "PUT",
        body: {
          role_id: Number.parseInt(roleData.role_id),
        },
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))

        toast.success("Rol eliminado", {
          description: "El rol ha sido eliminado exitosamente.",
          duration: env.TOAST_DURATION,
        })
        setRoleData({ role_id: "" })
        onClose()
      } else {
        const errorData = await response.json()
        toast.error("Error al eliminar rol", {
          description: errorData.detail || "Ha ocurrido un error al eliminar el rol.",
          duration: env.TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("Error al eliminar rol:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al eliminar el rol.",
        duration: env.TOAST_DURATION,
      })
    }
  }

  const handleClose = () => {
    setRoleData({ role_id: "" })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quitar Rol</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {user && user.groups && user.groups.length > 1 ? (
            <div className="space-y-4">
              <p>Selecciona el rol que deseas quitar:</p>
              <Select
                value={roleData.role_id}
                onValueChange={(value) => setRoleData((prev) => ({ ...prev, role_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {user.groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p>
              ¿Estás seguro de que deseas quitar el rol{" "}
              <strong>{user?.groups && user.groups.length > 0 ? user.groups[0].name : ""}</strong> del usuario{" "}
              <strong>{user?.username}</strong>?
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleRemoveRole}>
            Quitar Rol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
