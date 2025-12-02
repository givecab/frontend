"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit, ChevronDown, DollarSign, Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ObraSocial } from "@/types"
import { HistoryList } from "@/components/common/history-list"
import { useApi } from "@/hooks/use-api"
import { MEDICAL_ENDPOINTS } from "@/config/api"

interface ObraSocialCardProps {
  obraSocial: ObraSocial
  onEdit?: (os: ObraSocial) => void
  onToggleActive?: (os: ObraSocial, newStatus: boolean) => void
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

const UserAvatar: React.FC<{ username?: string; photo?: string | null; size?: "sm" | "md" }> = ({
  username,
  photo,
  size = "md",
}) => {
  const sizeClasses = size === "sm" ? "h-6 w-6" : "h-8 w-8"

  if (!username) {
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
      <AvatarImage src={photo || undefined} alt={username} />
      <AvatarFallback className="text-xs bg-slate-200 text-slate-700">
        {username?.substring(0, 2).toUpperCase() || "S"}
      </AvatarFallback>
    </Avatar>
  )
}

export const ObraSocialCard: React.FC<ObraSocialCardProps> = ({ obraSocial, onEdit, onToggleActive, isToggling }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [fullDetails, setFullDetails] = useState<ObraSocial | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const { apiRequest } = useApi()

  const { name, description, ub_value, is_active, creation, last_change } = obraSocial

  const handleToggle = (newStatus: boolean) => {
    if (onToggleActive) {
      onToggleActive(obraSocial, newStatus)
    }
  }

  const handleCardClick = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-expand]")) {
      return
    }

    const newExpandedState = !isExpanded
    setIsExpanded(newExpandedState)

    // Fetch full details if expanding and not already loaded
    if (newExpandedState && !fullDetails && obraSocial.id) {
      setIsLoadingHistory(true)
      try {
        const response = await apiRequest(MEDICAL_ENDPOINTS.INSURANCE_DETAIL(obraSocial.id))
        const data = await response.json()
        setFullDetails(data)
      } catch (error) {
        console.error("Error fetching obra social details:", error)
      } finally {
        setIsLoadingHistory(false)
      }
    }
  }

  const canBeToggled = true

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
                  {ub_value && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-gray-600 font-medium">{ub_value}</span>
                      </div>
                    </>
                  )}
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{formatDateShort(creation?.date)}</span>
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

        {!isExpanded && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <TooltipProvider>
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <UserAvatar username={creation?.user?.username} photo={creation?.user?.photo} size="sm" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      <strong>Creado por:</strong> {creation?.user?.username || "Sistema"}
                      <br />
                      <strong>Fecha:</strong> {formatDate(creation?.date)}
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <UserAvatar username={last_change?.user?.username} photo={last_change?.user?.photo} size="sm" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      <strong>Modificado por:</strong> {last_change?.user?.username || "Sistema"}
                      <br />
                      <strong>Fecha:</strong> {formatDate(last_change?.date)}
                      {last_change?.changes && last_change.changes.length > 0 && (
                        <>
                          <br />
                          <strong>Cambios:</strong> {last_change.changes.join(", ")}
                        </>
                      )}
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
            {description && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">{description}</p>
              </div>
            )}

            {ub_value && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-md">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Valor UB</p>
                  <p className="text-lg font-semibold text-green-700">{ub_value}</p>
                </div>
              </div>
            )}

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent text-[#204983]" />
              </div>
            ) : fullDetails?.history ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Historial de Cambios</h4>
                <HistoryList history={fullDetails.history} />
              </div>
            ) : null}

            {/* Botón de editar */}
            {onEdit && (
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
