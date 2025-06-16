"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "@/components/admin/management-page"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { env } from "@/config/env"

interface EditUserDialogProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  apiRequest: (url: string, options?: any) => Promise<Response>
}

export function EditUserDialog({ isOpen, onClose, user, setUsers, apiRequest }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    is_active: true,
    photo: null as File | null,
  })

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: "",
        is_active: user.is_active,
        photo: null, // Siempre null para permitir nueva selección
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({
      ...prev,
      photo: file,
    }))
  }

  const handleUpdateUser = async () => {
    if (!user) return

    try {
      const loadingId = toast.loading("Actualizando usuario...")

      if (env.DEBUG_MODE) {
        console.log("Actualizando usuario:", user.username)
        console.log("Con nueva foto:", formData.photo ? formData.photo.name : "Sin cambio de foto")
      }

      // Crear FormData para enviar archivos
      const formDataToSend = new FormData()
      formDataToSend.append("username", formData.username)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("first_name", formData.first_name)
      formDataToSend.append("last_name", formData.last_name)
      formDataToSend.append("is_active", formData.is_active.toString())

      // Solo incluir password si se proporcionó uno nuevo
      if (formData.password && formData.password.trim() !== "") {
        formDataToSend.append("password", formData.password)
      }

      // Agregar foto si se seleccionó una nueva
      if (formData.photo) {
        formDataToSend.append("photo", formData.photo)
      }

      const response = await apiRequest(`${env.USERS_ENDPOINT}${user.id}/`, {
        method: "PATCH",
        body: formDataToSend,
      })

      toast.dismiss(loadingId)

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
        toast.success("Usuario actualizado", {
          description: `El usuario ${updatedUser.username} ha sido actualizado exitosamente.`,
          duration: env.TOAST_DURATION,
        })
        onClose()
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        toast.error("Error al actualizar usuario", {
          description: errorData.detail || "Ha ocurrido un error al actualizar el usuario.",
          duration: env.TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      toast.error("Error", {
        description: "Ha ocurrido un error al actualizar el usuario.",
        duration: env.TOAST_DURATION,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <div className="space-y-2">
            <Label htmlFor="edit-photo">Foto de perfil</Label>
            <Input
              id="edit-photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {formData.photo && <p className="text-sm text-gray-600">Archivo seleccionado: {formData.photo.name}</p>}
            <p className="text-xs text-gray-500">Selecciona una nueva imagen para cambiar la foto actual</p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-is_active"
              name="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked === true }))}
            />
            <Label htmlFor="edit-is_active">Usuario activo</Label>
          </div>
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
  )
}
