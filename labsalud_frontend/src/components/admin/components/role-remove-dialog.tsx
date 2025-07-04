"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import type { User, Role } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { ApiRequestOptions } from "@/hooks/use-api"

interface RoleRemoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  roles: Role[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  apiRequest: (url: string, options?: ApiRequestOptions) => Promise<Response>
  refreshData?: () => Promise<void>
}

export function RoleRemoveDialog({
  open,
  onOpenChange,
  user,
  roles,
  setUsers,
  apiRequest,
  refreshData,
}: RoleRemoveDialogProps) {
  const { success, error: showError } = useToast()
  const [roleData, setRoleData] = useState({
    role_id: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userRoles = useMemo(() => {
    if (!user || !roles || !Array.isArray(roles)) {
      return []
    }

    const userGroups = user.groups || user.roles || []
    const userRoleIds = userGroups.map((group) => group.id)

    const filteredRoles = roles.filter((role) => userRoleIds.includes(role.id))

    return filteredRoles
  }, [user, roles])

  useEffect(() => {
    if (open && user && userRoles.length > 0) {
      const savedData = localStorage.getItem(`role-remove-${user.id}`)
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          if (userRoles.some((role) => role.id.toString() === parsed.role_id)) {
            setRoleData(parsed)
          } else {
            setRoleData({ role_id: userRoles[0].id.toString() })
          }
        } catch (e) {
          console.error("Error parsing saved role remove data:", e)
          setRoleData({ role_id: userRoles[0].id.toString() })
        }
      } else {
        setRoleData({ role_id: userRoles[0].id.toString() })
      }
    } else if (!open) {
      setRoleData({ role_id: "" })
      setIsSubmitting(false)
      localStorage.removeItem(`role-remove-${user?.id}`)
    }
  }, [open, user, userRoles])

  const saveRoleData = useCallback(
    (data: { role_id: string }) => {
      if (user && data.role_id) {
        localStorage.setItem(`role-remove-${user.id}`, JSON.stringify(data))
      }
    },
    [user],
  )

  useEffect(() => {
    if (roleData.role_id) {
      saveRoleData(roleData)
    }
  }, [roleData, saveRoleData])

  const handleRemoveRole = async () => {
    if (!user || !roleData.role_id) return

    setIsSubmitting(true)

    try {
      const response = await apiRequest(
        `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_USERS_ENDPOINT}${user.id}/remove-role/`,
        {
          method: "PUT",
          body: {
            role_id: Number.parseInt(roleData.role_id),
          },
        },
      )

      if (response.ok) {
        const updatedUser = await response.json()

        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))

        if (refreshData) {
          await refreshData()
        }

        success("Rol eliminado", { description: "El rol ha sido eliminado exitosamente." })

        onOpenChange(false)
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        showError("Error al eliminar rol", {
          description: errorData.detail || "Ha ocurrido un error al eliminar el rol.",
        })
      }
    } catch (err) {
      console.error("Error al eliminar rol:", err)
      showError("Error", { description: "Ha ocurrido un error al eliminar el rol." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quitar Rol</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {userRoles.length > 1 ? (
            <div className="space-y-4">
              <p>Selecciona el rol que deseas quitar:</p>
              <Select
                value={roleData.role_id}
                onValueChange={(value) => setRoleData((prev) => ({ ...prev, role_id: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : userRoles.length === 1 ? (
            <p>
              ¿Estás seguro de que deseas quitar el rol <strong>{userRoles[0].name}</strong> del usuario{" "}
              <strong>{user?.username}</strong>?
            </p>
          ) : (
            <div className="space-y-2">
              <p>Este usuario no tiene roles asignados.</p>
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
            className="bg-red-600 hover:bg-red-700"
            onClick={handleRemoveRole}
            disabled={isSubmitting || userRoles.length === 0}
          >
            {isSubmitting ? "Quitando..." : "Quitar Rol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
