"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Loader2,
  Search,
  PackageX,
  Trash,
  Pencil,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  TestTube2,
  Plus,
  User,
  Settings,
} from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { CreateAnalysisDialog } from "./create-analysis-dialog"
import { EditAnalysisDialog } from "./edit-analysis-dialog"
import { DeleteAnalysisDialog } from "./delete-analysis-dialog"

interface AnalysisItem {
  id: number
  name: string
  code: string
  measure_unit: string
  formula?: string
  panel: number
  created_by: {
    id: number
    username: string
    photo?: string
  } | null
  updated_by: Array<{
    id: number
    username: string
    photo?: string
  }> | null
  created_at: string | null
  updated_at: string | null
}

interface Panel {
  id: number
  name: string | null
  code: number | null
}

interface AnalysisListProps {
  panel: Panel
  showInactive: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  refreshKey: number
}

const PAGE_LIMIT = 10

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Fecha no disponible"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Fecha inválida"

    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return "hace menos de 1 hora"
    if (diffInHours < 24) return `hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`
    if (diffInDays < 7) return `hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`

    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return "Fecha inválida"
  }
}

const formatFullDate = (dateString: string | null): string => {
  if (!dateString) return "Fecha no disponible"

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Fecha inválida"

    return date.toLocaleString("es-ES", {
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

const UserAvatar = ({ user, date }: { user: any; date: string }) => {
  if (user === null || !user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-gray-100">
                <Settings className="h-3 w-3 text-gray-600" />
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>Creado por el sistema</p>
            <p className="text-xs text-gray-500">{formatFullDate(date)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="cursor-help">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.photo || "/placeholder.svg"} />
            <AvatarFallback className="bg-blue-100">
              {user.username ? user.username.charAt(0).toUpperCase() : <User className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          <p>Creado por: {user.username}</p>
          <p className="text-xs text-gray-500">{formatFullDate(date)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const UpdatedByAvatars = ({ updatedBy }: { updatedBy: AnalysisItem["updated_by"] }) => {
  if (!updatedBy || updatedBy.length === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-500 text-xs">
              <Settings className="h-3 w-3 text-gray-600" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sin modificaciones</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const displayUsers = updatedBy.slice(0, 3)
  const remainingCount = updatedBy.length - 3

  return (
    <div className="flex -space-x-1">
      {displayUsers.map((user) => (
        <TooltipProvider key={user.id}>
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              <Avatar className="h-6 w-6 border-2 border-white">
                <AvatarImage src={user.photo || "/placeholder.svg"} />
                <AvatarFallback className="bg-blue-100">
                  {user.username ? user.username.charAt(0).toUpperCase() : <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>Modificado por: {user.username}</p>
              <p className="text-xs text-gray-500">{formatFullDate(new Date().toISOString())}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-gray-600 text-xs border-2 border-white">
                +{remainingCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {remainingCount} modificación{remainingCount > 1 ? "es" : ""} adicional{remainingCount > 1 ? "es" : ""}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

export const AnalysisList: React.FC<AnalysisListProps> = ({
  panel,
  showInactive,
  canCreate,
  canEdit,
  canDelete,
  refreshKey,
}) => {
  const { apiRequest } = useApi()
  const { error } = useToast()

  const [analyses, setAnalyses] = useState<AnalysisItem[]>([])
  const [totalAnalyses, setTotalAnalyses] = useState(0)
  const [analysesNextUrl, setAnalysesNextUrl] = useState<string | null>(null)
  const [expandedAnalyses, setExpandedAnalyses] = useState<Set<number>>(new Set())

  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [err, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisItem | null>(null)

  const buildAnalysesUrl = useCallback(
    (offset = 0, search = "") => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      let url = `${baseUrl}/api/analysis/panels/${panel.id}/analyses/?limit=${PAGE_LIMIT}&offset=${offset}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      return url
    },
    [panel.id],
  )

  const fetchAnalyses = useCallback(
    async (isNewSearchOrFilter = false) => {
      let currentUrlToFetch: string

      if (isNewSearchOrFilter) {
        setAnalyses([])
        setAnalysesNextUrl(null)
        setTotalAnalyses(0)
        currentUrlToFetch = buildAnalysesUrl(0, debouncedSearchTerm)
      } else {
        if (!analysesNextUrl) {
          setIsLoadingMore(false)
          return
        }
        currentUrlToFetch = analysesNextUrl
      }

      setIsLoadingInitial(isNewSearchOrFilter)
      setIsLoadingMore(!isNewSearchOrFilter)
      setError(null)

      try {
        const response = await apiRequest(currentUrlToFetch)
        if (response.ok) {
          const data = await response.json()

          // Verificar que data.results existe y es un array
          const results = Array.isArray(data.results) ? data.results : []

          // Filtrar las determinaciones que pertenecen al panel actual
          const filteredResults = results.filter((analysis: AnalysisItem) => analysis.panel === panel.id)

          setAnalyses((prev) => (isNewSearchOrFilter ? filteredResults : [...prev, ...filteredResults]))
          setTotalAnalyses(data.count || 0)
          setAnalysesNextUrl(data.next || null)
        } else {
          setError("Error al cargar las determinaciones.")
          if (error) {
            error("Error", { description: "No se pudieron cargar las determinaciones." })
          }
        }
      } catch (err) {
        console.error("Error fetching analyses:", err)
        setError("Ocurrió un error inesperado al cargar determinaciones.")
        if (error) {
          error("Error", { description: "Error de conexión o servidor (determinaciones)." })
        }
      } finally {
        setIsLoadingInitial(false)
        setIsLoadingMore(false)
      }
    },
    [apiRequest, error, buildAnalysesUrl, analysesNextUrl, debouncedSearchTerm, panel.id],
  )

  useEffect(() => {
    fetchAnalyses(true)
  }, [panel.id, debouncedSearchTerm, showInactive, refreshKey])

  const hasMoreAnalyses = !!analysesNextUrl && analyses.length < totalAnalyses

  const loadMoreSentinelRef = useInfiniteScroll({
    loading: isLoadingMore,
    hasMore: hasMoreAnalyses,
    onLoadMore: () => {
      if (analysesNextUrl && !isLoadingMore) {
        fetchAnalyses(false)
      }
    },
    dependencies: [analysesNextUrl, isLoadingMore],
  })

  const toggleAnalysis = (analysisId: number) => {
    setExpandedAnalyses((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(analysisId)) {
        newSet.delete(analysisId)
      } else {
        newSet.add(analysisId)
      }
      return newSet
    })
  }

  const handleSuccess = () => {
    fetchAnalyses(true)
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setIsDeleteModalOpen(false)
    setSelectedAnalysis(null)
  }

  const handleDialogClose = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false)
    setSelectedAnalysis(null)
  }

  return (
    <div className="space-y-3 pt-3">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4">
        <h4 className="text-sm font-semibold text-gray-700 flex-shrink-0">Determinaciones ({totalAnalyses})</h4>
        <div className="relative w-full sm:w-auto flex-grow sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar determinación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm h-8 w-full"
          />
        </div>
        {canCreate && (
          <Button
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-transparent"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" /> Nueva Determinación
          </Button>
        )}
      </div>

      {isLoadingInitial && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Cargando determinaciones...</span>
        </div>
      )}

      {!isLoadingInitial && err && <div className="text-center text-red-500 py-4 text-sm">{err}</div>}

      {!isLoadingInitial && !err && analyses.length === 0 && (
        <div className="text-center text-gray-400 py-4 text-sm">
          <PackageX className="mx-auto h-8 w-8 text-gray-300 mb-1" />
          Este panel no tiene determinaciones
          {searchTerm ? " que coincidan con la búsqueda." : "."}
        </div>
      )}

      {analyses.length > 0 && (
        <div className="space-y-2 px-4">
          {analyses.map((analysis) => {
            const isExpanded = expandedAnalyses.has(analysis.id)

            return (
              <div
                key={analysis.id}
                className={`border rounded-md transition-all duration-300 bg-white border-gray-100 ${
                  isExpanded ? "ring-2 ring-blue-200" : ""
                }`}
              >
                <div
                  className="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleAnalysis(analysis.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-gray-500" />
                      )}
                      <TestTube2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 flex items-center gap-2">{analysis.name}</p>
                      <p className="text-xs text-gray-500">
                        Código: {analysis.code} | Unidad: {analysis.measure_unit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Creado:</span>
                        <UserAvatar user={analysis.created_by} date={analysis.created_at || ""} />
                      </div>
                      {analysis.updated_by && analysis.updated_by.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Editado:</span>
                          <UpdatedByAvatars updatedBy={analysis.updated_by} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      {canEdit && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedAnalysis(analysis)
                                  setIsEditModalOpen(true)
                                }}
                                className="h-7 w-7 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar Determinación</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {canDelete && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedAnalysis(analysis)
                                  setIsDeleteModalOpen(true)
                                }}
                                className="h-7 w-7 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Desactivar Determinación</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-green-50 p-3">
                    <h6 className="text-xs font-semibold text-gray-700 mb-3">Información de Auditoría</h6>
                    <div className="space-y-3">
                      <div className="bg-white p-2 rounded-md border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-3 w-3 text-blue-600" />
                          <h6 className="text-xs font-semibold text-blue-800">Creación</h6>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserAvatar user={analysis.created_by} date={analysis.created_at || ""} />
                          <div>
                            <p className="text-xs font-medium">Usuario: {analysis.created_by?.username || "Sistema"}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Calendar className="h-2 w-2" />
                              {formatFullDate(analysis.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {analysis.updated_by && analysis.updated_by.length > 0 && (
                        <div className="bg-white p-2 rounded-md border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-3 w-3 text-green-600" />
                            <h6 className="text-xs font-semibold text-green-800">Última Modificación</h6>
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={analysis.updated_by[analysis.updated_by.length - 1]?.photo || "/placeholder.svg"}
                              />
                              <AvatarFallback className="bg-green-100">
                                {analysis.updated_by[analysis.updated_by.length - 1]?.username
                                  ?.charAt(0)
                                  .toUpperCase() || <User className="h-3 w-3" />}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-medium">
                                Usuario: {analysis.updated_by[analysis.updated_by.length - 1]?.username}
                              </p>
                              <p className="text-xs text-gray-600 flex items-center gap-1">
                                <Clock className="h-2 w-2" />
                                {formatFullDate(analysis.updated_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {analysis.formula && (
                        <div className="bg-white p-2 rounded-md border border-gray-200">
                          <p className="text-xs font-medium mb-1">Fórmula:</p>
                          <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded border font-mono">
                            {analysis.formula}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {hasMoreAnalyses && (
        <div ref={loadMoreSentinelRef} className="flex justify-center items-center py-4">
          {isLoadingMore && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
        </div>
      )}
      {!hasMoreAnalyses && analyses.length > 0 && !isLoadingInitial && (
        <p className="text-center text-xs text-gray-400 mt-3">Fin de las determinaciones.</p>
      )}

      {isCreateModalOpen && canCreate && (
        <CreateAnalysisDialog
          open={isCreateModalOpen}
          onOpenChange={(openValue) => {
            if (!openValue) handleDialogClose(setIsCreateModalOpen)
          }}
          onSuccess={handleSuccess}
          panelId={panel.id}
        />
      )}
      {isEditModalOpen && selectedAnalysis && canEdit && (
        <EditAnalysisDialog
          open={isEditModalOpen}
          onOpenChange={(openValue) => {
            if (!openValue) handleDialogClose(setIsEditModalOpen)
          }}
          onSuccess={handleSuccess}
          analysis={selectedAnalysis}
          panelId={panel.id}
        />
      )}
      {isDeleteModalOpen && selectedAnalysis && canDelete && (
        <DeleteAnalysisDialog
          open={isDeleteModalOpen}
          onOpenChange={(openValue) => {
            if (!openValue) handleDialogClose(setIsDeleteModalOpen)
          }}
          onSuccess={handleSuccess}
          analysis={selectedAnalysis}
        />
      )}
    </div>
  )
}
