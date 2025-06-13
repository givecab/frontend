"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import type { User, Role, Permission } from "./management-page"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash, Shield, UserPlus, UserMinus, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface UserManagementProps {
  users: User[]
  roles: Role[]
  permissions: Permission[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
}

export function UserManagement({ users, roles, permissions, setUsers }: UserManagementProps) {
  const { hasPermission, user: currentUser } = useAuth()
  const { apiRequest } = useApi()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    is_active: true,
    roles: [] as number[],
  })
  const [tempPermissionData, setTempPermissionData] = useState({
    permission: "",
    expires_at: "",
  })
  const [roleData, setRoleData] = useState({
    role_id: "",
  })

  // Permisos
  const canViewUsers = hasPermission("24")
  const canCreateUser = hasPermission("30")
  const canEditUser = hasPermission("31")
  const canDeleteUser = hasPermission("32")
  const canAssignRole = hasPermission("34")
  const canRemoveRole = hasPermission("35")
  const canManageTempPermissions = hasPermission("36")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData((prev) => {
      if (checked) {
        return { ...prev, roles: [...prev.roles, Number.parseInt(roleId)] }
      } else {
        return { ...prev, roles: prev.roles.filter((id) => id !== Number.parseInt(roleId)) }
      }
    })
  }

  // Eliminar la referencia a is_active en el formulario de creación de usuario
  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      roles: [],
    })
    setTempPermissionData({
      permission: "",
      expires_at: "",
    })
    setRoleData({
      role_id: "",
    })
  }

  // Actualizar la función handleSelectUser para no incluir is_active
  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    if (canEditUser) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: "", // No incluimos la contraseña por seguridad
        roles: user.groups ? user.groups.map((group) => group.id) : [],
      })
    }
  }

  // En la función de crear usuario
  const handleCreateUser = async () => {
    try {
      // Mostrar toast de carga
      const loadingId = toast.loading("Creando usuario...")

      const response = await apiRequest("/api/users/", {
        method: "POST",
        body: formData,
      })

      // Descartar el toast de carga
      toast.dismiss(loadingId)

      if (response.ok) {
        const newUser = await response.json()
        setUsers((prev) => [...prev, newUser])
        toast.success("Usuario creado", {
          description: `El usuario ${newUser.username} ha sido creado exitosamente.`,
        })
        resetForm()
      } else {
        const errorData = await response.json()
        toast.error("Error al crear usuario", {
          description: errorData.detail || "Ha ocurrido un error al crear el usuario.",
        })
      }
    } catch (error) {
      console.error("Error al crear usuario:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al crear el usuario.",
      })
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const loadingId = toast.loading("Actualizando usuario...")

      const response = await apiRequest(`/api/users/${selectedUser.id}/`, {
        method: "PUT",
        body: formData,
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
        toast.success("Usuario actualizado", {
          description: `El usuario ${updatedUser.username} ha sido actualizado exitosamente.`,
        })
        setSelectedUser(null)
        resetForm()
      } else {
        const errorData = await response.json()
        toast.error("Error al actualizar usuario", {
          description: errorData.detail || "Ha ocurrido un error al actualizar el usuario.",
        })
      }
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al actualizar el usuario.",
      })
    }
  }

  // Función para eliminar usuario con confirmación
  const handleDeleteUser = async (userId: number) => {
    try {
      toast("¿Eliminar usuario?", {
        description: "Esta acción no se puede deshacer.",
        action: {
          label: "Confirmar",
          onClick: async () => {
            const loadingId = toast.loading("Eliminando usuario...")

            const response = await apiRequest(`/api/users/${userId}/`, {
              method: "DELETE",
            })

            toast.dismiss(loadingId)

            if (response.ok) {
              setUsers((prev) => prev.filter((u) => u.id !== userId))
              toast.success("Usuario eliminado", {
                description: "El usuario ha sido eliminado exitosamente.",
              })
            } else {
              const errorData = await response.json()
              toast.error("Error al eliminar usuario", {
                description: errorData.detail || "Ha ocurrido un error al eliminar el usuario.",
              })
            }
          },
        },
        duration: 5000, // 5 segundos para decidir
      })
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al eliminar el usuario.",
      })
    }
  }

  // Modificar la función handleAssignTempPermission para actualizar el estado inmediatamente
  const handleAssignTempPermission = async () => {
    if (!selectedUser || !tempPermissionData.permission || !tempPermissionData.expires_at) return

    try {
      const loadingId = toast.loading("Asignando permiso temporal...")

      const response = await apiRequest(`/api/users/${selectedUser.id}/temp-permissions/`, {
        method: "POST",
        body: {
          permission: Number.parseInt(tempPermissionData.permission),
          expires_at: new Date(tempPermissionData.expires_at).toISOString(),
        },
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const updatedUser = await response.json()

        // Actualizar el usuario en el estado local
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))

        // Actualizar el usuario seleccionado si es necesario
        if (selectedUser) {
          setSelectedUser(updatedUser)
        }

        toast.success("Permiso temporal asignado", {
          description: "El permiso temporal ha sido asignado exitosamente.",
        })
        setTempPermissionData({ permission: "", expires_at: "" })
      } else {
        const errorData = await response.json()
        toast.error("Error al asignar permiso temporal", {
          description: errorData.detail || "Ha ocurrido un error al asignar el permiso temporal.",
        })
      }
    } catch (error) {
      console.error("Error al asignar permiso temporal:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al asignar el permiso temporal.",
      })
    }
  }

  const handleRemoveTempPermission = async (userId: number, permissionId: number) => {
    try {
      const loadingId = toast.loading("Eliminando permiso temporal...")

      const response = await apiRequest(`/api/users/${userId}/temp-permissions/${permissionId}/`, {
        method: "DELETE",
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        // Actualizar el usuario en el estado
        const updatedUsers = users.map((u) => {
          if (u.id === userId && u.temp_permissions) {
            return {
              ...u,
              temp_permissions: u.temp_permissions.filter((p) => p.id !== permissionId),
            }
          }
          return u
        })
        setUsers(updatedUsers)

        toast.success("Permiso temporal eliminado", {
          description: "El permiso temporal ha sido eliminado exitosamente.",
        })
      } else {
        const errorData = await response.json()
        toast.error("Error al eliminar permiso temporal", {
          description: errorData.detail || "Ha ocurrido un error al eliminar el permiso temporal.",
        })
      }
    } catch (error) {
      console.error("Error al eliminar permiso temporal:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al eliminar el permiso temporal.",
      })
    }
  }

  // Modificar la función handleAssignRole para actualizar el estado inmediatamente
  const handleAssignRole = async () => {
    if (!selectedUser || !roleData.role_id) return

    try {
      const loadingId = toast.loading("Asignando rol...")

      const response = await apiRequest(`/api/users/${selectedUser.id}/assign-role/`, {
        method: "PUT",
        body: {
          role_id: Number.parseInt(roleData.role_id),
        },
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const updatedUser = await response.json()

        // Actualizar el usuario en el estado local
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))

        // Actualizar el usuario seleccionado si es necesario
        if (selectedUser) {
          setSelectedUser(updatedUser)
        }

        toast.success("Rol asignado", {
          description: "El rol ha sido asignado exitosamente.",
        })
        setRoleData({ role_id: "" })
      } else {
        const errorData = await response.json()
        toast.error("Error al asignar rol", {
          description: errorData.detail || "Ha ocurrido un error al asignar el rol.",
        })
      }
    } catch (error) {
      console.error("Error al asignar rol:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al asignar el rol.",
      })
    }
  }

  // Modificar la función handleRemoveRole para actualizar el estado inmediatamente
  const handleRemoveRole = async () => {
    if (!selectedUser || !roleData.role_id) return

    try {
      const loadingId = toast.loading("Eliminando rol...")

      const response = await apiRequest(`/api/users/${selectedUser.id}/remove-role/`, {
        method: "PUT",
        body: {
          role_id: Number.parseInt(roleData.role_id),
        },
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const updatedUser = await response.json()

        // Actualizar el usuario en el estado local
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))

        // Actualizar el usuario seleccionado si es necesario
        if (selectedUser) {
          setSelectedUser(updatedUser)
        }

        toast.success("Rol eliminado", {
          description: "El rol ha sido eliminado exitosamente.",
        })
        setRoleData({ role_id: "" })
      } else {
        const errorData = await response.json()
        toast.error("Error al eliminar rol", {
          description: errorData.detail || "Ha ocurrido un error al eliminar el rol.",
        })
      }
    } catch (error) {
      console.error("Error al eliminar rol:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al eliminar el rol.",
      })
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Función para obtener el nombre del rol por ID
  const getRoleName = (roleId: number) => {
    const role = roles.find((r) => r.id === roleId)
    return role ? role.name : "Desconocido"
  }

  // Función para obtener el nombre del permiso por ID
  const getPermissionName = (permissionId: number) => {
    const permission = permissions.find((p) => p.id === permissionId)
    return permission ? permission.name : "Desconocido"
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Usuarios</h2>

        {canCreateUser && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-[#204983]">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuario</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Nombre de usuario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Nombre</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Apellido</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Apellido"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Contraseña"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked === true }))}
                  />
                  <Label htmlFor="is_active">Usuario activo</Label>
                </div>
                <div className="space-y-2">
                  <Label>Roles</Label>
                  <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={formData.roles.includes(role.id)}
                          onCheckedChange={(checked) => handleRoleChange(role.id.toString(), checked === true)}
                        />
                        <Label htmlFor={`role-${role.id}`}>{role.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  className="bg-[#204983]"
                  onClick={() => {
                    handleCreateUser()
                    setIsCreating(false)
                  }}
                >
                  Crear Usuario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {canViewUsers ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.groups && user.groups.length > 0
                        ? user.groups.map((group) => group.name).join(", ")
                        : "Sin rol"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {/* Eliminar el botón "Ver" y su diálogo asociado */}

                        {/* Editar usuario */}
                        {canEditUser && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleSelectUser(user)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Editar Usuario</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-username">Usuario</Label>
                                    <Input
                                      id="edit-username"
                                      name="username"
                                      value={formData.username}
                                      onChange={handleInputChange}
                                      placeholder="Nombre de usuario"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                      id="edit-email"
                                      name="email"
                                      type="email"
                                      value={formData.email}
                                      onChange={handleInputChange}
                                      placeholder="correo@ejemplo.com"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-first_name">Nombre</Label>
                                    <Input
                                      id="edit-first_name"
                                      name="first_name"
                                      value={formData.first_name}
                                      onChange={handleInputChange}
                                      placeholder="Nombre"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-last_name">Apellido</Label>
                                    <Input
                                      id="edit-last_name"
                                      name="last_name"
                                      value={formData.last_name}
                                      onChange={handleInputChange}
                                      placeholder="Apellido"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-password">Contraseña (dejar en blanco para no cambiar)</Label>
                                  <Input
                                    id="edit-password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Nueva contraseña"
                                  />
                                </div>
                                {/* Eliminar el checkbox de estado (is_active) */}
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <Button className="bg-[#204983]" onClick={handleUpdateUser}>
                                  Guardar Cambios
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* Asignar permiso temporal */}
                        {canManageTempPermissions && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                <Shield className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Asignar Permiso Temporal</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="permission">Permiso</Label>
                                  <Select
                                    value={tempPermissionData.permission}
                                    onValueChange={(value) =>
                                      setTempPermissionData((prev) => ({ ...prev, permission: value }))
                                    }
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
                                  <div className="flex space-x-2">
                                    <Input
                                      id="expires_at"
                                      name="expires_at"
                                      type="datetime-local"
                                      value={tempPermissionData.expires_at}
                                      onChange={(e) =>
                                        setTempPermissionData((prev) => ({ ...prev, expires_at: e.target.value }))
                                      }
                                    />
                                  </div>
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
                        )}

                        {/* Asignar rol */}
                        {canAssignRole && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
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
                        )}

                        {/* Quitar rol */}
                        {canRemoveRole && user.groups && user.groups.length > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  // Si hay múltiples grupos, seleccionamos el primero por defecto
                                  setRoleData({
                                    role_id: user.groups && user.groups.length > 0 ? user.groups[0].id.toString() : "",
                                  })
                                }}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Quitar Rol</DialogTitle>
                              </DialogHeader>
                              <div className="py-4">
                                {user.groups && user.groups.length > 1 ? (
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
                                    ¿Estás seguro de que deseas quitar el rol <strong>{user.groups[0].name}</strong> del
                                    usuario <strong>{user.username}</strong>?
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
                        )}

                        {/* Eliminar usuario */}
                        {canDeleteUser && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="border-red-200 hover:bg-red-50">
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El usuario <strong>{user.username}</strong> será
                                  eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <AlertCircle className="h-8 w-8 mb-2" />
                      <p>No hay usuarios disponibles</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>No tienes permiso para ver la lista de usuarios.</p>
          </div>
        </div>
      )}
    </div>
  )
}
