"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { UIEvent } from "react"
import useAuth from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import { USER_ENDPOINTS } from "@/config/api"
import { toast } from "sonner"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash, Plus, AlertCircle } from "lucide-react"
import type { Role, Permission } from "@/types"

// Extendemos Role para incluir detalle de permisos
type RoleWithDetails = Role & {
  permission_details?: Permission[]
  permissions?: number[]
}

interface RoleManagementProps {
  roles: RoleWithDetails[]
  setRoles: React.Dispatch<React.SetStateAction<RoleWithDetails[]>>
  refreshData: () => Promise<void>
}

export function RoleManagement({ roles, setRoles, refreshData }: RoleManagementProps) {
  const { hasPermission } = useAuth()
  const { apiRequest } = useApi()

  // Permisos de UI
  const canView = hasPermission("12") // view_group
  const canCreate = hasPermission("9") // add_group
  const canEdit = hasPermission("10") // change_group
  const canDelete = hasPermission("11") // delete_group

  // Permisos paginados (scroll infinito)
  const [allPerms, setAllPerms] = useState<Permission[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMorePerms, setHasMorePerms] = useState(true)
  const [loadingPerms, setLoadingPerms] = useState(false)
  const permsContainerRef = useRef<HTMLDivElement>(null)

  const loadMorePerms = async () => {
    if (loadingPerms || !hasMorePerms) return
    setLoadingPerms(true)
    try {
      const res = await apiRequest(`${USER_ENDPOINTS.PERMISSIONS}?limit=20&offset=${offset}`)
      if (!res.ok) {
        setHasMorePerms(false)
        return
      }
      const data = await res.json()
      const batch: Permission[] = data.results || []
      setAllPerms((prev) => [...prev, ...batch])
      setOffset((prev) => prev + batch.length)
      if (!data.next || batch.length < 20) {
        setHasMorePerms(false)
      }
    } catch {
      setHasMorePerms(false)
    } finally {
      setLoadingPerms(false)
    }
  }

  useEffect(() => {
    loadMorePerms()
  }, [])

  const onPermsScroll = (e: UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget
    if (t.scrollTop + t.clientHeight >= t.scrollHeight - 20) {
      loadMorePerms()
    }
  }

  const validRoles = roles.filter((r) => r.id)

  // Estado de diálogo y formulario
  const [selectedRole, setSelectedRole] = useState<RoleWithDetails | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState<{ name: string; permissions: number[] }>({
    name: "",
    permissions: [],
  })

  const resetForm = () => {
    setFormData({ name: "", permissions: [] })
    setSelectedRole(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePermissionToggle = (permId: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked ? [...prev.permissions, permId] : prev.permissions.filter((id) => id !== permId),
    }))
  }

  const handleSelectRole = (role: RoleWithDetails) => {
    setSelectedRole(role)
    const existing: number[] = Array.isArray(role.permission_details)
      ? role.permission_details.map((p) => p.id)
      : Array.isArray(role.permissions)
        ? role.permissions
        : []
    setFormData({ name: role.name, permissions: existing })
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre del rol es requerido")
      return
    }
    const id = toast.loading("Creando rol...")
    try {
      const res = await apiRequest(USER_ENDPOINTS.ROLES, {
        method: "POST",
        body: { name: formData.name.trim(), permissions: formData.permissions },
      })
      toast.dismiss(id)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error desconocido" }))
        toast.error("Error al crear rol", { description: err.detail })
        return
      }
      const newRole = await res.json()
      setRoles((prev) => [...prev, newRole])
      await refreshData()
      toast.success("Rol creado")
      setIsCreating(false)
      resetForm()
    } catch {
      toast.dismiss(id)
      toast.error("Error inesperado al crear rol")
    }
  }

  const handleEdit = async () => {
    if (!selectedRole?.id) return
    if (!formData.name.trim()) {
      toast.error("El nombre del rol es requerido")
      return
    }
    const id = toast.loading("Actualizando rol...")
    try {
      const res = await apiRequest(USER_ENDPOINTS.ROLE_DETAIL(selectedRole.id), {
        method: "PUT",
        body: { name: formData.name.trim(), permissions: formData.permissions },
      })
      toast.dismiss(id)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error desconocido" }))
        toast.error("Error al actualizar rol", { description: err.detail })
        return
      }
      await refreshData()
      toast.success("Rol actualizado")
      setIsEditing(false)
      resetForm()
    } catch {
      toast.dismiss(id)
      toast.error("Error inesperado al actualizar rol")
    }
  }

  const handleDelete = async () => {
    if (!selectedRole?.id) return
    const id = toast.loading("Eliminando rol...")
    try {
      const res = await apiRequest(USER_ENDPOINTS.ROLE_DETAIL(selectedRole.id), { method: "DELETE" })
      toast.dismiss(id)
      if (!res.ok) {
        toast.error("Error al eliminar rol")
        return
      }
      setRoles((prev) => prev.filter((r) => r.id !== selectedRole.id))
      toast.success("Rol eliminado")
      setIsDeleting(false)
      resetForm()
    } catch {
      toast.dismiss(id)
      toast.error("Error inesperado al eliminar rol")
    }
  }

  if (!canView) return null

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Lista de Roles</h2>
        {canCreate && (
          <Dialog
            open={isCreating}
            onOpenChange={(open) => {
              setIsCreating(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-[#204983] text-white">
                <Plus className="mr-2 h-4 w-4" /> Crear Rol
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Rol</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Nombre del Rol</Label>
                  <Input name="name" value={formData.name} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Permisos ({formData.permissions.length})</Label>
                  <div
                    ref={permsContainerRef}
                    onScroll={onPermsScroll}
                    className="max-h-60 overflow-y-auto border rounded-md p-3"
                  >
                    {allPerms.map((perm) => (
                      <div key={perm.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`perm-${perm.id}`}
                          checked={formData.permissions.includes(perm.id)}
                          onCheckedChange={(ch) => handlePermissionToggle(perm.id, ch === true)}
                        />
                        <Label htmlFor={`perm-${perm.id}`} className="cursor-pointer text-sm">
                          {perm.name}
                        </Label>
                      </div>
                    ))}
                    {loadingPerms && <p className="text-center py-2">Cargando más permisos…</p>}
                    {!hasMorePerms && allPerms.length === 0 && (
                      <p className="text-gray-500 text-sm">No hay permisos disponibles.</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleCreate}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Permisos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permission_details && role.permission_details.length > 0 ? (
                      role.permission_details.slice(0, 3).map((p) => (
                        <Badge key={p.id} variant="secondary" className="text-xs">
                          {p.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">Sin permisos</span>
                    )}
                    {role.permission_details && role.permission_details.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permission_details.length - 3} más
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {/* Ver */}
                    <Dialog
                      open={isViewing && selectedRole?.id === role.id}
                      onOpenChange={(open) => {
                        setIsViewing(open)
                        if (!open) resetForm()
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleSelectRole(role)
                            setIsViewing(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      {selectedRole && (
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Detalles del Rol</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Nombre</Label>
                              <p className="mt-1 text-gray-700">{selectedRole.name}</p>
                            </div>
                            <div>
                              <Label>Permisos</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedRole.permission_details && selectedRole.permission_details.length > 0 ? (
                                  selectedRole.permission_details.map((p) => (
                                    <Badge key={p.id} variant="secondary" className="text-xs">
                                      {p.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-gray-500 text-sm">Sin permisos</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cerrar</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      )}
                    </Dialog>

                    {/* Editar */}
                    {canEdit && (
                      <Dialog
                        open={isEditing && selectedRole?.id === role.id}
                        onOpenChange={(open) => {
                          setIsEditing(open)
                          if (!open) resetForm()
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleSelectRole(role)
                              setIsEditing(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {selectedRole && (
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Editar Rol</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label>Nombre del Rol</Label>
                                <Input name="name" value={formData.name} onChange={handleInputChange} />
                              </div>
                              <div>
                                <Label>Permisos ({formData.permissions.length})</Label>
                                <div
                                  onScroll={onPermsScroll}
                                  className="max-h-60 overflow-y-auto border rounded-md p-3"
                                >
                                  {allPerms.map((perm) => (
                                    <div key={perm.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`perm-${perm.id}`}
                                        checked={formData.permissions.includes(perm.id)}
                                        onCheckedChange={(ch) => handlePermissionToggle(perm.id, ch === true)}
                                      />
                                      <Label htmlFor={`perm-${perm.id}`} className="cursor-pointer text-sm">
                                        {perm.name}
                                      </Label>
                                    </div>
                                  ))}
                                  {loadingPerms && <p className="text-center py-2">Cargando más permisos…</p>}
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                              </DialogClose>
                              <Button onClick={handleEdit}>Guardar</Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    )}

                    {/* Eliminar */}
                    {canDelete && (
                      <Dialog
                        open={isDeleting && selectedRole?.id === role.id}
                        onOpenChange={(open) => {
                          setIsDeleting(open)
                          if (!open) resetForm()
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 hover:bg-red-50 bg-transparent"
                            onClick={() => {
                              handleSelectRole(role)
                              setIsDeleting(true)
                            }}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </DialogTrigger>
                        {selectedRole && (
                          <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                              <DialogTitle>Eliminar Rol</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p>
                                ¿Estás seguro que deseas eliminar el rol <strong>{selectedRole.name}</strong>?
                              </p>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                              </DialogClose>
                              <Button variant="destructive" onClick={handleDelete}>
                                Eliminar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {validRoles.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-4 text-center">
                  <div className="flex flex-col items-center text-gray-500">
                    <AlertCircle className="mb-2 h-8 w-8" />
                    <p>No hay roles disponibles</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
