"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import type { User, Permission } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { ApiRequestOptions } from "@/hooks/use-api"

interface TempPermissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  permissions: Permission[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  apiRequest: (url: string, options?: ApiRequestOptions) => Promise<Response>
}

export function TempPermissionDialog({
  open,
  onOpenChange,
  user,
  permissions,
  setUsers,
  apiRequest,
}: TempPermissionDialogProps) {
  const { success, error: showError } = useToast()
  const [permissionData, setPermissionData] = useState({
    permission_id: "",
    duration_minutes: 60,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Obtener permisos disponibles (que el usuario NO tiene)
  const availablePermissions = useMemo(() => {
    if (!user || !permissions || !Array.isArray(permissions)) {
      return []
    }

    // Obtener IDs de permisos que ya tiene el usuario
    const userPermissionIds = user.permissions?.map((perm) => perm.id) || []

    // Filtrar permisos que el usuario NO tiene
    return permissions.filter((perm) => !userPermissionIds.includes(perm.id))
  }, [user, permissions])

  useEffect(() => {
    if (open && user) {
      if (availablePermissions.length > 0) {
        setPermissionData({
          permission_id: availablePermissions[0].id.toString(),
          duration_minutes: 60,
        })
      } else {
        setPermissionData({ permission_id: "", duration_minutes: 60 })
      }
    } else if (!open) {
      setPermissionData({ permission_id: "", duration_minutes: 60 })
      setIsSubmitting(false)
    }
  }, [open, user, availablePermissions])

  const handleAssignTempPermission = async () => {
    if (!user || !permissionData.permission_id) return

    setIsSubmitting(true)

    try {
      const response = await apiRequest(
        `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_USERS_ENDPOINT}${user.id}/assign-temp-permission/`,
        {
          method: "POST",
          body: {
            permission_id: Number.parseInt(permissionData.permission_id),
            duration_minutes: permissionData.duration_minutes,
          },
        },
      )

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
        success("Permiso temporal asignado", { description: "El permiso ha sido asignado temporalmente exitosamente." })
        onOpenChange(false)
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        showError("Error al asignar permiso temporal", {
          description: errorData.detail || "Ha ocurrido un error al asignar el permiso temporal.",
        })
      }
    } catch (err) {
      console.error("Error al asignar permiso temporal:", err)
      showError("Error", { description: "Ha ocurrido un error de red o inesperado." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Asignar Permiso Temporal</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {availablePermissions.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Selecciona el permiso y la duración para <strong>{user.username}</strong>:
              </p>

              <div className="space-y-2">
                <Label htmlFor="permission">Permiso</Label>
                <Select
                  value={permissionData.permission_id}
                  onValueChange={(value) => setPermissionData((prev) => ({ ...prev, permission_id: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar permiso" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePermissions.map((perm) => (
                      <SelectItem key={perm.id} value={perm.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{perm.name || perm.codename}</span>
                          <span className="text-xs text-gray-500">{perm.codename}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={permissionData.duration_minutes}
                  onChange={(e) => setPermissionData((prev) => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                  min="1"
                  max="10080"
                  disabled={isSubmitting}
                  placeholder="60"
                />
                <p className="text-xs text-gray-500">Máximo 10,080 minutos (7 días)</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center py-8">
              <div className="text-gray-400">
                <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Todos los permisos asignados</h3>
              <p className="text-gray-500">
                Este usuario ya tiene todos los permisos disponibles o no hay permisos adicionales para asignar.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleAssignTempPermission}
            disabled={isSubmitting || availablePermissions.length === 0}
            className="bg-[#204983] hover:bg-[#1a3d6b]"
          >
            {isSubmitting ? "Asignando..." : "Asignar Permiso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
