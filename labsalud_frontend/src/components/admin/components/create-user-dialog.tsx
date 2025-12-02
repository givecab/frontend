"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import type { User, Role } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import type { ApiRequestOptions } from "@/hooks/use-api"
import { USER_ENDPOINTS, AC_ENDPOINTS } from "@/config/api"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: Role[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  apiRequest: (url: string, options?: ApiRequestOptions) => Promise<Response>
  refreshData: () => Promise<void>
}

export function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  setUsers,
  apiRequest,
  refreshData,
}: CreateUserDialogProps) {
  const { success, error: showError } = useToast()
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    photo: null as File | null,
    selectedRoles: [] as number[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const savedData = localStorage.getItem("create-user-form")
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          setUserData({ ...userData, ...parsed, password: "", photo: null }) // Don't save password or photo
        } catch (e) {
          console.error("Error parsing saved user data:", e)
        }
      }
    } else {
      setUserData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        photo: null,
        selectedRoles: [],
      })
      setIsSubmitting(false)
      localStorage.removeItem("create-user-form")
    }
  }, [open])

  const saveUserData = useCallback((data: typeof userData) => {
    const { password, photo, ...dataToSave } = data
    localStorage.setItem("create-user-form", JSON.stringify(dataToSave))
  }, [])

  useEffect(() => {
    if (userData.username || userData.email || userData.first_name || userData.last_name) {
      saveUserData(userData)
    }
  }, [userData, saveUserData])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setUserData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }, [])

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUserData((prev) => ({
        ...prev,
        photo: file,
      }))
    }
  }, [])

  const handleRoleChange = useCallback((roleId: number, checked: boolean) => {
    setUserData((prev) => ({
      ...prev,
      selectedRoles: checked ? [...prev.selectedRoles, roleId] : prev.selectedRoles.filter((id) => id !== roleId),
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log("[v0] Creating user with data:", userData)

      // Step 1: Create user
      const formData = new FormData()
      formData.append("username", userData.username)
      formData.append("password", userData.password)
      formData.append("email", userData.email)
      formData.append("first_name", userData.first_name)
      formData.append("last_name", userData.last_name)
      if (userData.photo) {
        formData.append("photo", userData.photo)
      }

      const createResponse = await apiRequest(USER_ENDPOINTS.USERS, {
        method: "POST",
        body: formData,
        isFormData: true,
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ detail: "Error desconocido" }))
        showError("Error al crear usuario", {
          description: errorData.detail || "Ha ocurrido un error al crear el usuario.",
        })
        setIsSubmitting(false)
        return
      }

      const newUser = await createResponse.json()
      console.log("[v0] User created successfully:", newUser)

      // Step 2: Assign roles if any selected
      let roleAssignmentSuccess = true
      let roleAssignmentMessage = ""

      if (userData.selectedRoles.length > 0) {
        console.log("[v0] Attempting to assign roles:", userData.selectedRoles)

        try {
          const roleResponse = await apiRequest(AC_ENDPOINTS.ROLE_ASSIGN, {
            method: "POST",
            body: {
              user_id: newUser.id,
              role_ids: userData.selectedRoles,
            },
          })

          if (roleResponse.ok) {
            console.log("[v0] Roles assigned successfully")
            roleAssignmentMessage = "Usuario creado y roles asignados exitosamente."
          } else if (roleResponse.status === 401 || roleResponse.status === 403) {
            // Permission denied for role assignment
            console.log("[v0] Permission denied for role assignment")
            roleAssignmentSuccess = false
            roleAssignmentMessage = "Usuario creado exitosamente, pero no tiene permisos para asignar roles."
          } else {
            const errorData = await roleResponse.json().catch(() => ({}))
            console.log("[v0] Role assignment failed:", errorData)
            roleAssignmentSuccess = false
            roleAssignmentMessage = "Usuario creado exitosamente, pero hubo un error al asignar los roles."
          }
        } catch (roleError) {
          console.error("[v0] Error assigning roles:", roleError)
          roleAssignmentSuccess = false
          roleAssignmentMessage = "Usuario creado exitosamente, pero hubo un error al asignar los roles."
        }
      } else {
        roleAssignmentMessage = "Usuario creado exitosamente."
      }

      // Update user list
      setUsers((prev) => [newUser, ...prev])
      await refreshData()

      // Show appropriate message
      if (roleAssignmentSuccess || userData.selectedRoles.length === 0) {
        success("Usuario creado", {
          description: roleAssignmentMessage,
        })
      } else {
        showError("Advertencia", {
          description: roleAssignmentMessage,
        })
      }

      onOpenChange(false)
    } catch (err) {
      console.error("[v0] Error creating user:", err)
      showError("Error", {
        description: "Ha ocurrido un error de red o inesperado.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de usuario *</Label>
              <Input
                id="username"
                name="username"
                value={userData.username}
                onChange={handleChange}
                required
                placeholder="usuario123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userData.email}
                onChange={handleChange}
                required
                placeholder="usuario@ejemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                name="first_name"
                value={userData.first_name}
                onChange={handleChange}
                required
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido *</Label>
              <Input
                id="last_name"
                name="last_name"
                value={userData.last_name}
                onChange={handleChange}
                required
                placeholder="Pérez"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={userData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Foto de perfil</Label>
            <Input id="photo" name="photo" type="file" accept="image/*" onChange={handlePhotoChange} />
            {userData.photo && (
              <p className="text-sm text-muted-foreground">Archivo seleccionado: {userData.photo.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {Array.isArray(roles) && roles.length > 0 ? (
                roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={userData.selectedRoles.includes(role.id)}
                      onCheckedChange={(checked) => handleRoleChange(role.id, Boolean(checked))}
                    />
                    <Label htmlFor={`role-${role.id}`} className="text-sm">
                      {role.name}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-gray-500 text-sm">No hay roles disponibles.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
