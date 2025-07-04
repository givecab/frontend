"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { useDebounce } from "@/hooks/use-debounce"
import type { AnalysisItem, AnalysisPanel } from "../configuration-page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, PlusCircle, Search, PackageX, Trash2, Edit3 } from "lucide-react"
import { CreateAnalysisDialog } from "./create-analysis-dialog"
import { EditAnalysisDialog } from "./edit-analysis-dialog"
import { DeleteAnalysisDialog } from "./delete-analysis-dialog"

interface AnalysisListProps {
  panel: AnalysisPanel
  showInactive: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  refreshKey: number
}

const PAGE_LIMIT = 10

export const AnalysisList: React.FC<AnalysisListProps> = ({
  panel,
  showInactive,
  canCreate,
  canEdit,
  canDelete,
  refreshKey,
}) => {
  const { apiRequest } = useApi()
  const toastActions = useToast()

  const [analyses, setAnalyses] = useState<AnalysisItem[]>([])
  const [totalAnalyses, setTotalAnalyses] = useState(0)
  const [analysesNextUrl, setAnalysesNextUrl] = useState<string | null>(null)

  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisItem | null>(null)

  const buildAnalysesUrl = useCallback(
    (offset = 0, search = debouncedSearchTerm) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const endpoint = showInactive
        ? import.meta.env.VITE_ANALYSIS_ENDPOINT
        : import.meta.env.VITE_ANALYSIS_ACTIVE_ENDPOINT

      let url = `${baseUrl}${endpoint.replace("{panel_id}", panel.id.toString())}?limit=${PAGE_LIMIT}&offset=${offset}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      return url
    },
    [panel.id, debouncedSearchTerm, showInactive],
  )

  const fetchAnalyses = useCallback(
    async (isNewSearchOrFilter = false) => {
      let currentUrlToFetch: string
      if (isNewSearchOrFilter) {
        setAnalyses([])
        setAnalysesNextUrl(null)
        setTotalAnalyses(0)
        currentUrlToFetch = buildAnalysesUrl(0)
      } else {
        if (!analysesNextUrl) {
          setIsLoadingMore(false)
          return
        }
        currentUrlToFetch = analysesNextUrl
      }

      setIsLoadingInitial(isNewSearchOrFilter && analyses.length === 0)
      setIsLoadingMore(!isNewSearchOrFilter)
      setError(null)

      try {
        const response = await apiRequest(currentUrlToFetch)
        if (response.ok) {
          const data = await response.json()
          setAnalyses((prev) => (isNewSearchOrFilter ? data.results : [...prev, ...data.results]))
          setTotalAnalyses(data.count)
          setAnalysesNextUrl(data.next)
        } else {
          setError("Error al cargar las determinaciones.")
          toastActions.error("Error", { description: "No se pudieron cargar las determinaciones." })
        }
      } catch (err) {
        console.error("Error fetching analyses:", err)
        setError("Ocurrió un error inesperado al cargar determinaciones.")
        toastActions.error("Error", { description: "Error de conexión o servidor (determinaciones)." })
      } finally {
        setIsLoadingInitial(false)
        setIsLoadingMore(false)
      }
    },
    [apiRequest, toastActions, buildAnalysesUrl, analysesNextUrl],
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
    dependencies: [analysesNextUrl, isLoadingMore, hasMoreAnalyses],
  })

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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
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
          <Button size="sm" variant="outline" onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="mr-1 h-4 w-4" /> Nueva
          </Button>
        )}
      </div>

      {isLoadingInitial && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Cargando determinaciones...</span>
        </div>
      )}

      {!isLoadingInitial && error && <div className="text-center text-red-500 py-4 text-sm">{error}</div>}

      {!isLoadingInitial && !error && analyses.length === 0 && (
        <div className="text-center text-gray-400 py-4 text-sm">
          <PackageX className="mx-auto h-8 w-8 text-gray-300 mb-1" />
          Este panel no tiene determinaciones
          {showInactive ? "" : " activas"}
          {searchTerm ? " que coincidan con la búsqueda." : "."}
        </div>
      )}

      {analyses.length > 0 && (
        <div className="space-y-2">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className={`flex justify-between items-center p-2 rounded-md border ${
                !analysis.is_active ? "bg-gray-50 opacity-70 border-gray-200" : "bg-white border-gray-100"
              }`}
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {analysis.name}{" "}
                  {!analysis.is_active && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      Inactiva
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  Código: {analysis.code} | Unidad: {analysis.measure_unit}
                  {analysis.formula && ` | Fórmula: ${analysis.formula}`}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                {canEdit && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAnalysis(analysis)
                            setIsEditModalOpen(true)
                          }}
                          className="h-7 w-7 text-gray-500 hover:text-blue-600"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar Determinación</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {canDelete && analysis.is_active && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAnalysis(analysis)
                            setIsDeleteModalOpen(true)
                          }}
                          className="h-7 w-7 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Desactivar Determinación</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          ))}
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
