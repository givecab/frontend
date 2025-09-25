"use client"

import type React from "react"

import { useState, useEffect } from "react"
import useAuth from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Lock, Camera, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { AUTH_ENDPOINTS, TOAST_DURATION } from "@/config/api"

interface ProfileFormData {
  email: string
  password: string
  photo?: File
}

interface ValidationErrors {
  email?: string
  password?: string
  photo?: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { apiRequest } = useApi()
  const [formData, setFormData] = useState<ProfileFormData>({
    email: user?.email || "",
    password: "",
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
      }))
    }
  }, [user])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Ingresa un email válido"
    }

    // Validar foto
    if (formData.photo) {
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (formData.photo.size > maxSize) {
        newErrors.photo = "La imagen debe ser menor a 5MB"
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(formData.photo.type)) {
        newErrors.photo = "Solo se permiten archivos JPG, PNG o GIF"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }))

      // Crear preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Limpiar error de foto
      if (errors.photo) {
        setErrors((prev) => ({ ...prev, photo: undefined }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()

      // Solo enviar campos que han cambiado
      if (formData.email !== user?.email) {
        formDataToSend.append("email", formData.email)
      }

      if (isChangingPassword && formData.password.trim()) {
        formDataToSend.append("password", formData.password)
      }

      if (formData.photo) {
        formDataToSend.append("photo", formData.photo)
      }

      // Solo hacer la petición si hay algo que actualizar
      if (formDataToSend.has("email") || formDataToSend.has("password") || formDataToSend.has("photo")) {
        const response = await apiRequest(AUTH_ENDPOINTS.ME, {
          method: "PATCH",
          body: formDataToSend,
        })

        if (response.ok) {
          const updatedUser = await response.json()

          // Obtener el usuario actual del localStorage
          const currentUserData = localStorage.getItem("user")
          if (currentUserData) {
            const currentUser = JSON.parse(currentUserData)

            // Actualizar solo los campos que pueden haber cambiado
            const updatedUserData = {
              ...currentUser,
              email: updatedUser.email || currentUser.email,
              photo: updatedUser.photo !== undefined ? updatedUser.photo : currentUser.photo,
            }

            // Guardar el objeto usuario actualizado
            localStorage.setItem("user", JSON.stringify(updatedUserData))
          }

          toast.success("Perfil actualizado correctamente", {
            duration: TOAST_DURATION,
          })

          // Recargar la página para actualizar el contexto
          setTimeout(() => {
            window.location.reload()
          }, 1000)

          // Limpiar campos de contraseña
          setFormData((prev) => ({
            ...prev,
            password: "",
            photo: undefined,
          }))
          setIsChangingPassword(false)
          setPhotoPreview(null)
        } else {
          const errorData = await response.json()
          toast.error(errorData.message || "Error al actualizar el perfil", {
            duration: TOAST_DURATION,
          })
        }
      } else {
        toast.info("No hay cambios para guardar", {
          duration: TOAST_DURATION,
        })
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      toast.error("Error de conexión. Intenta nuevamente.", {
        duration: TOAST_DURATION,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto py-4 px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Gestiona tu información personal y configuración de cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información Personal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Foto de Perfil */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border border-gray-300"
                  />
                ) : user.photo ? (
                  <img
                    src={user.photo || "/placeholder.svg"}
                    alt={`${user.username} avatar`}
                    className="w-20 h-20 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#204983] flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-[#204983] text-white p-2 rounded-full cursor-pointer hover:bg-[#1a3d6f] transition-colors">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Foto de Perfil</p>
                <p className="text-xs text-gray-500">JPG, PNG o GIF. Máximo 5MB.</p>
                {errors.photo && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{errors.photo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Campos de solo lectura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input id="username" value={user.username} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">No se puede modificar</p>
              </div>
              <div>
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={`${user.first_name || ""} ${user.last_name || ""}`.trim()}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">No se puede modificar</p>
              </div>
            </div>

            {/* Email editable */}
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 ${errors.email ? "border-red-300 focus:ring-red-500" : ""}`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email ? (
                <div className="flex items-center space-x-1 mt-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">{errors.email}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Email válido</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cambio de Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Cambiar Contraseña</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
              >
                {isChangingPassword ? "Cancelar" : "Cambiar"}
              </Button>
            </CardTitle>
          </CardHeader>
          {isChangingPassword && (
            <CardContent className="space-y-4">
              {/* Nueva Contraseña */}
              <div>
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="Nueva contraseña"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Botón de Guardar */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="bg-[#204983] hover:bg-[#1a3d6f]">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
