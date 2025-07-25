"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, User } from "lucide-react"

interface Medico {
  id: number
  first_name: string
  last_name: string
  license: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: {
    id: number
    username: string
    first_name: string
    last_name: string
    photo?: string
  } | null
  updated_by: Array<{
    id: number
    username: string
    first_name: string
    last_name: string
    photo?: string
    updated_at: string
  }>
}

interface MedicoDetailsDialogProps {
  isOpen: boolean
  medico: Medico
  onClose: () => void
}

export const MedicoDetailsDialog: React.FC<MedicoDetailsDialogProps> = ({ isOpen, medico, onClose }) => {
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
                <p className="text-sm text-gray-900 bg-white p-2 rounded border">{medico.first_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border">{medico.last_name}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                <p className="text-sm text-gray-900 bg-white p-2 rounded border">{medico.license}</p>
              </div>
            </div>
          </div>

          {/* Información de Auditoría */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Auditoría</h3>

            {/* Creado por */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Creado por</label>
              <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                <Avatar className="h-10 w-10">
                  {medico.created_by === null ? (
                    <AvatarFallback className="bg-gray-100">
                      <Settings className="h-5 w-5 text-gray-600" />
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={medico.created_by.photo || "/placeholder.svg"} />
                      <AvatarFallback className="bg-blue-100">
                        {medico.created_by.username ? (
                          medico.created_by.username.charAt(0).toUpperCase()
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {medico.created_by === null ? "Sistema" : medico.created_by.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(medico.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Modificado por */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Historial de Modificaciones</label>
              <div className="bg-white rounded border">
                {medico.updated_by.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    Todavía no se realizó ninguna actualización
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {medico.updated_by.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3 p-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photo || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-100">
                            {user.username ? user.username.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{user.username}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(user.updated_at).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
