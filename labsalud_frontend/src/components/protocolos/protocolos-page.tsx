"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Plus, Filter, Calendar, User, FileText, Loader2, AlertCircle, X } from "lucide-react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ProtocolCard } from "./components/protocol-card"
import { useApi } from "../../hooks/use-api"
import { useInfiniteScroll } from "../../hooks/use-infinite-scroll"
import { useDebounce } from "../../hooks/use-debounce"
import { useNavigate } from "react-router-dom"
import { ANALYSIS_ENDPOINTS } from "@/config/api"

interface HistoryEntry {
  version: number
  user: {
    id: number
    username: string
    photo: string
  } | null
  created_at: string
}

interface Patient {
  id: number
  first_name: string
  last_name: string
}

interface Protocol {
  id: number
  patient: Patient
  state: string
  paid: boolean
  created_at: string
  created_by: {
    id: number
    username: string
    photo: string
  }
  history: HistoryEntry[]
}

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Protocol[]
}

interface StateStats {
  [key: string]: number
}

export default function ProtocolosPage() {
  const { apiRequest } = useApi()
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Estados principales
  const [allProtocols, setAllProtocols] = useState<Protocol[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [stateFilter, setStateFilter] = useState<string>("all")
  const [paidFilter, setPaidFilter] = useState<string>("all")
  const [hasMore, setHasMore] = useState(true)
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Estados para estadísticas
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    validated: 0,
    finalized: 0,
    cancelled: 0,
  })

  // Debounce para la búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Función para cargar estadísticas por estado
  const fetchStateStats = useCallback(async () => {
    try {
      const response = await apiRequest(`${ANALYSIS_ENDPOINTS.PROTOCOLS}?stats=true`)

      if (response.ok) {
        const stateStats: StateStats = await response.json()

        setStats({
          total: totalCount,
          pending: stateStats.carga_pendiente || 0,
          completed: stateStats.carga_completa || 0,
          validated: stateStats.validacion_pendiente || 0,
          finalized: stateStats.finalizado || 0,
          cancelled: stateStats.cancelado || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching state stats:", error)
    }
  }, [apiRequest, totalCount])

  // Función para construir URL con parámetros
  const buildUrl = useCallback(
    (search = "", offset = 0) => {
      const baseEndpoint = ANALYSIS_ENDPOINTS.PROTOCOLS

      const params = new URLSearchParams({
        limit: "20",
        offset: offset.toString(),
      })

      if (search.trim()) {
        params.append("search", search.trim())
      }

      if (stateFilter !== "all") {
        params.append("state", stateFilter)
      }

      if (paidFilter !== "all") {
        params.append("paid", paidFilter === "paid" ? "true" : "false")
      }

      return `${baseEndpoint}?${params.toString()}`
    },
    [stateFilter, paidFilter],
  )

  // Función para cargar protocolos desde la API
  const fetchProtocolsFromAPI = useCallback(
    async (search = "", reset = true, showSearching = false) => {
      // Evitar múltiples llamadas simultáneas
      if (reset && !showSearching && isInitialLoading) return
      if (!reset && isLoadingMore) return
      if (reset && showSearching && isSearching) return

      if (reset && !showSearching) {
        setIsInitialLoading(true)
        setError(null)
      } else if (reset && showSearching) {
        setIsSearching(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const url = reset ? buildUrl(search, 0) : nextUrl
        if (!url) return

        const response = await apiRequest(url)

        if (response.ok) {
          const data: PaginatedResponse = await response.json()

          if (reset) {
            setAllProtocols(data.results)
            setTotalCount(data.count)
          } else {
            setAllProtocols((prev) => [...prev, ...data.results])
          }

          setNextUrl(data.next)
          setHasMore(!!data.next)
        } else {
          setError("Error al cargar los protocolos")
        }
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError("Error al cargar los datos. Por favor, intenta nuevamente.")
      } finally {
        setIsInitialLoading(false)
        setIsLoadingMore(false)
        setIsSearching(false)
      }
    },
    [apiRequest, buildUrl, nextUrl, isInitialLoading, isLoadingMore, isSearching],
  )

  // Cargar más protocolos (scroll infinito)
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && nextUrl && !isSearching) {
      fetchProtocolsFromAPI("", false)
    }
  }, [isLoadingMore, hasMore, nextUrl, isSearching, fetchProtocolsFromAPI])

  // Hook de scroll infinito
  const sentinelRef = useInfiniteScroll({
    loading: isLoadingMore || isSearching,
    hasMore: hasMore,
    onLoadMore: loadMore,
    dependencies: [hasMore, nextUrl],
  })

  // Efecto para carga inicial
  useEffect(() => {
    fetchProtocolsFromAPI()
  }, [])

  // Efecto para recargar protocolos cuando cambian los filtros
  useEffect(() => {
    // Resetear estados antes de cargar
    setAllProtocols([])
    setNextUrl(null)
    setHasMore(true)
    fetchProtocolsFromAPI()
  }, [stateFilter, paidFilter])

  // Efecto para búsqueda - optimizado para no perder el foco
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return // Solo ejecutar cuando el debounce esté listo

    fetchProtocolsFromAPI(debouncedSearchTerm, true, true)
  }, [debouncedSearchTerm])

  // Efecto para cargar estadísticas al inicio y después de cada búsqueda
  useEffect(() => {
    if (totalCount > 0) {
      fetchStateStats()
    }
  }, [totalCount, fetchStateStats])

  const clearSearch = () => {
    setSearchTerm("")
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const handleNewProtocol = () => {
    navigate("/ingreso")
  }

  // Estados de carga y error
  if (isInitialLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-4 px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6 flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-[#204983] animate-spin mb-2" />
            <p className="text-gray-600">Cargando protocolos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto py-4 px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Gestión de Protocolos</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
            <Button onClick={() => fetchProtocolsFromAPI("", true)} className="mt-3 bg-[#204983]" size="sm">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full mx-auto py-4 px-4">
      {/* Header Container */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Gestión de Protocolos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalCount > 0 && `${totalCount} protocolos registrados`}
              {searchTerm && ` • ${allProtocols.length} resultados`}
            </p>
          </div>
          <Button onClick={handleNewProtocol} className="bg-[#204983] w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Protocolo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Completos</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.completed}</p>
                </div>
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Validación</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.validated}</p>
                </div>
                <Filter className="h-6 w-6 sm:h-8 sm:w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Finalizados</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.finalized}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Cancelados</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <X className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters Container */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar por ID, paciente o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-10 h-10 md:h-12 text-base md:text-lg"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 text-[#204983] animate-spin" />
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="carga_pendiente">Carga Pendiente</SelectItem>
                <SelectItem value="carga_completa">Carga Completa</SelectItem>
                <SelectItem value="validacion_pendiente">Validación Pendiente</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paidFilter} onValueChange={setPaidFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="unpaid">No Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs md:text-sm text-gray-500">Búsqueda por ID, nombre de paciente o estado</p>
            {searchTerm && (
              <p className="text-xs text-[#204983] font-medium">
                {allProtocols.length} resultado{allProtocols.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Protocols List */}
      <div className="space-y-4">
        {allProtocols.length === 0 && !isInitialLoading && !isSearching ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-8 sm:p-12 text-center">
            <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No se encontraron protocolos</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {searchTerm || stateFilter !== "all" || paidFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Aún no hay protocolos registrados en el sistema"}
            </p>
            <Button onClick={handleNewProtocol} className="bg-[#204983] hover:bg-[#1a3d6b] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Protocolo
            </Button>
          </div>
        ) : (
          <>
            {/* Indicador de búsqueda */}
            {isSearching && (
              <div className="flex justify-center py-4">
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 text-[#204983] animate-spin mr-2" />
                  <span className="text-gray-600">Buscando protocolos...</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 items-start">
              {allProtocols.map((protocol) => (
                <ProtocolCard
                  key={protocol.id}
                  protocol={protocol}
                  onUpdate={() => fetchProtocolsFromAPI(debouncedSearchTerm, true, true)}
                />
              ))}
            </div>
          </>
        )}

        {/* Infinite Scroll Sentinel */}
        {hasMore && !isSearching && !isInitialLoading && allProtocols.length > 0 && (
          <div ref={sentinelRef} className="flex justify-center py-4">
            {isLoadingMore && (
              <div className="flex items-center">
                <Loader2 className="h-6 w-6 text-[#204983] animate-spin mr-2" />
                <span className="text-gray-600">Cargando más protocolos...</span>
              </div>
            )}
          </div>
        )}

        {/* No more results */}
        {!hasMore && allProtocols.length > 0 && (
          <div className="text-center py-4 text-gray-500">
            <p>No hay más protocolos para mostrar</p>
          </div>
        )}
      </div>
    </div>
  )
}
