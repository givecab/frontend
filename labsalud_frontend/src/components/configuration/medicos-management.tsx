"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useApi } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, PlusCircle, Search, AlertCircle, PackageSearch, Users } from "lucide-react"
import type { Medico } from "./configuration-page"
import { CreateMedicoDialog } from "./components/create-medico-dialog"
import { EditMedicoDialog } from "./components/edit-medico-dialog"
import { DeleteMedicoDialog } from "./components/delete-medico-dialog"
import { MedicoCard } from "./components/medico-card"
import { useToast } from "@/hooks/use-toast"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { useDebounce } from "@/hooks/use-debounce"

interface MedicosManagementProps {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

const PAGE_LIMIT = 20

export const MedicosManagement: React.FC<MedicosManagementProps> = ({ canView, canCreate, canEdit, canDelete }) => {
  const { apiRequest } = useApi()
  const toastActions = useToast()

  const [medicos, setMedicos] = useState<Medico[]>([])
  const [totalMedicos, setTotalMedicos] = useState(0)
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null)

  const buildUrl = useCallback(
    (offset = 0, search = debouncedSearchTerm) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const endpoint = import.meta.env.VITE_MEDICOS_ACTIVE_ENDPOINT

      let url = `${baseUrl}${endpoint}?limit=${PAGE_LIMIT}&offset=${offset}`
      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }
      return url
    },
    [debouncedSearchTerm],
  )

  const fetchMedicos = useCallback(
    async (isNewSearch = false) => {
      if (!canView) {
        setError("No tienes permiso para ver médicos.")
        setIsLoadingInitial(false)
        return
      }

      let currentUrlToFetch: string
      if (isNewSearch) {
        setMedicos([])
        setNextUrl(null)
        setTotalMedicos(0)
        currentUrlToFetch = buildUrl(0)
      } else {
        if (!nextUrl) {
          setIsLoadingMore(false)
          return
        }
        currentUrlToFetch = nextUrl
      }

      setIsLoadingInitial(isNewSearch && medicos.length === 0)
      setIsLoadingMore(!isNewSearch)
      setError(null)

      try {
        const response = await apiRequest(currentUrlToFetch)
        if (response.ok) {
          const data = await response.json()
          setMedicos((prev) => (isNewSearch ? data.results : [...prev, ...data.results]))
          setTotalMedicos(data.count)
          setNextUrl(data.next)
        } else {
          setError("Error al cargar los médicos.")
          toastActions.error("Error", { description: "No se pudieron cargar los médicos." })
        }
      } catch (err) {
        console.error("Error fetching medicos:", err)
        setError("Ocurrió un error inesperado al cargar los médicos.")
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
      fetchMedicos(true)
    }
  }, [canView, debouncedSearchTerm])

  const hasMore = !!nextUrl && medicos.length < totalMedicos

  const loadMoreSentinelRef = useInfiniteScroll({
    loading: isLoadingMore,
    hasMore,
    onLoadMore: () => {
      if (nextUrl && !isLoadingMore) {
        fetchMedicos(false)
      }
    },
    dependencies: [nextUrl, isLoadingMore, hasMore],
  })

  const handleDialogClose = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false)
    setSelectedMedico(null)
  }

  const handleCreateSuccess = () => {
    fetchMedicos(true)
    setIsCreateModalOpen(false)
  }

  const handleEditSuccess = () => {
    fetchMedicos(true)
    setIsEditModalOpen(false)
    setSelectedMedico(null)
  }

  const handleDeleteSuccess = () => {
    fetchMedicos(true)
    setIsDeleteModalOpen(false)
    setSelectedMedico(null)
  }

  if (!canView && !canCreate) {
    return (
      <div className="text-gray-600 bg-gray-50 p-4 rounded-md flex items-center">
        <AlertCircle className="mr-2" /> No tienes permisos para gestionar médicos.
      </div>
    )
  }

  if (isLoadingInitial && medicos.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#204983]" />
        <span className="ml-2">Cargando médicos...</span>
      </div>
    )
  }

  if (error && medicos.length === 0) {
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
                <Users className="mr-3 h-7 w-7 text-[#204983]" />
                Médicos Activos
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Consulta, crea, edita y desactiva médicos registrados en el sistema.
              </p>
            </div>
            {canCreate && (
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{ backgroundColor: "#204983", color: "white" }}
                >
                  <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Médico
                </Button>
              </div>
            )}
          </div>
          <div className="mt-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar médico (nombre, matrícula)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                disabled={!canView}
              />
            </div>
          </div>
        </div>
      </div>

      {error && medicos.length > 0 && <div className="text-red-500 bg-red-50 p-3 rounded-md mb-4">{error}</div>}

      {medicos.length === 0 && !isLoadingInitial && !error && (
        <div className="text-center text-gray-500 py-12 bg-white shadow sm:rounded-lg">
          <PackageSearch className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No se encontraron médicos</h3>
          <p className="mt-1 text-sm text-gray-500">
            No hay médicos activos que coincidan con tu búsqueda o no hay médicos registrados.
          </p>
        </div>
      )}

      {medicos.length > 0 && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {medicos.map((medico) => (
            <MedicoCard
              key={medico.id}
              medico={medico}
              onEdit={
                canEdit
                  ? () => {
                      setSelectedMedico(medico)
                      setIsEditModalOpen(true)
                    }
                  : undefined
              }
              onDelete={
                canDelete
                  ? () => {
                      setSelectedMedico(medico)
                      setIsDeleteModalOpen(true)
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div ref={loadMoreSentinelRef} className="flex justify-center items-center py-6">
          {isLoadingMore && <Loader2 className="h-6 w-6 animate-spin text-[#204983]" />}
        </div>
      )}
      {!hasMore && medicos.length > 0 && !isLoadingInitial && (
        <p className="text-center text-sm text-gray-500 mt-8">Fin de los resultados.</p>
      )}

      {isCreateModalOpen && canCreate && (
        <CreateMedicoDialog
          open={isCreateModalOpen}
          onOpenChange={(open) => {
            if (!open) handleDialogClose(setIsCreateModalOpen)
          }}
          onSuccess={handleCreateSuccess}
        />
      )}
      {isEditModalOpen && selectedMedico && canEdit && (
        <EditMedicoDialog
          open={isEditModalOpen}
          onOpenChange={(open) => {
            if (!open) handleDialogClose(setIsEditModalOpen)
          }}
          onSuccess={handleEditSuccess}
          medico={selectedMedico}
        />
      )}
      {isDeleteModalOpen && selectedMedico && canDelete && (
        <DeleteMedicoDialog
          open={isDeleteModalOpen}
          onOpenChange={(open) => {
            if (!open) handleDialogClose(setIsDeleteModalOpen)
          }}
          onSuccess={handleDeleteSuccess}
          medico={selectedMedico}
        />
      )}
    </div>
  )
}
