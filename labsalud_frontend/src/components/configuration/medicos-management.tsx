"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Eye, Pencil, Trash, Settings } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { useDebounce } from "@/hooks/use-debounce"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { toast } from "sonner"
import { CreateMedicoDialog } from "./components/create-medico-dialog"
import { EditMedicoDialog } from "./components/edit-medico-dialog"
import { DeleteMedicoDialog } from "./components/delete-medico-dialog"
import { MedicoDetailsDialog } from "./components/medico-details-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Medico {
  id: number
  first_name: string
  last_name: string
  license: string
  is_active: boolean
  created_at: string
  created_by: {
    id: number
    username: string
    photo: string
  } | null
  history: HistoryEntry[]
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

interface ApiResponse {
  results: Medico[]
  count: number
  next: string | null
  previous: string | null
}

interface MedicosManagementProps {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  medico?: Medico
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

export function MedicosManagement({ canView, canCreate, canEdit, canDelete }: MedicosManagementProps) {
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const { apiRequest } = useApi()
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const buildUrl = useCallback((searchTerm: string, offset: number) => {
    const params = new URLSearchParams({
      limit: "20",
      offset: offset.toString(),
      search: searchTerm,
      is_active: "true",
    })
    return `/api/analysis/medicos/?${params.toString()}`
  }, [])

  const fetchMedicos = useCallback(
    async (reset = false) => {
      if (isLoading) return

      setIsLoading(true)
      setError(null)

      try {
        const currentOffset = reset ? 0 : offset
        const url = buildUrl(debouncedSearchTerm, currentOffset)
        const response = await apiRequest(url)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data: ApiResponse = await response.json()

        if (reset) {
          setMedicos(data.results)
          setOffset(20)
        } else {
          setMedicos((prev) => [...prev, ...data.results])
          setOffset((prev) => prev + 20)
        }

        setHasMore(data.next !== null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido"
        setError(errorMessage)
        toast.error(`Error al cargar médicos: ${errorMessage}`)
      } finally {
        setIsLoading(false)
      }
    },
    [apiRequest, buildUrl, debouncedSearchTerm, offset, isLoading],
  )

  const lastElementRef = useInfiniteScroll({
    loading: isLoading,
    hasMore,
    onLoadMore: () => fetchMedicos(false),
  })

  useEffect(() => {
    fetchMedicos(true)
  }, [debouncedSearchTerm])

  const handleCreateSuccess = () => {
    setShowCreateDialog(false)
    fetchMedicos(true)
    toast.success("Médico creado exitosamente")
  }

  const handleEditSuccess = () => {
    setShowEditDialog(false)
    setSelectedMedico(null)
    fetchMedicos(true)
    toast.success("Médico actualizado exitosamente")
  }

  const handleDeleteSuccess = () => {
    setShowDeleteDialog(false)
    setSelectedMedico(null)
    fetchMedicos(true)
    toast.success("Médico eliminado exitosamente")
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin permisos</h3>
          <p className="text-gray-500">No tienes permisos para ver esta sección.</p>
        </div>
      </div>
    )
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

  const getUserDisplayName = (user: { id: number; username: string; photo: string } | null | undefined) => {
    if (!user || !user.username || user.username.trim() === "") {
      return "Sistema"
    }
    return user.username
  }

  const getCreationInfo = (medicoItem: Medico) => {
    if (medicoItem.history && medicoItem.history.length > 0) {
      // La primera entrada del history es la creación (version 1)
      const creationEntry = medicoItem.history.find((entry) => entry.version === 1)
      if (creationEntry) {
        return {
          user: creationEntry.user,
          date: creationEntry.created_at,
        }
      }
    }
    // Fallback a los datos originales
    return {
      user: medicoItem.created_by,
      date: medicoItem.created_at,
    }
  }

  const getLatestUpdate = (medicoItem: Medico) => {
    if (medicoItem.history && medicoItem.history.length > 1) {
      // Ordenar por version descendente y tomar la más reciente
      const sortedHistory = [...medicoItem.history].sort((a, b) => b.version - a.version)
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Médicos</h2>
        <p className="text-gray-600">Administra los médicos del sistema</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar médicos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateDialog(true)} className="bg-[#204983] hover:bg-[#1a3d6f]">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Médico
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre y Apellido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matrícula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modificado por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {medicos.map((medico) => {
                const creationInfo = getCreationInfo(medico)
                const latestUpdate = getLatestUpdate(medico)
                
                return (
                  <tr
                    key={medico.id}
                    ref={medicos.indexOf(medico) === medicos.length - 1 ? lastElementRef : null}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {medico.first_name} {medico.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{medico.license}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TooltipProvider>
                        <div className="flex items-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <UserAvatar user={creationInfo.user} size="md" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-lg">
                                <strong>Creado por:</strong> {getUserDisplayName(creationInfo.user)}
                                <br />
                                <strong>Fecha:</strong> {formatDate(creationInfo.date)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TooltipProvider>
                        <div>
                          <Tooltip>
                            {latestUpdate ? (
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <UserAvatar user={latestUpdate?.user} size="md" />
                                </div>
                              </TooltipTrigger>
                            ): null}
                            <TooltipContent>
                              <p className="text-sm">
                                {latestUpdate ? (
                                  <>
                                    <strong>Modificado por:</strong> {getUserDisplayName(latestUpdate.user)}
                                    <br />
                                    <strong>Fecha:</strong> {formatDate(latestUpdate.date)}
                                    <br />
                                    <strong>Versión:</strong> {latestUpdate.version}
                                  </>
                                ) : (
                                  <span>Sin modificaciones</span>
                                )}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMedico(medico)
                            setShowDetailsDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMedico(medico)
                              setShowEditDialog(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 hover:bg-red-50 bg-transparent"
                            onClick={() => {
                              setSelectedMedico(medico)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#204983]"></div>
          </div>
        )}

        {!isLoading && medicos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron médicos</p>
          </div>
        )}
      </div>

      <CreateMedicoDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateSuccess}
        onOpenChange={(isOpen) => setShowCreateDialog(isOpen)}
      />

      {selectedMedico && (
        <>
          <EditMedicoDialog
            isOpen={showEditDialog}
            medico={selectedMedico}
            onClose={() => {
              setShowEditDialog(false)
              setSelectedMedico(null)
            }}
            onSuccess={handleEditSuccess}
          />

          <DeleteMedicoDialog
            isOpen={showDeleteDialog}
            medico={selectedMedico}
            onClose={() => {
              setShowDeleteDialog(false)
              setSelectedMedico(null)
            }}
            onSuccess={handleDeleteSuccess}
            onOpenChange={() => setShowDeleteDialog(false)}
          />

          <MedicoDetailsDialog
            isOpen={showDetailsDialog}
            medico={selectedMedico}
            onClose={() => {
              setShowDetailsDialog(false)
              setSelectedMedico(null)
            }}
          />
        </>
      )}
    </div>
  )
}
