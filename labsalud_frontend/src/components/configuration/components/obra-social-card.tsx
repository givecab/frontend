"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit, ChevronDown, Calendar, Clock, Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ObraSocial, User as UserType } from "../configuration-page"

interface ObraSocialCardProps {
  obraSocial: ObraSocial
  onEdit?: (os: ObraSocial) => void
  onToggleActive?: (os: ObraSocial, newStatus: boolean) => void
  canEdit: boolean
  canDelete: boolean
  isToggling?: boolean
}

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

const formatDateShort = (dateString?: string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const UserAvatar: React.FC<{ user: UserType | null | undefined; size?: "sm" | "md" }> = ({ user, size = "md" }) => {
  const sizeClasses = size === "sm" ? "h-6 w-6" : "h-8 w-8"

  if (!user) {
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
  const [isExpanded, setIsExpanded] = useState(false)
  const { name, is_active, created_by, created_at, updated_by, updated_at } = obraSocial
  const latestUpdater = updated_by && updated_by.length > 0 ? updated_by[updated_by.length - 1] : null

  const handleToggle = (newStatus: boolean) => {
    if (onToggleActive) {
      onToggleActive(obraSocial, newStatus)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // No expandir si se hace clic en el switch o botones
    if ((e.target as HTMLElement).closest("[data-no-expand]")) {
      return
    }
    setIsExpanded(!isExpanded)
  }

  const canBeToggled = (is_active && canDelete) || (!is_active && canEdit)

  return (
    <Card
      className={`transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer ${
        !is_active ? "bg-gray-50 opacity-75" : "bg-white"
      } ${isExpanded ? "ring-2 ring-[#204983] ring-opacity-20" : ""}`}
      onClick={handleCardClick}
    >
      <CardHeader className="p-4 pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-[#204983] p-2 rounded-full">
                <div className="h-5 w-5 bg-white rounded-sm flex items-center justify-center">
                  <span className="text-[#204983] text-xs font-bold">OS</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-base font-semibold truncate ${is_active ? "text-gray-800" : "text-gray-500"}`}
                  title={name}
                >
                  {name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={is_active ? "default" : "secondary"} className="text-xs">
                    {is_active ? "Activa" : "Inactiva"}
                  </Badge>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{formatDateShort(created_at)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-2" data-no-expand>
            <Switch
              checked={is_active}
              onCheckedChange={handleToggle}
              disabled={!canBeToggled || isToggling}
              className={`${
                is_active ? "data-[state=checked]:bg-[#204983]" : "opacity-50 data-[state=unchecked]:bg-gray-300"
              }`}
            />
            {isToggling && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-[#204983]" />
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Avatares con tooltip cuando la card está cerrada */}
        {!isExpanded && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <TooltipProvider>
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <UserAvatar user={created_by} size="sm" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      <strong>Creado por:</strong> {created_by?.username || "Sistema"}
                      <br />
                      <strong>Fecha:</strong> {formatDate(created_at)}
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <UserAvatar user={latestUpdater} size="sm" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      <strong>Modificado por:</strong> {latestUpdater?.username || "Sistema"}
                      <br />
                      <strong>Fecha:</strong> {formatDate(updated_at)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-0 border-t border-gray-100">
          <div className="space-y-4 mt-4">
            {/* Información de creación */}
            <div className="flex items-start space-x-3">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Creado</p>
                <div className="flex items-center space-x-2 mt-1">
                  <UserAvatar user={created_by} />
                  <div>
                    <p className="text-sm text-gray-600">{created_by?.username || "Sistema"}</p>
                    <p className="text-xs text-gray-500">{formatDate(created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de actualización */}
            <div className="flex items-start space-x-3">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Última modificación</p>
                <div className="flex items-center space-x-2 mt-1">
                  <UserAvatar user={latestUpdater} />
                  <div>
                    <p className="text-sm text-gray-600">{latestUpdater?.username || "Sistema"}</p>
                    <p className="text-xs text-gray-500">{formatDate(updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de editar */}
            {canEdit && onEdit && (
              <div className="pt-2 border-t border-gray-100" data-no-expand>
                <Button
                  onClick={() => onEdit(obraSocial)}
                  className="w-full bg-[#204983] hover:bg-[#1a3d6f] text-white shadow-sm"
                  size="sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Obra Social
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
