"use client"

import type React from "react"
import { Loader2 } from "lucide-react"

import { useState } from "react"
import {
  ChevronDown,
  Calendar,
  User,
  Building,
  CreditCard,
  Send,
  Clock,
  TestTube,
  Settings,
  History,
  Edit,
  X,
  AlertTriangle,
  DollarSign,
} from "lucide-react"
import { Card, CardContent } from "../../ui/card"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../ui/alert-dialog"
import { useApi } from "../../../hooks/use-api"
import { toast } from "sonner"
import { ANALYSIS_ENDPOINTS, TOAST_DURATION } from "@/config/api"

interface AnalysisItem {
  id: number
  analysis: {
    id: number
    code: string
    name: string
  }
  created_at: string
  created_by: {
    id: number
    username: string
    photo: string
  }
  history: any[]
}

interface PanelHierarchy {
  id: number
  code: string
  name: string
  bio_unit: string
  is_urgent: boolean
  analyses: AnalysisItem[]
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

interface Patient {
  id: number
  first_name: string
  last_name: string
}

interface ObraSocial {
  id: number
  name: string
}

interface Medico {
  id: number
  first_name: string
  last_name: string
}

interface Protocol {
  id: number
  patient: Patient
  state: string
  paid: boolean
  created_at: string
  created_by: {
    id: number
    username: string
    photo: string
  }
  history: HistoryEntry[]
}

interface ProtocolDetail extends Protocol {
  ooss: ObraSocial
  medico: Medico
  ooss_number?: string
  contact_method: string
}

interface ProtocolCardProps {
  protocol: Protocol
  onUpdate: () => void
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

export function ProtocolCard({ protocol, onUpdate }: ProtocolCardProps) {
  const { apiRequest } = useApi()
  const [isExpanded, setIsExpanded] = useState(false)
  const [protocolDetail, setProtocolDetail] = useState<ProtocolDetail | null>(null)
  const [panelHierarchy, setPanelHierarchy] = useState<PanelHierarchy[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loadingAnalyses, setLoadingAnalyses] = useState(false)
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  const getStateLabel = (state: string) => {
    const stateLabels = {
      pending_entry: "Pendiente de Carga",
      entry_complete: "Carga Completa",
      pending_validation: "Pendiente de Validación",
      completed: "Completado",
      cancelled: "Cancelado",
    }
    return stateLabels[state as keyof typeof stateLabels] || state
  }

  const getStateColor = (state: string) => {
    const stateColors = {
      pending_entry: "bg-yellow-100 text-yellow-800",
      entry_complete: "bg-blue-100 text-blue-800",
      pending_validation: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return stateColors[state as keyof typeof stateColors] || "bg-gray-100 text-gray-800"
  }

  const getContactMethodLabel = (method: string) => {
    const methodLabels = {
      email: "Email",
      whatsapp: "WhatsApp",
      physical: "Retiro físico",
    }
    return methodLabels[method as keyof typeof methodLabels] || method
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

  // Función para cargar detalles del protocolo
  const fetchProtocolDetail = async () => {
    if (protocolDetail) return // Ya está cargado

    setLoadingDetail(true)
    try {
      const response = await apiRequest(ANALYSIS_ENDPOINTS.PROTOCOL_DETAIL(protocol.id))

      if (response.ok) {
        const data: ProtocolDetail = await response.json()
        setProtocolDetail(data)
      } else {
        throw new Error("Error fetching protocol detail")
      }
    } catch (error) {
      console.error("Error fetching protocol detail:", error)
      toast.error("Error al cargar los detalles del protocolo", { duration: TOAST_DURATION })
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleExpand = async () => {
    if (!isExpanded) {
      // Cargar detalles cuando se expande
      await fetchProtocolDetail()
    }
    setIsExpanded(!isExpanded)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // No expandir si se hace clic en botones
    if ((e.target as HTMLElement).closest("[data-no-expand]")) {
      return
    }
    handleExpand()
  }

  const handleAnalysisDialog = async () => {
    if (panelHierarchy.length === 0) {
      setLoadingAnalyses(true)
      try {
        const response = await apiRequest(ANALYSIS_ENDPOINTS.PROTOCOL_HIERARCHY(protocol.id))

        if (response.ok) {
          const data: PanelHierarchy[] = await response.json()
          console.log("[v0] Protocol hierarchy response:", data)
          console.log("[v0] Response type:", typeof data)
          console.log("[v0] Is array:", Array.isArray(data))

          setPanelHierarchy(data)
        } else {
          throw new Error("Error fetching protocol hierarchy")
        }
      } catch (error) {
        console.error("Error fetching protocol hierarchy:", error)
        toast.error("Error al cargar los análisis del protocolo", { duration: TOAST_DURATION })
        return
      } finally {
        setLoadingAnalyses(false)
      }
    }
    setAnalysisDialogOpen(true)
  }

  const handleCancelProtocol = async () => {
    setIsCancelling(true)
    try {
      const response = await apiRequest(ANALYSIS_ENDPOINTS.PROTOCOL_DETAIL(protocol.id), {
        method: "PATCH",
        body: { state: "cancelled" },
      })

      if (response.ok) {
        toast.success("Protocolo cancelado exitosamente", { duration: TOAST_DURATION })
        onUpdate() // Actualizar la lista
      } else {
        throw new Error("Error cancelling protocol")
      }
    } catch (error) {
      console.error("Error cancelling protocol:", error)
      toast.error("Error al cancelar el protocolo", { duration: TOAST_DURATION })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleMarkAsPaid = async () => {
    setIsMarkingPaid(true)
    try {
      const response = await apiRequest(ANALYSIS_ENDPOINTS.PROTOCOL_DETAIL(protocol.id), {
        method: "PATCH",
        body: { paid: true },
      })

      if (response.ok) {
        toast.success("Protocolo marcado como pagado", { duration: TOAST_DURATION })
        onUpdate() // Actualizar la lista
      } else {
        throw new Error("Error marking as paid")
      }
    } catch (error) {
      console.error("Error marking as paid:", error)
      toast.error("Error al marcar como pagado", { duration: TOAST_DURATION })
    } finally {
      setIsMarkingPaid(false)
    }
  }

  const getUserDisplayName = (user: { id: number; username: string; photo: string } | null | undefined) => {
    if (!user || !user.username || user.username.trim() === "") {
      return "Sistema"
    }
    return user.username
  }

  const getPatientName = () => {
    return `${protocol.patient.first_name} ${protocol.patient.last_name}`.trim()
  }

  const getObraSocialName = () => {
    if (protocolDetail?.ooss) {
      return protocolDetail.ooss.name
    }
    return "Cargando..."
  }

  const getMedicoName = () => {
    if (protocolDetail?.medico) {
      return `Dr. ${protocolDetail.medico.first_name} ${protocolDetail.medico.last_name}`.trim()
    }
    return "Cargando..."
  }

  // Obtener información de auditoría desde history
  const getCreationInfo = () => {
    if (protocol.history && protocol.history.length > 0) {
      // La primera entrada del history es la creación (version 1)
      const creationEntry = protocol.history.find((entry) => entry.version === 1)
      if (creationEntry) {
        return {
          user: creationEntry.user,
          date: creationEntry.created_at,
        }
      }
    }
    // Fallback a los datos originales
    return {
      user: protocol.created_by,
      date: protocol.created_at,
    }
  }

  const getLatestUpdate = () => {
    if (protocol.history && protocol.history.length > 1) {
      // Ordenar por version descendente y tomar la más reciente
      const sortedHistory = [...protocol.history].sort((a, b) => b.version - a.version)
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

  // Verificar si el protocolo puede ser cancelado
  const canBeCancelled =
    protocol.state !== "cancelled" &&
    protocol.state !== "completed" &&
    protocol.state !== "cancelado" &&
    protocol.state !== "finalizado"

  return (
    <>
      <Card
        className={`transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer bg-white ${
          isExpanded ? "ring-2 ring-[#204983] ring-opacity-20" : ""
        } border-l-4 ${protocol.state === "cancelled" || protocol.state === "cancelado" ? "border-l-red-500" : "border-l-[#204983]"}`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4 pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <div
                  className={`flex-shrink-0 p-2 rounded-full ${
                    protocol.state === "cancelled" || protocol.state === "cancelado" ? "bg-red-500" : "bg-[#204983]"
                  }`}
                >
                  <div className="h-5 w-5 bg-white rounded-sm flex items-center justify-center">
                    <span
                      className={`text-xs font-bold ${protocol.state === "cancelled" || protocol.state === "cancelado" ? "text-red-500" : "text-[#204983]"}`}
                    >
                      P
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold truncate text-gray-800" title={`Protocolo #${protocol.id}`}>
                      Protocolo #{protocol.id}
                    </h3>
                    {/* Botón marcar como pagado en el header */}
                    {!protocol.paid && protocol.state !== "cancelled" && protocol.state !== "cancelado" && (
                      <Button
                        size="sm"
                        onClick={handleMarkAsPaid}
                        disabled={isMarkingPaid}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-6"
                        data-no-expand
                      >
                        {isMarkingPaid ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <DollarSign className="h-3 w-3 mr-1" />
                            Marcar Pagado
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStateColor(protocol.state)} variant="secondary">
                      {getStateLabel(protocol.state)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-2" data-no-expand>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {/* Información básica cuando está cerrada */}
          {!isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              {/* Información principal en una línea */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Paciente */}
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 truncate" title={getPatientName()}>
                      {getPatientName()}
                    </span>
                  </div>

                  {/* Estado de pago */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className={`text-sm font-medium ${protocol.paid ? "text-green-600" : "text-red-600"}`}>
                      {protocol.paid ? "Pagado" : "No Pagado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatares de auditoría */}
              <div className="flex items-center justify-end">
                <TooltipProvider>
                  <div className="flex items-center space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <UserAvatar user={creationInfo.user} size="sm" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          <strong>Creado por:</strong> {getUserDisplayName(creationInfo.user)}
                          <br />
                          <strong>Fecha:</strong> {formatDate(creationInfo.date)}
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    {latestUpdate ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            <UserAvatar user={latestUpdate.user} size="sm" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            <strong>Modificado por:</strong> {getUserDisplayName(latestUpdate.user)}
                            <br />
                            <strong>Fecha:</strong> {formatDate(latestUpdate.date)}
                            <br />
                            <strong>Versión:</strong> {latestUpdate.version}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <span className="text-xs text-gray-400">-</span>
                      </div>
                    )}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          )}
        </CardContent>

        {isExpanded && (
          <CardContent className="px-4 pb-4 pt-0 border-t border-gray-100">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#204983]"></div>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {/* Información detallada - una por línea */}
                <div className="space-y-3">
                  {/* Paciente */}
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 w-24 flex-shrink-0">Paciente:</span>
                    <span className="font-medium">{getPatientName()}</span>
                  </div>

                  {/* Médico */}
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 w-24 flex-shrink-0">Médico:</span>
                    <span className="font-medium">{getMedicoName()}</span>
                  </div>

                  {/* Obra Social */}
                  <div className="flex items-center gap-3 text-sm">
                    <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 w-24 flex-shrink-0">Obra Social:</span>
                    <span className="font-medium">{getObraSocialName()}</span>
                  </div>

                  {/* Número de afiliado */}
                  {protocolDetail?.ooss_number && (
                    <div className="flex items-center gap-3 text-sm">
                      <CreditCard className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 w-24 flex-shrink-0">N° Afiliado:</span>
                      <span className="font-medium">{protocolDetail.ooss_number}</span>
                    </div>
                  )}

                  {/* Método de envío */}
                  {protocolDetail?.contact_method && (
                    <div className="flex items-center gap-3 text-sm">
                      <Send className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 w-24 flex-shrink-0">Envío:</span>
                      <span className="font-medium">{getContactMethodLabel(protocolDetail.contact_method)}</span>
                    </div>
                  )}
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
                  {protocol.history && protocol.history.length > 2 && (
                    <div className="flex items-start space-x-3">
                      <History className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          Historial completo ({protocol.history.length} versiones)
                        </p>
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                          {protocol.history
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
                          {protocol.history.length > 5 && (
                            <p className="text-xs text-gray-500 italic">
                              ... y {protocol.history.length - 5} versiones más
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="pt-4 border-t border-gray-100" data-no-expand>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-[#204983] border-[#204983] hover:bg-[#204983] hover:text-white bg-transparent"
                      onClick={handleAnalysisDialog}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Ver Análisis
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    {canBeCancelled && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600 border-red-600 hover:bg-red-600 hover:text-white bg-transparent"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              Cancelar Protocolo
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que deseas cancelar el protocolo #{protocol.id}? Esta acción no se puede
                              deshacer y el protocolo pasará al estado "Cancelado".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelProtocol}
                              disabled={isCancelling}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {isCancelling ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Cancelando...
                                </>
                              ) : (
                                "Confirmar Cancelación"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Dialog de Análisis - Más grande */}
      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="!max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-[#204983]" />
              Análisis del Protocolo #{protocol.id}
            </DialogTitle>
          </DialogHeader>

          {loadingAnalyses ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#204983]"></div>
            </div>
          ) : panelHierarchy.length > 0 ? (
            <div className="space-y-6">
              {panelHierarchy.map((panel) => (
                <div key={panel.id} className="border rounded-lg overflow-hidden">
                  {/* Header del Panel */}
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TestTube className="h-5 w-5 text-[#204983]" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{panel.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {panel.code}
                            </Badge>
                            {panel.is_urgent && (
                              <Badge variant="destructive" className="text-xs">
                                Urgente
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {panel.analyses?.length || 0} análisis
                            </Badge>
                            {panel.bio_unit && (
                              <Badge variant="outline" className="text-xs">
                                {panel.bio_unit} unidades
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Análisis */}
                  {panel.analyses && panel.analyses.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Creado por</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {panel.analyses.map((analysisItem) => (
                          <TableRow key={analysisItem.id}>
                            <TableCell className="font-mono text-sm">{analysisItem.analysis.code}</TableCell>
                            <TableCell>
                              <span>{analysisItem.analysis.name}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <UserAvatar user={analysisItem.created_by} size="sm" />
                                <span className="text-sm">{getUserDisplayName(analysisItem.created_by)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {formatDateShort(analysisItem.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TestTube className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay análisis</h3>
              <p className="text-gray-600">Este protocolo no tiene análisis asignados.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
