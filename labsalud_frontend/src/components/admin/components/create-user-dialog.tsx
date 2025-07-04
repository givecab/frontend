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
    id: 0,
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    groups: [] as number[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const savedData = localStorage.getItem("create-user-form")
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          setUserData({ ...userData, ...parsed, password: "" }) // Don't save password
        } catch (e) {
          console.error("Error parsing saved user data:", e)
        }
      }
    } else {
      setUserData({
        id: 0,
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        groups: [],
      })
      setIsSubmitting(false)
      localStorage.removeItem("create-user-form")
    }
  }, [open])

  const saveUserData = useCallback((data: typeof userData) => {
    const { password, ...dataToSave } = data
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

  const handleRoleChange = useCallback((roleId: number, checked: boolean) => {
    setUserData((prev) => ({
      ...prev,
      groups: checked ? [...prev.groups, roleId] : prev.groups.filter((id) => id !== roleId),
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await apiRequest(`${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_USERS_ENDPOINT}`, {
        method: "POST",
        body: userData,
      })

      if (response.ok) {
        const newUser = await response.json()
        setUsers((prev) => [newUser, ...prev])
        await refreshData()
        success("Usuario creado", {
          description: "El nuevo usuario ha sido creado exitosamente.",
        })
        onOpenChange(false)
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }))
        showError("Error al crear usuario", {
          description: errorData.detail || "Ha ocurrido un error al crear el usuario.",
        })
      }
    } catch (err) {
      console.error("Error al crear usuario:", err)
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
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                name="first_name"
                value={userData.first_name}
                onChange={handleChange}
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                name="last_name"
                value={userData.last_name}
                onChange={handleChange}
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
            <Label>Roles</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {Array.isArray(roles) && roles.length > 0 ? (
                roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={userData.groups.includes(role.id)}
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
