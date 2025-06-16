"use client"

import type React from "react"
import { useState } from "react"
import type { User, Permission } from "@/components/admin/management-page"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { env } from "@/config/env"

interface TempPermissionDialogProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  permissions: Permission[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  apiRequest: (url: string, options?: any) => Promise<Response>
}

export function TempPermissionDialog({
  isOpen,
  onClose,
  user,
  permissions,
  setUsers,
  apiRequest,
}: TempPermissionDialogProps) {
  const [tempPermissionData, setTempPermissionData] = useState({
    permission: "",
    expires_at: "",
  })

  const handleAssignTempPermission = async () => {
    if (!user || !tempPermissionData.permission || !tempPermissionData.expires_at) return

    try {
      const loadingId = toast.loading("Asignando permiso temporal...")

      const response = await apiRequest(`${env.USERS_ENDPOINT}${user.id}/temp-permissions/`, {
        method: "POST",
        body: {
          permission: Number.parseInt(tempPermissionData.permission),
          expires_at: new Date(tempPermissionData.expires_at).toISOString(),
        },
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))

        toast.success("Permiso temporal asignado", {
          description: "El permiso temporal ha sido asignado exitosamente.",
          duration: env.TOAST_DURATION,
        })
        setTempPermissionData({ permission: "", expires_at: "" })
        onClose()
      } else {
        const errorData = await response.json()
        toast.error("Error al asignar permiso temporal", {
          description: errorData.detail || "Ha ocurrido un error al asignar el permiso temporal.",
          duration: env.TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("Error al asignar permiso temporal:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al asignar el permiso temporal.",
        duration: env.TOAST_DURATION,
      })
    }
  }

  const handleClose = () => {
    setTempPermissionData({ permission: "", expires_at: "" })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Asignar Permiso Temporal</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="permission">Permiso</Label>
            <Select
              value={tempPermissionData.permission}
              onValueChange={(value) => setTempPermissionData((prev) => ({ ...prev, permission: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar permiso" />
              </SelectTrigger>
              <SelectContent>
                {permissions.map((permission) => (
                  <SelectItem key={permission.id} value={permission.id.toString()}>
                    {permission.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expires_at">Fecha de expiración</Label>
            <Input
              id="expires_at"
              name="expires_at"
              type="datetime-local"
              value={tempPermissionData.expires_at}
              onChange={(e) => setTempPermissionData((prev) => ({ ...prev, expires_at: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button className="bg-[#204983]" onClick={handleAssignTempPermission}>
            Asignar Permiso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
