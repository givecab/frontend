"use client"

import type React from "react"

import { useState, useEffect } from "react"
import useAuth from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Lock, Camera, AlertCircle, CheckCircle, Eye, EyeOff, Clock, Shield, History } from "lucide-react"
import { toast } from "sonner"
import { USER_ENDPOINTS, TOAST_DURATION } from "@/config/api"
import type { ProfileData } from "@/types"
import { HistoryList } from "@/components/common/history-list"

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
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiRequest(USER_ENDPOINTS.ME, {
          method: "GET",
        })

        if (response.ok) {
          const data: ProfileData = await response.json()
          setProfileData(data)
          setFormData((prev) => ({
            ...prev,
            email: data.email || "",
          }))
        } else {
          toast.error("Error al cargar el perfil", {
            duration: TOAST_DURATION,
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Error de conexión al cargar el perfil", {
          duration: TOAST_DURATION,
        })
      } finally {
        setIsLoadingProfile(false)
      }
    }

    if (user) {
      fetchProfile()
    }
  }, [user, apiRequest])

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
      if (formData.email !== profileData?.email) {
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
        const response = await apiRequest(USER_ENDPOINTS.ME, {
          method: "PATCH",
          body: formDataToSend,
        })

        if (response.ok) {
          const updatedProfile: ProfileData = await response.json()
          setProfileData(updatedProfile)

          // Obtener el usuario actual del localStorage
          const currentUserData = localStorage.getItem("user")
          if (currentUserData) {
            const currentUser = JSON.parse(currentUserData)

            // Actualizar solo los campos que pueden haber cambiado
            const updatedUserData = {
              ...currentUser,
              email: updatedProfile.email || currentUser.email,
              photo: updatedProfile.photo !== undefined ? updatedProfile.photo : currentUser.photo,
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
          toast.error(errorData.detail || errorData.message || "Error al actualizar el perfil", {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user || isLoadingProfile) {
    return (
      <div className="w-full max-w-4xl mx-auto py-4 px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-4 space-y-6">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6">
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
                ) : profileData?.photo ? (
                  <img
                    src={profileData.photo || "/placeholder.svg"}
                    alt={`${profileData.username} avatar`}
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
                <Input id="username" value={profileData?.username || ""} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">No se puede modificar</p>
              </div>
              <div>
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={`${profileData?.first_name || ""} ${profileData?.last_name || ""}`.trim()}
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

        {profileData && profileData.active_temp_permissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Permisos Temporales Activos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profileData.active_temp_permissions.map((perm, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{perm.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{perm.reason}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Expira: {formatDate(perm.expires_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {profileData && profileData.history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Historial de Cambios</span>
                </div>
                <span className="text-sm text-gray-500">{profileData.total_changes} cambios totales</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryList history={profileData.history} maxItems={5} />
            </CardContent>
          </Card>
        )}

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
