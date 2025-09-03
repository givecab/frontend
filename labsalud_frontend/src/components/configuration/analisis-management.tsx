"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  TestTube,
  Pencil,
  Trash,
  PackageX,
  Plus,
  Settings,
  History,
  Clock,
} from "lucide-react"
import { AnalysisList } from "./components/analysis-list"
import { CreatePanelDialog } from "./components/create-panel-dialog"
import { EditPanelDialog } from "./components/edit-panel-dialog"
import { DeletePanelDialog } from "./components/delete-panel-dialog"
import type { AnalysisPanel } from "./configuration-page"

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

const UserAvatar: React.FC<{
  user: { id: number; username: string; photo?: string } | null | undefined
  size?: "sm" | "md"
}> = ({ user, size = "md" }) => {
  const sizeClasses = size === "sm" ? "h-6 w-6" : "h-8 w-8"

  if (!user || !user.username || user.username.trim() === "") {
    return (
      <Avatar className={sizeClasses}>
        <AvatarFallback className="text-xs bg-gray-200 text-gray-500">
          <Settings className="h-4 w-4 text-gray-600" />
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
  const [expandedPanels, setExpandedPanels] = useState<Set<number>>(new Set())

  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const [refreshKey, setRefreshKey] = useState(0)

  // Dialogs state
  const [isCreatePanelModalOpen, setIsCreatePanelModalOpen] = useState(false)
  const [isEditPanelModalOpen, setIsEditPanelModalOpen] = useState(false)
  const [isDeletePanelModalOpen, setIsDeletePanelModalOpen] = useState(false)
  const [selectedPanel, setSelectedPanel] = useState<AnalysisPanel | null>(null)

  const buildPanelsUrl = useCallback(
    (offset = 0, search = debouncedSearchTerm) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      let url = `${baseUrl}/api/analysis/panels/?limit=${PAGE_LIMIT}&offset=${offset}&is_active=true`
      if (search) url += `&search=${encodeURIComponent(search)}`
      return url
    },
    [debouncedSearchTerm],
  )

  const fetchPanels = useCallback(
    async (isNewSearchOrFilter = false) => {
      if (!canViewPanels) {
        setError("No tienes permiso para ver paneles de análisis.")
        setIsLoadingInitial(false)
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
          setIsLoadingMore(false)
          return
        }
        currentUrlToFetch = panelsNextUrl
      }

      setIsLoadingInitial(isNewSearchOrFilter && panels.length === 0)
      setIsLoadingMore(!isNewSearchOrFilter)
      setError(null)

      try {
        const response = await apiRequest(currentUrlToFetch)
        if (response.ok) {
          const data = await response.json()
          setPanels((prev) => (isNewSearchOrFilter ? data.results : [...prev, ...data.results]))
          setTotalPanels(data.count)
          setPanelsNextUrl(data.next)
        } else {
          setError("Error al cargar los paneles.")
          toastActions.error("Error", { description: "No se pudieron cargar los paneles." })
        }
      } catch (err) {
        console.error("Error fetching panels:", err)
        setError("Ocurrió un error inesperado al cargar paneles.")
        toastActions.error("Error", { description: "Error de conexión o servidor (paneles)." })
      } finally {
        setIsLoadingInitial(false)
        setIsLoadingMore(false)
      }
    },
    [apiRequest, toastActions, buildPanelsUrl, panelsNextUrl, panels.length, canViewPanels],
  )

  useEffect(() => {
    if (canViewPanels) {
      fetchPanels(true)
    }
  }, [canViewPanels, debouncedSearchTerm, refreshKey])

  const hasMorePanels = !!panelsNextUrl && panels.length < totalPanels

  const loadMoreSentinelRef = useInfiniteScroll({
    loading: isLoadingMore,
    hasMore: hasMorePanels,
    onLoadMore: () => {
      if (panelsNextUrl && !isLoadingMore) {
        fetchPanels(false)
      }
    },
    dependencies: [panelsNextUrl, isLoadingMore, hasMorePanels],
  })

  const togglePanel = (panelId: number) => {
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

  const handleCreatePanelSuccess = () => {
    setIsCreatePanelModalOpen(false)
    setRefreshKey((prev) => prev + 1)
    toastActions.success("Éxito", { description: "Panel creado correctamente." })
  }

  const handleEditPanelSuccess = () => {
    setIsEditPanelModalOpen(false)
    setSelectedPanel(null)
    setRefreshKey((prev) => prev + 1)
    toastActions.success("Éxito", { description: "Panel actualizado correctamente." })
  }

  const handleDeletePanelSuccess = () => {
    setIsDeletePanelModalOpen(false)
    setSelectedPanel(null)
    setRefreshKey((prev) => prev + 1)
    toastActions.success("Éxito", { description: "Panel desactivado correctamente." })
  }

  if (!canViewPanels && !canCreatePanels) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <div className="flex items-center">
          <PackageX className="h-5 w-5 mr-2" />
          <p>No tienes permisos para gestionar análisis.</p>
        </div>
      </div>
    )
  }

  // Funciones auxiliares con validaciones seguras
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Fecha inválida"
    }
  }

  const getUserDisplayName = (user: { id: number; username: string; photo?: string } | null | undefined) => {
    if (!user || !user.username || user.username.trim() === "") {
      return "Sistema"
    }
    return user.username
  }

  const getCreationInfo = (panelItem: AnalysisPanel) => {
    if (panelItem?.history && Array.isArray(panelItem.history) && panelItem.history.length > 0) {
      // La primera entrada del history es la creación (version 1)
      const creationEntry = panelItem.history.find((entry) => entry.version === 1)
      if (creationEntry) {
        return {
          user: creationEntry.user,
          date: creationEntry.created_at,
        }
      }
    }
    // Fallback a los datos originales
    return {
      user: panelItem?.created_by || null,
      date: panelItem?.created_at || "",
    }
  }

  const getLatestUpdate = (panelItem: AnalysisPanel) => {
    if (panelItem?.history && Array.isArray(panelItem.history) && panelItem.history.length > 1) {
      // Ordenar por version descendente y tomar la más reciente
      const sortedHistory = [...panelItem.history].sort((a, b) => b.version - a.version)
      const latestEntry = sortedHistory[0]

      if (latestEntry && latestEntry.version > 1) {
        return {
          user: latestEntry.user,
          date: latestEntry.created_at,
          version: latestEntry.version,
        }
      }
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Paneles de Análisis ({totalPanels})
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar panel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
              disabled={!canViewPanels}
            />
          </div>
          {canCreatePanels && (
            <Button className="bg-[#204983] hover:bg-[#1a3d6f]" onClick={() => setIsCreatePanelModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Panel
            </Button>
          )}
        </div>
      </div>

      {isLoadingInitial && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Cargando paneles...</span>
        </div>
      )}

      {!isLoadingInitial && error && <div className="text-center text-red-500 py-8">{error}</div>}

      {!isLoadingInitial && !error && panels.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <PackageX className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p>No se encontraron paneles</p>
          {searchTerm && <p className="text-sm">que coincidan con la búsqueda.</p>}
        </div>
      )}

      {panels.length > 0 && (
        <div className="space-y-3">
          {panels.map((panel) => {
            const isExpanded = expandedPanels.has(panel.id)
            const creationInfo = getCreationInfo(panel)
            const latestUpdate = getLatestUpdate(panel)

            return (
              <div
                key={panel.id}
                className={`border rounded-lg bg-white shadow-sm transition-all duration-300 ${
                  isExpanded ? "ring-2 ring-blue-200" : ""
                }`}
              >
                {/* Header del Panel */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => togglePanel(panel.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <TestTube className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-gray-900 truncate">{panel.name || "Sin nombre"}</h4>
                          {panel.is_urgent && (
                            <Badge variant="destructive" className="text-xs flex-shrink-0">
                              U
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 flex-shrink-0">
                            Código:
                            <Badge
                              variant="outline"
                              className="text-xs font-mono bg-blue-100 text-blue-800 border-blue-300 font-semibold ml-1"
                            >
                              {panel.code || "N/A"}
                            </Badge>
                          </span>
                          <span className="truncate">UB: {panel.bio_unit || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Avatares con labels - Solo en desktop */}
                      <TooltipProvider>
                        <div className="flex items-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <UserAvatar user={creationInfo.user} size="md" />
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
                        </div>
                        {latestUpdate && (
                          <div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <UserAvatar user={latestUpdate.user} size="md" />
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
                          </div>
                        )}
                      </TooltipProvider>

                      {/* Botones de acción */}
                      <div className="flex space-x-2">
                        {canEditPanels && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPanel(panel)
                              setIsEditPanelModalOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeletePanels && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 hover:bg-red-50 bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPanel(panel)
                              setIsDeletePanelModalOpen(true)
                            }}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalle del Panel Expandido */}
                {isExpanded && (
                  <div className="border-t bg-gray-50">
                    {/* Información de auditoría del panel */}
                    <div className="p-4 bg-blue-50 border-b">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Información de Auditoría</h5>
                      <div className="space-y-4">
                        {/* Información de creación */}
                        <div className="bg-white p-3 rounded-md border border-blue-200">
                          <div className="flex items-center gap-3 mb-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <h6 className="text-xs font-semibold text-blue-800">Creación</h6>
                          </div>
                          <div className="flex items-center gap-3">
                            <UserAvatar user={creationInfo.user} size="md" />
                            <div>
                              <p className="text-sm font-medium">Usuario: {getUserDisplayName(creationInfo.user)}</p>
                              <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(creationInfo.date)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Información de última modificación */}
                        {latestUpdate && (
                          <div className="bg-white p-3 rounded-md border border-green-200">
                            <div className="flex items-center gap-3 mb-2">
                              <History className="h-4 w-4 text-green-600" />
                              <h6 className="text-xs font-semibold text-green-800">Última Modificación</h6>
                            </div>
                            <div className="flex items-center gap-3">
                              <UserAvatar user={latestUpdate.user} size="md" />
                              <div>
                                <p className="text-sm font-medium">Usuario: {getUserDisplayName(latestUpdate.user)}</p>
                                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(latestUpdate.date)} • Versión {latestUpdate.version}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Historial completo si hay múltiples versiones */}
                        {panel.history && Array.isArray(panel.history) && panel.history.length > 2 && (
                          <div className="bg-white p-3 rounded-md border border-gray-200">
                            <div className="flex items-center gap-3 mb-2">
                              <History className="h-4 w-4 text-gray-600" />
                              <h6 className="text-xs font-semibold text-gray-800">
                                Historial completo ({panel.history.length} versiones)
                              </h6>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {panel.history
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
                              {panel.history.length > 5 && (
                                <p className="text-xs text-gray-500 italic">
                                  ... y {panel.history.length - 5} versiones más
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lista de análisis */}
                    <AnalysisList
                      panel={panel}
                      showInactive={false}
                      canCreate={canCreateAnalyses}
                      canEdit={canEditAnalyses}
                      canDelete={canDeleteAnalyses}
                      refreshKey={refreshKey}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {hasMorePanels && (
        <div ref={loadMoreSentinelRef} className="flex justify-center items-center py-4">
          {isLoadingMore && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
        </div>
      )}

      {!hasMorePanels && panels.length > 0 && !isLoadingInitial && (
        <p className="text-center text-sm text-gray-400 mt-4">No hay más paneles para mostrar.</p>
      )}

      {/* Dialogs */}
      {isCreatePanelModalOpen && (
        <CreatePanelDialog
          open={isCreatePanelModalOpen}
          onOpenChange={setIsCreatePanelModalOpen}
          onSuccess={handleCreatePanelSuccess}
        />
      )}

      {isEditPanelModalOpen && selectedPanel && (
        <EditPanelDialog
          open={isEditPanelModalOpen}
          onOpenChange={setIsEditPanelModalOpen}
          onSuccess={handleEditPanelSuccess}
          panel={selectedPanel}
        />
      )}

      {isDeletePanelModalOpen && selectedPanel && (
        <DeletePanelDialog
          open={isDeletePanelModalOpen}
          onOpenChange={setIsDeletePanelModalOpen}
          onSuccess={handleDeletePanelSuccess}
          panel={selectedPanel}
        />
      )}
    </div>
  )
}
