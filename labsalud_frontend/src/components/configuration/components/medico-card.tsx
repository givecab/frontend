"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Trash2, MoreVertical, BriefcaseMedical } from "lucide-react"
import type { Medico, User as UserType } from "../configuration-page"

interface MedicoCardProps {
  medico: Medico
  onEdit?: (medico: Medico) => void
  onDelete?: (medico: Medico) => void // For deactivating
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const UserAvatar: React.FC<{ user: UserType | null | undefined }> = ({ user }) => {
  if (!user) {
    return (
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-xs bg-gray-200 text-gray-500">?</AvatarFallback>
      </Avatar>
    )
  }
  return (
    <Avatar className="h-6 w-6">
      <AvatarImage src={user.photo || undefined} alt={user.username} />
      <AvatarFallback className="text-xs bg-slate-200 text-slate-700">
        {user.username?.substring(0, 2).toUpperCase() || "S"}
      </AvatarFallback>
    </Avatar>
  )
}

export const MedicoCard: React.FC<MedicoCardProps> = ({ medico, onEdit, onDelete }) => {
  const { first_name, last_name, license, is_active, created_by, created_at, updated_by, updated_at } = medico

  const latestUpdater = updated_by && updated_by.length > 0 ? updated_by[updated_by.length - 1] : null

  return (
    <Card
      className={`transition-all duration-200 shadow-sm hover:shadow-md ${!is_active ? "bg-gray-100 opacity-80" : "bg-white"}`}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 bg-[#204983] p-2 rounded-full">
              <BriefcaseMedical className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-800 truncate" title={`${first_name} ${last_name}`}>
                {first_name} {last_name}
              </h3>
              <p className="text-xs text-gray-500">Matrícula: {license || "N/A"}</p>
            </div>
          </div>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-gray-500 hover:text-gray-700">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(medico)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && ( // onDelete es para desactivar
                  <DropdownMenuItem onClick={() => onDelete(medico)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Desactivar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <Badge
          variant={is_active ? "default" : "outline"}
          className={`font-medium text-xs ${is_active ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-200 text-gray-700 border-gray-300"}`}
        >
          {is_active ? "Activo" : "Inactivo"}
        </Badge>
      </CardContent>
      <CardFooter className="text-xs text-gray-400 p-4 pt-2 border-t flex justify-between items-center">
        <div
          className="flex items-center space-x-1"
          title={`Creado por ${created_by?.username || "Sistema"} el ${formatDate(created_at)}`}
        >
          <UserAvatar user={created_by} />
          <span>{formatDate(created_at)}</span>
        </div>
        {latestUpdater && (
          <div
            className="flex items-center space-x-1"
            title={`Actualizado por ${latestUpdater.username} el ${formatDate(updated_at)}`}
          >
            <span>Mod:</span>
            <UserAvatar user={latestUpdater} />
            <span>{formatDate(updated_at)}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
