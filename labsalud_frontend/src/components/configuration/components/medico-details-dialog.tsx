"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, History, Clock, Calendar } from "lucide-react"

interface Medico {
  id: number
  first_name: string
  last_name: string
  license: string
  is_active: boolean
  created_at: string
  created_by: {
    id: number
    username: string
    photo: string
  } | null
  history: HistoryEntry[]
}

interface HistoryEntry {
  version: number
  user: {
    id: number
    username: string
    photo: string 
  } | null
  created_at: string
}

interface MedicoDetailsDialogProps {
  isOpen: boolean
  medico: Medico
  onClose: () => void
}

const UserAvatar: React.FC<{
  user: { id: number; username: string; photo: string } | null | undefined
  size?: "sm" | "md"
}> = ({ user, size = "md" }) => {
  const sizeClasses = size === "sm" ? "h-6 w-6" : "h-8 w-8"

  if (!user || !user.username || user.username.trim() === "") {
    return (
      <Avatar className={sizeClasses}>
        <AvatarFallback className="text-xs bg-gray-200 text-gray-500">
          <Settings className="h-3 w-3 text-gray-600" />
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className={sizeClasses}>
      <AvatarImage src={user.photo || undefined} alt={user.username} />
      <AvatarFallback className="text-xs bg-slate-200 text-slate-700">
        {user.username.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

export function MedicoDetailsDialog({ isOpen, medico, onClose }: MedicoDetailsDialogProps) {

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getUserDisplayName = (user: { id: number; username: string; photo: string } | null | undefined) => {
    if (!user || !user.username || user.username.trim() === "") {
      return "Sistema"
    }
    return user.username
  }

  const getCreationInfo = () => {
    if (medico.history && medico.history.length > 0) {
      // La primera entrada del history es la creación (version 1)
      const creationEntry = medico.history.find((entry) => entry.version === 1)
      if (creationEntry) {
        return {
          user: creationEntry.user,
          date: creationEntry.created_at,
        }
      }
    }
    // Fallback a los datos originales
    return {
      user: medico.created_by,
      date: medico.created_at,
    }
  }

  const getLatestUpdate = () => {
    if (medico.history && medico.history.length > 1) {
      // Ordenar por version descendente y tomar la más reciente
      const sortedHistory = [...medico.history].sort((a, b) => b.version - a.version)
      const latestEntry = sortedHistory[0]

      if (latestEntry.version > 1) {
        return {
          user: latestEntry.user,
          date: latestEntry.created_at,
          version: latestEntry.version,
        }
      }
    }
    return null
  }

  const creationInfo = getCreationInfo()
  const latestUpdate = getLatestUpdate()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles del Médico</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Personal */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border">{medico.first_name} {medico.last_name}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border">{medico.license}</p>
              </div>
            </div>
          </div>

          {/* Información de auditoría */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <History className="h-4 w-4 text-gray-400" />
                    Registro de Auditoría
                  </h4>

                  {/* Información de creación */}
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Creado</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <UserAvatar user={creationInfo.user} />
                        <div>
                          <p className="text-sm text-gray-600">{getUserDisplayName(creationInfo.user)}</p>
                          <p className="text-xs text-gray-500">{formatDate(creationInfo.date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información de última actualización */}
                  {latestUpdate ? (
                    <div className="flex items-start space-x-3">
                      <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Última modificación</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <UserAvatar user={latestUpdate.user} />
                          <div>
                            <p className="text-sm text-gray-600">{getUserDisplayName(latestUpdate.user)}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(latestUpdate.date)} • Versión {latestUpdate.version}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-3">
                      <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Actualizaciones</p>
                        <p className="text-sm text-gray-500 mt-1">Sin actualizaciones</p>
                      </div>
                    </div>
                  )}

                  {/* Historial completo si hay múltiples versiones */}
                  {medico.history && medico.history.length >= 2 && (
                    <div className="flex items-start space-x-3">
                      <History className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          Historial completo ({medico.history.length} versiones)
                        </p>
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                          {medico.history
                            .sort((a, b) => b.version - a.version)
                            .slice(0, 5) // Mostrar solo las últimas 5 versiones
                            .map((entry) => (
                              <div key={entry.version} className="flex items-center space-x-2 text-xs">
                                <UserAvatar user={entry.user} size="sm" />
                                <div className="flex-1">
                                  <span className="text-gray-600">
                                    {getUserDisplayName(entry.user)} • v{entry.version}
                                  </span>
                                  <span className="text-gray-500 ml-2">{formatDate(entry.created_at)}</span>
                                </div>
                              </div>
                            ))}
                          {medico.history.length > 5 && (
                            <p className="text-xs text-gray-500 italic">
                              ... y {medico.history.length - 5} versiones más
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
