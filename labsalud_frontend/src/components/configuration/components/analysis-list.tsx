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
  Clock,
  TestTube2,
  Plus,
  User,
  Settings,
  History,
} from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { CreateDeterminationDialog } from "./create-determination-dialog"
import { EditDeterminationDialog } from "./edit-determination-dialog"
import { DeleteDeterminationDialog } from "./delete-determination-dialog"
import { DeterminationHistoryDialog } from "./determination-history-dialog"
import type { Determination } from "@/types"
import { CATALOG_ENDPOINTS } from "@/config/api"

interface AnalysisCatalog {
  id: number
  name: string | null
  code: number | null
}

interface AnalysisListProps {
  analysis: AnalysisCatalog
  showInactive: boolean
  refreshKey: number
}

const PAGE_LIMIT = 10

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

const UpdatedByAvatars = ({ updatedBy }: { updatedBy: Determination["updated_by"] }) => {
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
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-2 w-2" />
                {formatFullDate(new Date().toISOString())}
              </p>
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

export const AnalysisList: React.FC<AnalysisListProps> = ({ analysis, showInactive, refreshKey }) => {
  const { apiRequest } = useApi()
  const { error } = useToast()

  const [analyses, setAnalyses] = useState<Determination[]>([])
  const [totalAnalyses, setTotalAnalyses] = useState(0)
  const [analysesNextUrl, setAnalysesNextUrl] = useState<string | null>(null)
  const [expandedDeterminations, setExpandedDeterminations] = useState<Set<number>>(new Set())
  const [expandedAnalyses, setExpandedAnalyses] = useState<Set<number>>(new Set())

  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [err, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<Determination | null>(null)

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [selectedHistoryAnalysis, setSelectedHistoryAnalysis] = useState<{ id: number; name: string } | null>(null)

  const buildAnalysesUrl = useCallback(
    (offset = 0, search = "") => {
      let url = `${CATALOG_ENDPOINTS.DETERMINATIONS}?analysis=${analysis.id}&limit=${PAGE_LIMIT}&offset=${offset}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      return url
    },
    [analysis.id],
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

          const results = Array.isArray(data.results) ? data.results : []

          const filteredResults = results.filter(
            (determination: Determination) => determination.analysis === analysis.id,
          )

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
    [apiRequest, error, buildAnalysesUrl, analysesNextUrl, debouncedSearchTerm, analysis.id],
  )

  const toggleDetermination = (determinationId: number) => {
    setExpandedDeterminations((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(determinationId)) {
        newSet.delete(determinationId)
      } else {
        newSet.add(determinationId)
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

  useEffect(() => {
    fetchAnalyses(true)
  }, [analysis.id, debouncedSearchTerm, showInactive, refreshKey])

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
        <Button
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-transparent"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" /> Nueva Determinación
        </Button>
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
          {analyses.map((analysisItem) => {
            const isExpanded = expandedDeterminations.has(analysisItem.id)

            return (
              <div
                key={analysisItem.id}
                className={`border rounded-md transition-all duration-300 bg-white border-gray-100 ${
                  isExpanded ? "ring-2 ring-blue-200" : ""
                }`}
              >
                <div className="flex justify-between items-center p-2">
                  {/* Left side: clickable area to expand/collapse */}
                  <div
                    className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-gray-50 transition-colors rounded-md p-1 -m-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDetermination(analysisItem.id)
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-gray-500" />
                      )}
                      <TestTube2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{analysisItem.name}</p>
                      <p className="text-xs text-gray-500">Unidad: {analysisItem.measure_unit}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {analysisItem.creation && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={analysisItem.creation.user.photo || "/placeholder.svg"} />
                                    <AvatarFallback className="text-[8px]">
                                      {analysisItem.creation.user.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-[10px] text-gray-500">Creado</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <p className="font-semibold">{analysisItem.creation.user.username}</p>
                                  <p className="text-gray-500">
                                    {new Date(analysisItem.creation.date).toLocaleString()}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {analysisItem.last_change && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={analysisItem.last_change.user.photo || "/placeholder.svg"} />
                                    <AvatarFallback className="text-[8px]">
                                      {analysisItem.last_change.user.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-[10px] text-gray-500">Modificado</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <p className="font-semibold">{analysisItem.last_change.user.username}</p>
                                  <p className="text-gray-500">
                                    {new Date(analysisItem.last_change.date).toLocaleString()}
                                  </p>
                                  {analysisItem.last_change.changes && analysisItem.last_change.changes.length > 0 && (
                                    <div className="mt-1">
                                      <p className="font-medium">Cambios:</p>
                                      <ul className="list-disc list-inside">
                                        {analysisItem.last_change.changes.map((change, idx) => (
                                          <li key={idx}>{change}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: action buttons (not clickable for expand/collapse) */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAnalysis(analysisItem)
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
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAnalysis(analysisItem)
                              setIsDeleteModalOpen(true)
                            }}
                            className="h-7 w-7 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar Determinación</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedHistoryAnalysis({ id: analysisItem.id, name: analysisItem.name })
                              setIsHistoryDialogOpen(true)
                            }}
                            className="h-7 w-7 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver Historial</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-4 bg-gray-50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedHistoryAnalysis({ id: analysisItem.id, name: analysisItem.name })
                        setIsHistoryDialogOpen(true)
                      }}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <History className="h-4 w-4" />
                      Ver Historial Completo
                    </Button>
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

      {isCreateModalOpen && (
        <CreateDeterminationDialog
          analysis={analysis}
          isOpen={isCreateModalOpen}
          onClose={() => handleDialogClose(setIsCreateModalOpen)}
          onSuccess={handleSuccess}
        />
      )}

      {isEditModalOpen && selectedAnalysis && (
        <EditDeterminationDialog
          determination={selectedAnalysis}
          isOpen={isEditModalOpen}
          onClose={() => handleDialogClose(setIsEditModalOpen)}
          onSuccess={handleSuccess}
        />
      )}

      {isDeleteModalOpen && selectedAnalysis && (
        <DeleteDeterminationDialog
          determination={selectedAnalysis}
          open={isDeleteModalOpen}
          onOpenChange={(open) => {
            setIsDeleteModalOpen(open)
            if (!open) setSelectedAnalysis(null)
          }}
          onSuccess={handleSuccess}
        />
      )}

      {isHistoryDialogOpen && selectedHistoryAnalysis && (
        <DeterminationHistoryDialog
          open={isHistoryDialogOpen}
          onOpenChange={setIsHistoryDialogOpen}
          determinationId={selectedHistoryAnalysis.id}
          determinationName={selectedHistoryAnalysis.name}
        />
      )}
    </div>
  )
}
