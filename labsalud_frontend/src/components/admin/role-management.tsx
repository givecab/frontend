"use client"

import type React from "react"
import { useState } from "react"
import useAuth from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import type { Role, Permission } from "@/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertCircle, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface RoleManagementProps {
  roles: Role[]
  permissions: Permission[]
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>
  refreshData: () => Promise<void>
}

export function RoleManagement({ roles, permissions, setRoles, refreshData }: RoleManagementProps) {
  const { hasPermission } = useAuth()
  const { apiRequest } = useApi()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as number[],
  })

  // Permisos actualizados
  const canViewRoles = hasPermission("12") // view_group
  const canCreateRole = hasPermission("9") // add_group
  const canEditRole = hasPermission("10") // change_group
  const canDeleteRole = hasPermission("11") // delete_group

  // Validar datos
  const validRoles = Array.isArray(roles) ? roles.filter((role) => role && role.id) : []
  const validPermissions = Array.isArray(permissions)
    ? permissions.filter((permission) => permission && permission.id)
    : []

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    // Sanitizar entrada
    const sanitizedValue = value.trim().slice(0, 100)
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }))
  }

  const handlePermissionChange = (permissionId: string, checked: boolean): void => {
    const id = Number.parseInt(permissionId)
    if (!Number.isInteger(id) || id <= 0) return

    setFormData((prev) => {
      if (checked) {
        return { ...prev, permissions: [...prev.permissions, id] }
      } else {
        return { ...prev, permissions: prev.permissions.filter((pid) => pid !== id) }
      }
    })
  }

  const resetForm = () => {
    setFormData({
      name: "",
      permissions: [],
    })
  }

  const handleSelectRole = (role: Role) => {
    if (!role || !role.id) return
    setSelectedRole(role)

    // Obtener permisos de permission_details o permissions
    let rolePermissions: number[] = []
    if ((role as any).permission_details && Array.isArray((role as any).permission_details)) {
      rolePermissions = (role as any).permission_details.map((p: any) => p.id)
    } else if ((role as any).permissions && Array.isArray((role as any).permissions)) {
      rolePermissions = (role as any).permissions
    }

    setFormData({
      name: role.name || "",
      permissions: rolePermissions,
    })
  }

  const handleCreateRole = async (): Promise<void> => {
    if (!formData.name.trim()) {
      toast.error("El nombre del rol es requerido")
      return
    }

    if (formData.name.length < 2) {
      toast.error("El nombre del rol debe tener al menos 2 caracteres")
      return
    }

    try {
      const loadingId = toast.loading("Creando rol...")

      console.log("Creando rol:", formData.name)

      const response = await apiRequest("api/roles/", {
        method: "POST",
        body: {
          name: formData.name.trim(),
          permissions: formData.permissions,
        },
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const newRole = await response.json()
        if (newRole && newRole.id) {
          setRoles((prev) => [...prev, newRole])
          await refreshData()
          toast.success("Rol creado", {
            description: `El rol ${newRole.name} ha sido creado exitosamente.`,
            duration: Number(import.meta.env.REACT_APP_TOAST_DURATION) || 3000,
          })
          resetForm()
          setIsCreating(false)
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        toast.error("Error al crear rol", {
          description: errorData.detail || "Ha ocurrido un error al crear el rol.",
          duration: Number(import.meta.env.REACT_APP_TOAST_DURATION) || 3000,
        })
      }
    } catch (error) {
      console.error("Error al crear rol:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al crear el rol.",
        duration: Number(import.meta.env.REACT_APP_TOAST_DURATION) || 3000,
      })
    }
  }

  const handleEditRole = async (): Promise<void> => {
    if (!selectedRole || !selectedRole.id) return

    if (!formData.name.trim()) {
      toast.error("El nombre del rol es requerido")
      return
    }

    try {
      const loadingId = toast.loading("Actualizando rol...")

      const response = await apiRequest(`api/roles/${selectedRole.id}/`, {
        method: "PUT",
        body: {
          name: formData.name.trim(),
          permissions: formData.permissions,
        },
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const updatedRole = await response.json()
        if (updatedRole && updatedRole.id) {
          setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)))
          await refreshData()
          toast.success("Rol actualizado exitosamente")
          setIsEditing(false)
          setSelectedRole(null)
          resetForm()
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        toast.error("Error al actualizar rol", {
          description: errorData.detail || "Ha ocurrido un error al actualizar el rol.",
        })
      }
    } catch (error) {
      console.error("Error al actualizar rol:", error)
      toast.error("Error al actualizar el rol")
    }
  }

  const handleDeleteRole = async (): Promise<void> => {
    if (!selectedRole || !selectedRole.id) return

    try {
      const loadingId = toast.loading("Eliminando rol...")

      const response = await apiRequest(`api/roles/${selectedRole.id}/`, {
        method: "DELETE",
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        setRoles((prev) => prev.filter((r) => r.id !== selectedRole.id))
        await refreshData()
        toast.success("Rol eliminado exitosamente")
        setIsDeleting(false)
        setSelectedRole(null)
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        toast.error("Error al eliminar rol", {
          description: errorData.detail || "Ha ocurrido un error al eliminar el rol.",
        })
      }
    } catch (error) {
      console.error("Error al eliminar rol:", error)
      toast.error("Error al eliminar el rol")
    }
  }

  // Función para obtener el nombre del permiso por ID
  const getPermissionName = (permissionId: number): string => {
    const permission = validPermissions.find((p) => p.id === permissionId)
    return permission ? permission.codename : "Desconocido"
  }

  if (!canViewRoles) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>No tienes permiso para ver la lista de roles.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Roles</h2>

        {canCreateRole && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-[#204983]">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Rol
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Rol</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Rol *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nombre del rol"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500">{formData.name.length}/100 caracteres</p>
                </div>
                <div className="space-y-2">
                  <Label>Permisos ({formData.permissions.length} seleccionados)</Label>
                  <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                    {validPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`permission-${permission.id}`}
                          checked={formData.permissions.includes(permission.id)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(permission.id.toString(), checked === true)
                          }
                        />
                        <Label htmlFor={`permission-${permission.id}`} className="text-sm cursor-pointer">
                          {permission.codename}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button className="bg-[#204983]" onClick={handleCreateRole} disabled={!formData.name.trim()}>
                  Crear Rol
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Rol</TableHead>
              <TableHead>Permisos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validRoles.length > 0 ? (
              validRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(role as any).permission_details &&
                      Array.isArray((role as any).permission_details) &&
                      (role as any).permission_details.length > 0 ? (
                        (role as any).permission_details.slice(0, 3).map((perm: any) => (
                          <Badge key={perm.id} variant="secondary" className="text-xs">
                            {perm.codename}
                          </Badge>
                        ))
                      ) : (role as any).permissions &&
                        Array.isArray((role as any).permissions) &&
                        (role as any).permissions.length > 0 ? (
                        (role as any).permissions.slice(0, 3).map((permId: number) => (
                          <Badge key={permId} variant="secondary" className="text-xs">
                            {getPermissionName(permId)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Sin permisos</span>
                      )}
                      {((role as any).permission_details?.length || (role as any).permissions?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{((role as any).permission_details?.length || (role as any).permissions?.length || 0) - 3}{" "}
                          más
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Ver detalles del rol */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleSelectRole(role)}>
                            Ver
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Detalles del Rol</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Nombre del Rol</p>
                              <p className="text-lg font-semibold">{role.name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-2">Permisos</p>
                              <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                                <div className="space-y-1">
                                  {(role as any).permission_details &&
                                  Array.isArray((role as any).permission_details) &&
                                  (role as any).permission_details.length > 0 ? (
                                    (role as any).permission_details.map((perm: any) => (
                                      <div key={perm.id} className="flex items-center py-1 border-b last:border-0">
                                        <span className="text-sm">{perm.codename}</span>
                                      </div>
                                    ))
                                  ) : (role as any).permissions &&
                                    Array.isArray((role as any).permissions) &&
                                    (role as any).permissions.length > 0 ? (
                                    (role as any).permissions.map((permId: number) => (
                                      <div key={permId} className="flex items-center py-1 border-b last:border-0">
                                        <span className="text-sm">{getPermissionName(permId)}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-500">Sin permisos asignados</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Editar rol */}
                      {canEditRole && (
                        <Dialog open={isEditing} onOpenChange={setIsEditing}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                handleSelectRole(role)
                                setIsEditing(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Editar Rol: {selectedRole?.name}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Nombre del Rol *</Label>
                                <Input
                                  id="edit-name"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleInputChange}
                                  placeholder="Nombre del rol"
                                  maxLength={100}
                                />
                                <p className="text-xs text-gray-500">{formData.name.length}/100 caracteres</p>
                              </div>
                              <div className="space-y-2">
                                <Label>Permisos ({formData.permissions.length} seleccionados)</Label>
                                <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                                  {validPermissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`edit-permission-${permission.id}`}
                                        checked={formData.permissions.includes(permission.id)}
                                        onCheckedChange={(checked) =>
                                          handlePermissionChange(permission.id.toString(), checked === true)
                                        }
                                      />
                                      <Label
                                        htmlFor={`edit-permission-${permission.id}`}
                                        className="text-sm cursor-pointer"
                                      >
                                        {permission.codename}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsEditing(false)
                                    resetForm()
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </DialogClose>
                              <Button
                                className="bg-[#204983]"
                                onClick={handleEditRole}
                                disabled={!formData.name.trim()}
                              >
                                Guardar Cambios
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Eliminar rol */}
                      {canDeleteRole && (
                        <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedRole(role)
                                setIsDeleting(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Eliminar Rol</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p>
                                ¿Estás seguro de que deseas eliminar el rol <strong>{selectedRole?.name}</strong>?
                              </p>
                              <p className="text-sm text-gray-600 mt-2">
                                Esta acción no se puede deshacer y puede afectar a los usuarios que tengan este rol
                                asignado.
                              </p>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsDeleting(false)
                                    setSelectedRole(null)
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </DialogClose>
                              <Button className="bg-red-600 hover:bg-red-700" onClick={handleDeleteRole}>
                                Eliminar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="h-8 w-8 mb-2" />
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
