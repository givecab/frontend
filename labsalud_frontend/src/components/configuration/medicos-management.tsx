"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Eye, Pencil, Trash, Settings, User } from "lucide-react"
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
  updated_at: string
  created_by: {
    id: number
    username: string
    first_name: string
    last_name: string
    photo?: string
  } | null
  updated_by: Array<{
    id: number
    username: string
    first_name: string
    last_name: string
    photo?: string
    updated_at: string
  }>
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
}

const UserAvatar = ({ user, date }: { user: any; date: string }) => {
  if (user === null || !user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-100">
                <Settings className="h-4 w-4 text-gray-600" />
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>Creado por el sistema</p>
            <p className="text-xs text-gray-500">{new Date(date).toLocaleString("es-ES")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="cursor-help">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photo || "/placeholder.svg"} />
            <AvatarFallback className="bg-blue-100">
              {user.username ? user.username.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          <p>Creado por: {user.username}</p>
          <p className="text-xs text-gray-500">{new Date(date).toLocaleString("es-ES")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const UpdatedByAvatars = ({ updatedBy }: { updatedBy: Medico["updated_by"] }) => {
  if (!updatedBy || updatedBy.length === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-help">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-500 text-sm">
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
    <div className="flex -space-x-2">
      {displayUsers.map((user) => (
        <TooltipProvider key={user.id}>
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src={user.photo || "/placeholder.svg"} />
                <AvatarFallback className="bg-blue-100">
                  {user.username ? user.username.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>Modificado por: {user.username}</p>
              <p className="text-xs text-gray-500">{new Date(user.updated_at).toLocaleString("es-ES")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-600 text-xs border-2 border-white">
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

export const MedicosManagement: React.FC<MedicosManagementProps> = ({ canView, canCreate, canEdit, canDelete }) => {
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
    })
    return `/api/analysis/medicos/active/?${params.toString()}`
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
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apellido
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
              {medicos.map((medico) => (
                <tr
                  key={medico.id}
                  ref={medicos.indexOf(medico) === medicos.length - 1 ? lastElementRef : null}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{medico.first_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{medico.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{medico.license}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UserAvatar user={medico.created_by} date={medico.created_at} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UpdatedByAvatars updatedBy={medico.updated_by} />
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
              ))}
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
