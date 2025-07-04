"use client"

import type React from "react"
import { Card, CardHeader, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, MoreVertical, ShieldCheckIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import type { ObraSocial, User as UserType } from "../configuration-page"

interface ObraSocialCardProps {
  obraSocial: ObraSocial
  onEdit?: (os: ObraSocial) => void
  onToggleActive?: (os: ObraSocial, newStatus: boolean) => void
  canEdit: boolean
  canDelete: boolean // Permission to deactivate
  isToggling?: boolean
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

export const ObraSocialCard: React.FC<ObraSocialCardProps> = ({
  obraSocial,
  onEdit,
  onToggleActive,
  canEdit,
  canDelete,
  isToggling,
}) => {
  const { name, is_active, created_by, created_at, updated_by, updated_at, code } = obraSocial
  const latestUpdater = updated_by && updated_by.length > 0 ? updated_by[updated_by.length - 1] : null

  const handleToggle = (newStatus: boolean) => {
    if (onToggleActive) {
      onToggleActive(obraSocial, newStatus)
    }
  }

  const canBeToggled = (is_active && canDelete) || (!is_active && canEdit)

  return (
    <Card
      className={`transition-all duration-200 shadow-sm hover:shadow-md ${!is_active ? "bg-gray-100 opacity-80" : "bg-white"}`}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 bg-[#204983] p-2 rounded-full">
              <ShieldCheckIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-800 truncate" title={name}>
                {name}
              </h3>
              {code && <p className="text-xs text-gray-500">Código: {code}</p>}
            </div>
          </div>
          {canEdit && onEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-gray-500 hover:text-gray-700">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(obraSocial)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center space-x-2 mt-3">
          <Switch
            id={`os-active-${obraSocial.id}`}
            checked={is_active}
            onCheckedChange={handleToggle}
            disabled={!canBeToggled || isToggling}
            className="data-[state=checked]:bg-[#204983]"
          />
          <label
            htmlFor={`os-active-${obraSocial.id}`}
            className={`text-sm font-medium ${is_active ? "text-[#1a3d6f]" : "text-gray-600"}`}
          >
            {is_active ? "Activa" : "Inactiva"}
          </label>
          {isToggling && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
        </div>
      </CardHeader>
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
