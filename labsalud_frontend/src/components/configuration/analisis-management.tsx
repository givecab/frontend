"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  PlusCircle,
  Search,
  AlertCircle,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  FileTextIcon,
  PackageSearch,
} from "lucide-react"
import type { AnalysisPanel, User as ConfigUser } from "./configuration-page"
import { CreatePanelDialog } from "./components/create-panel-dialog"
import { EditPanelDialog } from "./components/edit-panel-dialog"
import { DeletePanelDialog } from "./components/delete-panel-dialog"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { useDebounce } from "@/hooks/use-debounce"
import { AnalysisList } from "./components/analysis-list"

interface AnalisisManagementProps {
  canViewPanels: boolean
  canCreatePanels: boolean
  canEditPanels: boolean
  canDeletePanels: boolean
  canCreateAnalyses: boolean
  canEditAnalyses: boolean
  canDeleteAnalyses: boolean
}

const PAGE_LIMIT = 20

const UserAvatar: React.FC<{ user: ConfigUser | null }> = ({ user }) => {
  if (!user) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger>
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-gray-200 text-gray-500">?</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>Usuario desconocido</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  const initials =
    `${user.first_name ? user.first_name[0] : ""}${user.last_name ? user.last_name[0] : ""}`.toUpperCase() ||
    user.username[0].toUpperCase()
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger>
          <Avatar className="h-6 w-6">
            {user.photo && <AvatarImage src={user.photo || "/placeholder.svg"} alt={user.username} />}
            <AvatarFallback className="text-xs bg-slate-200 text-slate-700">{initials}</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export const AnalisisManagement: React.FC<AnalisisManagementProps> = ({
  canViewPanels,
  canCreatePanels,
  canEditPanels,
  canDeletePanels,
  canCreateAnalyses,
  canEditAnalyses,
  canDeleteAnalyses,
}) => {
  const { apiRequest } = useApi()
  const toastActions = useToast()

  const [panels, setPanels] = useState<AnalysisPanel[]>([])
  const [totalPanels, setTotalPanels] = useState(0)
  const [panelsNextUrl, setPanelsNextUrl] = useState<string | null>(null)
  const [isLoadingPanelsInitial, setIsLoadingPanelsInitial] = useState(true)
  const [isLoadingMorePanels, setIsLoadingMorePanels] = useState(false)
  const [panelsError, setPanelsError] = useState<string | null>(null)
  const [panelSearchTerm, setPanelSearchTerm] = useState("")
  const debouncedPanelSearchTerm = useDebounce(panelSearchTerm, 500)
  const [showInactivePanels, setShowInactivePanels] = useState(false)

  const [expandedPanels, setExpandedPanels] = useState<Set<number>>(new Set())
  const [refreshCounter, setRefreshCounter] = useState(0)

  const [isCreatePanelModalOpen, setIsCreatePanelModalOpen] = useState(false)
  const [isEditPanelModalOpen, setIsEditPanelModalOpen] = useState(false)
  const [isDeletePanelModalOpen, setIsDeletePanelModalOpen] = useState(false)
  const [selectedPanel, setSelectedPanel] = useState<AnalysisPanel | null>(null)

  const buildPanelsUrl = useCallback(
    (offset = 0, search = debouncedPanelSearchTerm, inactive = showInactivePanels) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const endpoint = inactive
        ? import.meta.env.VITE_ANALYSIS_PANELS_ENDPOINT
        : import.meta.env.VITE_ANALYSIS_PANELS_ACTIVE_ENDPOINT

      let url = `${baseUrl}${endpoint}?limit=${PAGE_LIMIT}&offset=${offset}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      return url
    },
    [debouncedPanelSearchTerm, showInactivePanels],
  )

  const fetchPanels = useCallback(
    async (isNewSearchOrFilter = false) => {
      if (!canViewPanels) {
        setPanelsError("No tienes permiso para ver paneles.")
        setIsLoadingPanelsInitial(false)
        return
      }

      let currentUrlToFetch: string
      if (isNewSearchOrFilter) {
        setPanels([])
        setPanelsNextUrl(null)
        setTotalPanels(0)
        currentUrlToFetch = buildPanelsUrl(0)
      } else {
        if (!panelsNextUrl) {
          setIsLoadingMorePanels(false)
          return
        }
        currentUrlToFetch = panelsNextUrl
      }

      setIsLoadingPanelsInitial(isNewSearchOrFilter && panels.length === 0)
      setIsLoadingMorePanels(!isNewSearchOrFilter)
      setPanelsError(null)

      try {
        const response = await apiRequest(currentUrlToFetch)
        if (response.ok) {
          const data = await response.json()
          setPanels((prev) => (isNewSearchOrFilter ? data.results : [...prev, ...data.results]))
          setTotalPanels(data.count)
          setPanelsNextUrl(data.next)
        } else {
          setPanelsError("Error al cargar los paneles.")
          toastActions.error("Error", { description: "No se pudieron cargar los paneles." })
        }
      } catch (err) {
        console.error("Error fetching panels:", err)
        setPanelsError("Ocurrió un error inesperado al cargar los paneles.")
        toastActions.error("Error", { description: "Error de conexión o servidor (paneles)." })
      } finally {
        setIsLoadingPanelsInitial(false)
        setIsLoadingMorePanels(false)
      }
    },
    [apiRequest, canViewPanels, toastActions, buildPanelsUrl, panelsNextUrl],
  )

  useEffect(() => {
    if (canViewPanels) {
      fetchPanels(true)
    }
  }, [canViewPanels, debouncedPanelSearchTerm, showInactivePanels])

  const hasMorePanels = !!panelsNextUrl && panels.length < totalPanels
  const loadMorePanelsSentinelRef = useInfiniteScroll({
    loading: isLoadingMorePanels,
    hasMore: hasMorePanels,
    onLoadMore: () => {
      if (panelsNextUrl && !isLoadingMorePanels) {
        fetchPanels(false)
      }
    },
    dependencies: [panelsNextUrl, isLoadingMorePanels, hasMorePanels],
  })

  const togglePanelExpansion = (panelId: number) => {
    setExpandedPanels((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(panelId)) {
        newSet.delete(panelId)
      } else {
        newSet.add(panelId)
      }
      return newSet
    })
  }

  const handleSuccess = () => {
    fetchPanels(true)
    setRefreshCounter((c) => c + 1)
    setIsCreatePanelModalOpen(false)
    setIsEditPanelModalOpen(false)
    setIsDeletePanelModalOpen(false)
    setSelectedPanel(null)
  }

  const handleDialogClose = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false)
    setSelectedPanel(null)
  }

  if (!canViewPanels && !canCreatePanels) {
    return (
      <div className="text-gray-600 bg-gray-50 p-4 rounded-md flex items-center">
        <AlertCircle className="mr-2" /> No tienes permisos para gestionar análisis.
      </div>
    )
  }

  if (isLoadingPanelsInitial && panels.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#204983]" />
        <span className="ml-2">Cargando paneles...</span>
      </div>
    )
  }

  if (panelsError && panels.length === 0) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-md flex items-center">
        <AlertCircle className="mr-2" /> {panelsError}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center">
                <FileTextIcon className="mr-3 h-7 w-7 text-[#204983]" />
                Paneles de Análisis
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Administra los paneles de análisis y sus determinaciones asociadas.
              </p>
            </div>
            {canCreatePanels && (
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Button
                  onClick={() => setIsCreatePanelModalOpen(true)}
                  style={{ backgroundColor: "#204983", color: "white" }}
                >
                  <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Panel
                </Button>
              </div>
            )}
          </div>
          <div className="mt-6 md:flex md:items-center md:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar panel (nombre, código)..."
                value={panelSearchTerm}
                onChange={(e) => setPanelSearchTerm(e.target.value)}
                className="pl-10 w-full"
                disabled={!canViewPanels}
              />
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
              <Switch
                id="show-inactive-panels"
                checked={showInactivePanels}
                onCheckedChange={setShowInactivePanels}
                disabled={!canViewPanels}
              />
              <Label htmlFor="show-inactive-panels" className="text-sm text-gray-600">
                Mostrar inactivos
              </Label>
            </div>
          </div>
        </div>
      </div>

      {panelsError && panels.length > 0 && (
        <div className="text-red-500 bg-red-50 p-3 rounded-md mb-4">{panelsError}</div>
      )}

      {panels.length === 0 && !isLoadingPanelsInitial && !panelsError && (
        <div className="text-center text-gray-500 py-12 bg-white shadow sm:rounded-lg">
          <PackageSearch className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No se encontraron Paneles</h3>
          <p className="mt-1 text-sm text-gray-500">
            {panelSearchTerm ? "Ningún panel coincide con tu búsqueda." : "No hay paneles registrados."}
            {!showInactivePanels && " Prueba activando 'Mostrar inactivos'."}
          </p>
        </div>
      )}

      {panels.length > 0 && (
        <div className="space-y-4">
          {panels.map((panel) => (
            <Card
              key={panel.id}
              className={`transition-all duration-200 shadow-sm hover:shadow-md ${!panel.is_active ? "bg-gray-50 opacity-80" : "bg-white"}`}
            >
              <CardHeader
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => togglePanelExpansion(panel.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-semibold text-gray-800 truncate" title={panel.name}>
                        {panel.name}
                      </h3>
                      {!panel.is_active && (
                        <Badge variant="outline" className="text-xs border-gray-400 text-gray-600">
                          Inactivo
                        </Badge>
                      )}
                      {panel.is_urgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgente
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Código: {panel.code} &bull; Unidad Bioq.: {panel.bio_unit}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {canEditPanels && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedPanel(panel)
                                setIsEditPanelModalOpen(true)
                              }}
                              className="h-8 w-8 text-gray-500 hover:text-gray-700"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar Panel</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {canDeletePanels && panel.is_active && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedPanel(panel)
                                setIsDeletePanelModalOpen(true)
                              }}
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Desactivar Panel</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-gray-700"
                      onClick={() => togglePanelExpansion(panel.id)}
                    >
                      {expandedPanels.has(panel.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2 flex items-center space-x-2">
                  <div
                    className="flex items-center space-x-1"
                    title={`Creado por ${panel.created_by?.username || "Sistema"} el ${new Date(panel.created_at).toLocaleDateString()}`}
                  >
                    <UserAvatar user={panel.created_by} />
                    <span>{new Date(panel.created_at).toLocaleDateString()}</span>
                  </div>
                  {panel.updated_by && panel.updated_by.length > 0 && (
                    <div
                      className="flex items-center space-x-1"
                      title={`Última modif. por ${panel.updated_by[panel.updated_by.length - 1]?.username || "Sistema"} el ${new Date(panel.updated_at).toLocaleDateString()}`}
                    >
                      <span>| Mod:</span>
                      <UserAvatar user={panel.updated_by[panel.updated_by.length - 1]} />
                      <span>{new Date(panel.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              {expandedPanels.has(panel.id) && (
                <CardContent className="p-4 pt-0 border-t mt-2">
                  <AnalysisList
                    panel={panel}
                    showInactive={showInactivePanels}
                    canCreate={canCreateAnalyses}
                    canEdit={canEditAnalyses}
                    canDelete={canDeleteAnalyses}
                    refreshKey={refreshCounter}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {hasMorePanels && (
        <div ref={loadMorePanelsSentinelRef} className="flex justify-center items-center py-6">
          {isLoadingMorePanels && <Loader2 className="h-6 w-6 animate-spin text-[#204983]" />}
        </div>
      )}
      {!hasMorePanels && panels.length > 0 && !isLoadingPanelsInitial && (
        <p className="text-center text-sm text-gray-500 mt-8">Fin de los resultados.</p>
      )}

      {isCreatePanelModalOpen && canCreatePanels && (
        <CreatePanelDialog
          open={isCreatePanelModalOpen}
          onOpenChange={(open: boolean) => {
            if (!open) handleDialogClose(setIsCreatePanelModalOpen)
          }}
          onSuccess={handleSuccess}
        />
      )}
      {isEditPanelModalOpen && selectedPanel && canEditPanels && (
        <EditPanelDialog
          open={isEditPanelModalOpen}
          onOpenChange={(open: boolean) => {
            if (!open) handleDialogClose(setIsEditPanelModalOpen)
          }}
          onSuccess={handleSuccess}
          panel={selectedPanel}
        />
      )}
      {isDeletePanelModalOpen && selectedPanel && canDeletePanels && (
        <DeletePanelDialog
          open={isDeletePanelModalOpen}
          onOpenChange={(open: boolean) => {
            if (!open) handleDialogClose(setIsDeletePanelModalOpen)
          }}
          onSuccess={handleSuccess}
          panel={selectedPanel}
        />
      )}
    </div>
  )
}
