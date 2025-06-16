"use client"

import type React from "react"
import { useState } from "react"
import type { User, Role } from "@/components/admin/management-page"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { env } from "@/config/env"

interface RoleAssignDialogProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  roles: Role[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  apiRequest: (url: string, options?: any) => Promise<Response>
}

export function RoleAssignDialog({ isOpen, onClose, user, roles, setUsers, apiRequest }: RoleAssignDialogProps) {
  const [roleData, setRoleData] = useState({
    role_id: "",
  })

  const handleAssignRole = async () => {
    if (!user || !roleData.role_id) return

    try {
      const loadingId = toast.loading("Asignando rol...")

      const response = await apiRequest(`${env.USERS_ENDPOINT}${user.id}/assign-role/`, {
        method: "PUT",
        body: {
          role_id: Number.parseInt(roleData.role_id),
        },
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))

        toast.success("Rol asignado", {
          description: "El rol ha sido asignado exitosamente.",
          duration: env.TOAST_DURATION,
        })
        setRoleData({ role_id: "" })
        onClose()
      } else {
        const errorData = await response.json()
        toast.error("Error al asignar rol", {
          description: errorData.detail || "Ha ocurrido un error al asignar el rol.",
          duration: env.TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("Error al asignar rol:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al asignar el rol.",
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
          <DialogTitle>Asignar Rol</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role_id">Rol</Label>
            <Select
              value={roleData.role_id}
              onValueChange={(value) => setRoleData((prev) => ({ ...prev, role_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button className="bg-[#204983]" onClick={handleAssignRole}>
            Asignar Rol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
