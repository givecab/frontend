"use client"

import { useState, useEffect } from "react"
import type { User, Permission } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { ApiRequestOptions } from "@/hooks/use-api"

interface TempPermissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  apiRequest: (url: string, options?: ApiRequestOptions) => Promise<Response>
}

export function TempPermissionDialog({
  open,
  onOpenChange,
  user,
  setUsers,
  apiRequest,
}: TempPermissionDialogProps) {
  const { success, error: showError } = useToast()

  const [missingPerms, setMissingPerms] = useState<Permission[]>([])
  const [loadingPerms, setLoadingPerms] = useState(false)

  const [permissionId, setPermissionId] = useState<string>("")
  const [duration, setDuration] = useState<number>(60)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carga los permisos que el usuario aún no posee
  useEffect(() => {
    if (!open || !user) return

    let cancelled = false
    async function fetchMissing() {
      setLoadingPerms(true)
      try {
        if (!user) return
        const res = await apiRequest(
          `/api/users/${user.id}/missing-permissions/`,
          { method: "GET" }
        )
        if (!cancelled && res.ok) {
          const data: Permission[] = await res.json()
          setMissingPerms(data)
          // Preseleccionar el primero (si existe)
          if (data.length > 0) {
            setPermissionId(data[0].id.toString())
          } else {
            setPermissionId("")
          }
        } else if (!cancelled) {
          setMissingPerms([])
          setPermissionId("")
        }
      } catch {
        if (!cancelled) {
          setMissingPerms([])
          setPermissionId("")
        }
      } finally {
        if (!cancelled) setLoadingPerms(false)
      }
    }

    fetchMissing()
    return () => {
      cancelled = true
      setMissingPerms([])
      setPermissionId("")
      setLoadingPerms(false)
    }
  }, [open, user, apiRequest])

  const handleAssign = async () => {
    if (!user || !permissionId) return

    setIsSubmitting(true)
    try {
      const res = await apiRequest(
        `/api/users/${user.id}/assign-temp-permission/`,
        {
          method: "POST",
          body: {
            permission_id: Number(permissionId),
            duration_minutes: duration,
          },
        }
      )
      if (res.ok) {
        const updatedUser = await res.json()
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
        success("Permiso temporal asignado")
        onOpenChange(false)
      } else {
        const err = await res.json().catch(() => ({ detail: "Error desconocido" }))
        showError("No se pudo asignar el permiso", { description: err.detail })
      }
    } catch {
      showError("Error de red al asignar permiso")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Asignar Permiso Temporal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loadingPerms ? (
            <p className="text-center">Cargando permisos…</p>
          ) : missingPerms.length === 0 ? (
            <p className="text-center text-gray-500">
              El usuario ya tiene todos los permisos disponibles.
            </p>
          ) : (
            <>
              <div>
                <Label>Permiso</Label>
                <Select
                  value={permissionId}
                  onValueChange={setPermissionId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un permiso" />
                  </SelectTrigger>
                  <SelectContent>
                    {missingPerms.map(perm => (
                      <SelectItem key={perm.id} value={perm.id.toString()}>
                        {perm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duración (minutos)</Label>
                <Input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleAssign}
            disabled={isSubmitting || missingPerms.length === 0}
          >
            {isSubmitting ? "Asignando…" : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}