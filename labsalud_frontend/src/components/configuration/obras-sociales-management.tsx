"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, AlertCircle, ShieldCheckIcon, Plus } from "lucide-react"
import type { ObraSocial } from "./configuration-page"
import { CreateObraSocialDialog } from "./components/create-obra-social-dialog"
import { EditObraSocialDialog } from "./components/edit-obra-social-dialog"
import { ObraSocialCard } from "./components/obra-social-card"
import { useToast } from "@/hooks/use-toast"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { useDebounce } from "@/hooks/use-debounce"

interface ObrasSocialesManagementProps {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

const PAGE_LIMIT = 20

export const ObrasSocialesManagement: React.FC<ObrasSocialesManagementProps> = ({
  canView,
  canCreate,
  canEdit,
  canDelete,
}) => {
  const { apiRequest } = useApi()
  const { success, error } = useToast()

  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])
  const [totalObrasSociales, setTotalObrasSociales] = useState(0)
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [errorState, setErrorState] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [switchLoading, setSwitchLoading] = useState<number | null>(null)
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedObraSocial, setSelectedObraSocial] = useState<ObraSocial | null>(null)

  const buildUrl = useCallback(
    (offset = 0, search = debouncedSearchTerm) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const endpoint = import.meta.env.VITE_OBRAS_SOCIALES_ACTIVE_ENDPOINT
      let url = `${baseUrl}${endpoint}?limit=${PAGE_LIMIT}&offset=${offset}`
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }
      return url
    },
    [debouncedSearchTerm],
  )

  const fetchObrasSociales = useCallback(
    async (isNewSearchOrFilter = false) => {
      if (!canView) {
        setErrorState("No tienes permiso para ver obras sociales.")
        setIsLoadingInitial(false)
        return
      }

      let currentUrlToFetch: string
      if (isNewSearchOrFilter) {
        setObrasSociales([])
        setNextUrl(null)
        setTotalObrasSociales(0)
        currentUrlToFetch = buildUrl(0)
      } else {
        if (!nextUrl) {
          setIsLoadingMore(false)
          return
        }
        currentUrlToFetch = nextUrl
      }

      setIsLoadingInitial(isNewSearchOrFilter && obrasSociales.length === 0)
      setIsLoadingMore(!isNewSearchOrFilter)
      setErrorState(null)

      try {
        const response = await apiRequest(currentUrlToFetch)
        if (response.ok) {
          const data = await response.json()
          setObrasSociales((prev) => (isNewSearchOrFilter ? data.results : [...prev, ...data.results]))
          setTotalObrasSociales(data.count)
          setNextUrl(data.next)
        } else {
          setErrorState("Error al cargar las obras sociales.")
          error("Error", { description: "No se pudieron cargar las obras sociales." })
        }
      } catch (err) {
        console.error("Error fetching OOSS:", err)
        setErrorState("Ocurrió un error inesperado al cargar las obras sociales.")
        error("Error", { description: "Error de conexión o servidor." })
      } finally {
        setIsLoadingInitial(false)
        setIsLoadingMore(false)
      }
    },
    [apiRequest, canView, error, buildUrl, nextUrl, obrasSociales.length],
  )

  useEffect(() => {
    if (canView) {
      fetchObrasSociales(true)
    }
  }, [canView, debouncedSearchTerm])

  const hasMore = !!nextUrl && obrasSociales.length < totalObrasSociales

  const loadMoreSentinelRef = useInfiniteScroll({
    loading: isLoadingMore,
    hasMore,
    onLoadMore: () => {
      if (nextUrl && !isLoadingMore) {
        fetchObrasSociales(false)
      }
    },
    dependencies: [nextUrl, isLoadingMore, hasMore],
  })

  const handleCreateSuccess = () => {
    fetchObrasSociales(true)
    setIsCreateModalOpen(false)
  }

  const handleEditSuccess = () => {
    fetchObrasSociales(true)
    setIsEditModalOpen(false)
    setSelectedObraSocial(null)
  }

  const handleEdit = (obraSocial: ObraSocial) => {
    setSelectedObraSocial(obraSocial)
    setIsEditModalOpen(true)
  }

  const handleToggleActive = async (obraSocialToToggle: ObraSocial, newStatus: boolean) => {
    if (!((obraSocialToToggle.is_active && canDelete) || (!obraSocialToToggle.is_active && canEdit))) {
      error("Permiso denegado", { description: "No tienes permisos para cambiar el estado." })
      return
    }

    setSwitchLoading(obraSocialToToggle.id)
    const originalStatus = obraSocialToToggle.is_active

    // Optimistic update - cambio inmediato en tiempo real
    setObrasSociales((prevObrasSociales) =>
      prevObrasSociales.map((os) => (os.id === obraSocialToToggle.id ? { ...os, is_active: newStatus } : os)),
    )

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const endpoint = "/api/analysis/ooss/"

      let response: Response
      if (newStatus) {
        // Activar: PATCH con is_active: true
        response = await apiRequest(`${baseUrl}${endpoint}${obraSocialToToggle.id}/`, {
          method: "PATCH",
          body: { is_active: true },
        })
      } else {
        // Desactivar: DELETE sin body
        response = await apiRequest(`${baseUrl}${endpoint}${obraSocialToToggle.id}/`, {
          method: "DELETE",
        })
      }

      if ((newStatus && response.ok) || (!newStatus && response.status === 204)) {
        success("Estado actualizado", {
          description: `Obra Social ${obraSocialToToggle.name} ${newStatus ? "activada" : "desactivada"}.`,
        })

        // Si la respuesta incluye datos actualizados, los usamos
        if (response.ok && newStatus) {
          try {
            const updatedOS = await response.json()
            setObrasSociales((prevObrasSociales) =>
              prevObrasSociales.map((os) => (os.id === updatedOS.id ? updatedOS : os)),
            )
          } catch {
            // Si no hay JSON, mantenemos el optimistic update
          }
        }
      } else {
        // Revertir el cambio optimista
        setObrasSociales((prevObrasSociales) =>
          prevObrasSociales.map((os) => (os.id === obraSocialToToggle.id ? { ...os, is_active: originalStatus } : os)),
        )
        const errorData = await response.json().catch(() => ({ detail: "Error al actualizar." }))
        error("Error al actualizar", { description: errorData.detail || "No se pudo cambiar el estado." })
      }
    } catch (errorCatch) {
      // Revertir el cambio optimista
      setObrasSociales((prevObrasSociales) =>
        prevObrasSociales.map((os) => (os.id === obraSocialToToggle.id ? { ...os, is_active: originalStatus } : os)),
      )
      error("Error de red", { description: "No se pudo conectar con el servidor." })
      console.error("Error toggling active state:", errorCatch)
    } finally {
      setSwitchLoading(null)
    }
  }

  if (!canView && !canCreate) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>No tienes permisos para gestionar Obras Sociales.</p>
        </div>
      </div>
    )
  }

  if (isLoadingInitial && obrasSociales.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#204983]" />
        <span className="ml-2">Cargando obras sociales...</span>
      </div>
    )
  }

  if (errorState && obrasSociales.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{errorState}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Obras Sociales</h3>
          <p className="text-sm text-gray-500">Gestiona las obras sociales del sistema</p>
        </div>
        {canCreate && (
          <Button className="bg-[#204983] hover:bg-[#1a3d6f]" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Obra Social
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar obra social..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={!canView}
          />
        </div>
      </div>

      {obrasSociales.length === 0 && !isLoadingInitial && !errorState ? (
        <div className="text-center py-12">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No se encontraron Obras Sociales</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "Ninguna obra social coincide con tu búsqueda." : "No hay obras sociales registradas."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {obrasSociales.map((os) => (
            <ObraSocialCard
              key={os.id}
              obraSocial={os}
              onEdit={canEdit ? handleEdit : undefined}
              onToggleActive={handleToggleActive}
              canEdit={canEdit}
              canDelete={canDelete}
              isToggling={switchLoading === os.id}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div ref={loadMoreSentinelRef} className="flex justify-center items-center py-6">
          {isLoadingMore && <Loader2 className="h-6 w-6 animate-spin text-[#204983]" />}
        </div>
      )}

      {!hasMore && obrasSociales.length > 0 && !isLoadingInitial && (
        <p className="text-center text-sm text-gray-500 py-4">Fin de los resultados.</p>
      )}

      {/* Dialogs */}
      {isCreateModalOpen && (
        <CreateObraSocialDialog
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={handleCreateSuccess}
        />
      )}
      {isEditModalOpen && selectedObraSocial && (
        <EditObraSocialDialog
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSuccess={handleEditSuccess}
          obraSocial={selectedObraSocial}
        />
      )}
    </div>
  )
}
