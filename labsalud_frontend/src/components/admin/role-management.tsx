"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import type { Role, Permission } from "./management-page"
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
import { Plus, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { env } from "@/config/env"

interface RoleManagementProps {
  roles: Role[]
  permissions: Permission[]
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>
}

export function RoleManagement({ roles, permissions, setRoles }: RoleManagementProps) {
  const { hasPermission } = useAuth()
  const { apiRequest } = useApi()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as number[],
  })

  // Permisos
  const canCreateRole = hasPermission("33")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePermissionChange = (permissionId: string, checked: boolean): void => {
    setFormData((prev) => {
      if (checked) {
        return { ...prev, permissions: [...prev.permissions, Number.parseInt(permissionId)] }
      } else {
        return { ...prev, permissions: prev.permissions.filter((id) => id !== Number.parseInt(permissionId)) }
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
    setSelectedRole(role)
    setFormData({
      name: role.name,
      permissions: role.permissions,
    })
  }

  const handleCreateRole = async (): Promise<void> => {
    try {
      const loadingId = toast.loading("Creando rol...")

      if (env.DEBUG_MODE) {
        console.log("Creando rol:", formData.name)
      }

      const response = await apiRequest(env.ROLES_ENDPOINT, {
        method: "POST",
        body: formData,
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const newRole = await response.json()
        setRoles((prev) => [...prev, newRole])
        toast.success("Rol creado", {
          description: `El rol ${newRole.name} ha sido creado exitosamente.`,
          duration: env.TOAST_DURATION,
        })
        resetForm()
      } else {
        const errorData = await response.json()
        toast.error("Error al crear rol", {
          description: errorData.detail || "Ha ocurrido un error al crear el rol.",
          duration: env.TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("Error al crear rol:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al crear el rol.",
        duration: env.TOAST_DURATION,
      })
    }
  }

  // Función para obtener el nombre del permiso por ID
  const getPermissionName = (permissionId: number): string => {
    const permission = permissions.find((p) => p.id === permissionId)
    return permission ? permission.name : "Desconocido"
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
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Rol</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Rol</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nombre del rol"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permisos</Label>
                  <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`permission-${permission.id}`}
                          checked={formData.permissions.includes(permission.id)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(permission.id.toString(), checked === true)
                          }
                        />
                        <Label htmlFor={`permission-${permission.id}`} className="text-sm">
                          {permission.name}
                        </Label>
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
                    handleCreateRole()
                    setIsCreating(false)
                  }}
                >
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
            {roles.length > 0 ? (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permId) => (
                        <span key={permId} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          {getPermissionName(permId)}
                        </span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          +{role.permissions.length - 3} más
                        </span>
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
                                  {role.permissions.map((permId) => (
                                    <div key={permId} className="flex items-center py-1 border-b last:border-0">
                                      <span className="text-sm">{getPermissionName(permId)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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
