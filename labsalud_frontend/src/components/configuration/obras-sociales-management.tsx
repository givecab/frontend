"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, PlusCircle, Search, AlertCircle, ShieldCheckIcon, PackageSearch } from "lucide-react"
import type { ObraSocial } from "./configuration-page"
import { CreateObraSocialDialog } from "./components/create-obra-social-dialog"
import { EditObraSocialDialog } from "./components/edit-obra-social-dialog"
import { ObraSocialCard } from "./components/obra-social-card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
  const toastActions = useToast()

  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])
  const [totalObrasSociales, setTotalObrasSociales] = useState(0)
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [showInactive, setShowInactive] = useState(false)
  const [switchLoading, setSwitchLoading] = useState<number | null>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedObraSocial, setSelectedObraSocial] = useState<ObraSocial | null>(null)

  const buildUrl = useCallback(
    (offset = 0, search = debouncedSearchTerm, inactive = showInactive) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const endpoint = import.meta.env.VITE_OBRAS_SOCIALES_ACTIVE_ENDPOINT
      let url = `${baseUrl}${endpoint}?limit=${PAGE_LIMIT}&offset=${offset}`
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }
      if (!inactive) {
        url += `&is_active=true`
      }
      return url
    },
    [debouncedSearchTerm, showInactive],
  )

  const fetchObrasSociales = useCallback(
    async (isNewSearchOrFilter = false) => {
      if (!canView) {
        setError("No tienes permiso para ver obras sociales.")
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
      setError(null)

      try {
        const response = await apiRequest(currentUrlToFetch)
        if (response.ok) {
          const data = await response.json()
          setObrasSociales((prev) => (isNewSearchOrFilter ? data.results : [...prev, ...data.results]))
          setTotalObrasSociales(data.count)
          setNextUrl(data.next)
        } else {
          setError("Error al cargar las obras sociales.")
          toastActions.error("Error", { description: "No se pudieron cargar las obras sociales." })
        }
      } catch (err) {
        console.error("Error fetching OOSS:", err)
        setError("Ocurrió un error inesperado al cargar las obras sociales.")
        toastActions.error("Error", { description: "Error de conexión o servidor." })
      } finally {
        setIsLoadingInitial(false)
        setIsLoadingMore(false)
      }
    },
    [apiRequest, canView, toastActions, buildUrl, nextUrl],
  )

  useEffect(() => {
    if (canView) {
      fetchObrasSociales(true)
    }
  }, [canView, debouncedSearchTerm, showInactive])

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

  const handleDialogClose = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false)
    setSelectedObraSocial(null)
  }

  const handleCreateSuccess = () => {
    fetchObrasSociales(true)
    setIsCreateModalOpen(false)
  }

  const handleEditSuccess = () => {
    fetchObrasSociales(true)
    setIsEditModalOpen(false)
    setSelectedObraSocial(null)
  }

  const handleToggleActive = async (obraSocialToToggle: ObraSocial, newStatus: boolean) => {
    if (!((obraSocialToToggle.is_active && canDelete) || (!obraSocialToToggle.is_active && canEdit))) {
      toastActions.warning("Permiso denegado", { description: "No tienes permisos para cambiar el estado." })
      return
    }

    setSwitchLoading(obraSocialToToggle.id)
    const originalStatus = obraSocialToToggle.is_active

    // Optimistic update
    setObrasSociales((prevObrasSociales) =>
      prevObrasSociales.map((os) => (os.id === obraSocialToToggle.id ? { ...os, is_active: newStatus } : os)),
    )

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const endpoint = import.meta.env.VITE_OBRAS_SOCIALES_ENDPOINT
      const response = await apiRequest(`${baseUrl}${endpoint}${obraSocialToToggle.id}/`, {
        method: "PATCH",
        body: { is_active: newStatus },
      })

      if (response.ok) {
        const updatedOS = await response.json()
        setObrasSociales((prevObrasSociales) =>
          prevObrasSociales.map((os) => (os.id === updatedOS.id ? updatedOS : os)),
        )
        toastActions.success("Estado actualizado", {
          description: `Obra Social ${updatedOS.name} ${updatedOS.is_active ? "activada" : "desactivada"}.`,
        })
        if ((!showInactive && !newStatus) || (showInactive && newStatus !== originalStatus)) {
          fetchObrasSociales(true)
        }
      } else {
        setObrasSociales((prevObrasSociales) =>
          prevObrasSociales.map((os) => (os.id === obraSocialToToggle.id ? { ...os, is_active: originalStatus } : os)),
        )
        const errorData = await response.json().catch(() => ({ detail: "Error al actualizar." }))
        toastActions.error("Error al actualizar", { description: errorData.detail || "No se pudo cambiar el estado." })
      }
    } catch (error) {
      setObrasSociales((prevObrasSociales) =>
        prevObrasSociales.map((os) => (os.id === obraSocialToToggle.id ? { ...os, is_active: originalStatus } : os)),
      )
      toastActions.error("Error de red", { description: "No se pudo conectar con el servidor." })
      console.error("Error toggling active state:", error)
    } finally {
      setSwitchLoading(null)
    }
  }

  if (!canView && !canCreate) {
    return (
      <div className="text-gray-600 bg-gray-50 p-4 rounded-md flex items-center">
        <AlertCircle className="mr-2" /> No tienes permisos para gestionar Obras Sociales.
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

  if (error && obrasSociales.length === 0) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-md flex items-center">
        <AlertCircle className="mr-2" /> {error}
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
                <ShieldCheckIcon className="mr-3 h-7 w-7 text-[#204983]" />
                Obras Sociales
              </h2>
              <p className="mt-1 text-sm text-gray-500">Administra las obras sociales, su estado y detalles.</p>
            </div>
            {canCreate && (
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{ backgroundColor: "#204983", color: "white" }}
                >
                  <PlusCircle className="mr-2 h-5 w-5" /> Nueva Obra Social
                </Button>
              </div>
            )}
          </div>
          <div className="mt-6 md:flex md:items-center md:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar obra social (nombre, código)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                disabled={!canView}
              />
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
              <Switch
                id="show-inactive-os"
                checked={showInactive}
                onCheckedChange={setShowInactive}
                disabled={!canView}
              />
              <Label htmlFor="show-inactive-os" className="text-sm text-gray-600">
                Mostrar inactivas
              </Label>
            </div>
          </div>
        </div>
      </div>

      {error && obrasSociales.length > 0 && <div className="text-red-500 bg-red-50 p-3 rounded-md mb-4">{error}</div>}

      {obrasSociales.length === 0 && !isLoadingInitial && !error && (
        <div className="text-center text-gray-500 py-12 bg-white shadow sm:rounded-lg">
          <PackageSearch className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No se encontraron Obras Sociales</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "Ninguna obra social coincide con tu búsqueda." : "No hay obras sociales registradas."}
            {!showInactive && " Prueba activando 'Mostrar inactivas'."}
          </p>
        </div>
      )}

      {obrasSociales.length > 0 && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {obrasSociales.map((os) => (
            <ObraSocialCard
              key={os.id}
              obraSocial={os}
              onEdit={
                canEdit
                  ? () => {
                      setSelectedObraSocial(os)
                      setIsEditModalOpen(true)
                    }
                  : undefined
              }
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
        <p className="text-center text-sm text-gray-500 mt-8">Fin de los resultados.</p>
      )}

      {isCreateModalOpen && canCreate && (
        <CreateObraSocialDialog
          open={isCreateModalOpen}
          onOpenChange={(open) => {
            if (!open) handleDialogClose(setIsCreateModalOpen)
          }}
          onSuccess={handleCreateSuccess}
        />
      )}
      {isEditModalOpen && selectedObraSocial && canEdit && (
        <EditObraSocialDialog
          open={isEditModalOpen}
          onOpenChange={(open) => {
            if (!open) handleDialogClose(setIsEditModalOpen)
          }}
          onSuccess={handleEditSuccess}
          obraSocial={selectedObraSocial}
        />
      )}
    </div>
  )
}
