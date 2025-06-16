"use client"

import type React from "react"
import { useState } from "react"
import type { User, Role } from "@/components/admin/management-page"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { env } from "@/config/env"

interface CreateUserDialogProps {
  isOpen: boolean
  onClose: () => void
  roles: Role[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  apiRequest: (url: string, options?: any) => Promise<Response>
}

export function CreateUserDialog({ isOpen, onClose, roles, setUsers, apiRequest }: CreateUserDialogProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    is_active: true,
    roles: [] as number[],
    photo: null as File | null,
  })

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

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      is_active: true,
      roles: [],
      photo: null,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({
      ...prev,
      photo: file,
    }))
  }

  const handleCreateUser = async () => {
    try {
      const loadingId = toast.loading("Creando usuario...")

      if (env.DEBUG_MODE) {
        console.log("Creando usuario:", formData.username)
        console.log("Con foto:", formData.photo ? formData.photo.name : "Sin foto")
      }

      // Crear FormData para enviar archivos
      const formDataToSend = new FormData()
      formDataToSend.append("username", formData.username)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("first_name", formData.first_name)
      formDataToSend.append("last_name", formData.last_name)
      formDataToSend.append("password", formData.password)
      formDataToSend.append("is_active", formData.is_active.toString())

      // Agregar roles como array
      formData.roles.forEach((roleId) => {
        formDataToSend.append("roles", roleId.toString())
      })

      // Agregar foto si existe
      if (formData.photo) {
        formDataToSend.append("photo", formData.photo)
      }

      const response = await apiRequest(env.USERS_ENDPOINT, {
        method: "POST",
        body: formDataToSend,
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const newUser = await response.json()
        setUsers((prev) => [...prev, newUser])
        toast.success("Usuario creado", {
          description: `El usuario ${newUser.username} ha sido creado exitosamente.`,
          duration: env.TOAST_DURATION,
        })
        resetForm()
        onClose()
      } else {
        const errorData = await response.json()
        toast.error("Error al crear usuario", {
          description: errorData.detail || "Ha ocurrido un error al crear el usuario.",
          duration: env.TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("Error al crear usuario:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al crear el usuario.",
        duration: env.TOAST_DURATION,
      })
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
          <div className="space-y-2">
            <Label htmlFor="photo">Foto de perfil</Label>
            <Input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {formData.photo && <p className="text-sm text-gray-600">Archivo seleccionado: {formData.photo.name}</p>}
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
          <Button className="bg-[#204983]" onClick={handleCreateUser}>
            Crear Usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
