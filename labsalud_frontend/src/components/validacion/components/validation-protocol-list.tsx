"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Loader2, AlertCircle, Search, Filter, FileText, User, Calendar, Activity } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { ANALYSIS_ENDPOINTS } from "@/config/api"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { ValidationProtocolCard } from "./validation-protocol-card"
import type { ProtocolSummary } from "@/types"

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const getStateLabel = (state: string): string => {
  const stateMap: Record<string, string> = {
    pending_entry: "Carga Pendiente",
    entry_complete: "Carga Completa",
    pending_validation: "Validación Pendiente",
    completed: "Finalizado",
    cancelled: "Cancelado",
  }
  return stateMap[state] || state
}

const getStateBadgeClasses = (state: string): string => {
  switch (state) {
    case "pending_entry":
      return "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200"
    case "pending_validation":
      return "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200"
    case "completed":
      return "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
  }
}

export function ValidationProtocolList() {
  const { apiRequest } = useApi()
  const [protocols, setProtocols] = useState<ProtocolSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextUrl, setNextUrl] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [stateFilter, setStateFilter] = useState<string>("pending_validation")

  const buildUrl = useCallback(
    (search = "", offset = 0) => {
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

      return `${ANALYSIS_ENDPOINTS.PROTOCOLS_SUMMARY}?${params.toString()}`
    },
    [stateFilter],
  )

  const fetchProtocols = useCallback(
    async (reset = true) => {
      if (reset) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)

      try {
        const url = reset ? buildUrl(searchTerm, 0) : nextUrl
        if (!url) return

        const response = await apiRequest(url)

        if (!response.ok) {
          throw new Error("Error al cargar los protocolos")
        }

        const data: PaginatedResponse<ProtocolSummary> = await response.json()

        if (reset) {
          setProtocols(data.results)
          setTotalCount(data.count)
        } else {
          setProtocols((prev) => [...prev, ...data.results])
        }

        setNextUrl(data.next)
        setHasMore(!!data.next)
      } catch (err) {
        console.error("[v0] Error loading protocols:", err)
        setError("Error al cargar los protocolos pendientes de validación")
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [apiRequest, buildUrl, searchTerm, nextUrl],
  )

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && nextUrl) {
      fetchProtocols(false)
    }
  }, [isLoadingMore, hasMore, nextUrl, fetchProtocols])

  const sentinelRef = useInfiniteScroll({
    loading: isLoadingMore,
    hasMore: hasMore,
    onLoadMore: loadMore,
    dependencies: [hasMore, nextUrl],
  })

  const filteredProtocols = useMemo(() => {
    return protocols.filter((protocol) => {
      const matchesSearch =
        searchTerm === "" ||
        protocol.patient_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.patient_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        protocol.patient_dni?.includes(searchTerm) ||
        String(protocol.id || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [protocols, searchTerm])

  useEffect(() => {
    fetchProtocols()
  }, [])

  useEffect(() => {
    setProtocols([])
    setNextUrl(null)
    setHasMore(true)
    fetchProtocols()
  }, [stateFilter])

  const handleProtocolValidated = (protocolId: number) => {
    setProtocols((prev) => prev.filter((p) => p.id !== protocolId))
    setTotalCount((prev) => prev - 1)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#204983]" />
          <p className="text-gray-600">Cargando protocolos activos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por paciente, DNI o número de protocolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <div className="sm:w-64">
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="bg-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending_validation">Validación Pendiente</SelectItem>
              <SelectItem value="entry_complete">Carga Completa</SelectItem>
              <SelectItem value="all">Todos los estados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProtocols.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <AlertCircle className="h-12 w-12 mb-3 text-gray-400" />
          <p className="text-lg font-medium">No se encontraron protocolos</p>
          <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <>
          <Accordion type="multiple" className="w-full space-y-2">
            {filteredProtocols.map((protocol) => (
              <AccordionItem
                key={protocol.id}
                value={`protocol-${protocol.id}`}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors hover:no-underline">
                  <div className="flex items-center gap-3 flex-wrap w-full">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#204983]" />
                      <span className="font-semibold text-[#204983]">Protocolo #{protocol.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {protocol.patient_first_name} {protocol.patient_last_name}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-gray-50">
                      DNI: {protocol.patient_dni}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                      {protocol.ooss}
                    </Badge>
                    <Badge variant="outline" className={`font-medium ${getStateBadgeClasses(protocol.state)}`}>
                      {getStateLabel(protocol.state)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm font-medium text-[#204983]">
                      <Activity className="h-4 w-4" />
                      {protocol.loaded_results_count}/{protocol.total_analyses_count}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(protocol.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-4 bg-gray-50">
                  <ValidationProtocolCard protocol={protocol} onProtocolValidated={handleProtocolValidated} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {hasMore && !isLoading && filteredProtocols.length > 0 && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              {isLoadingMore && (
                <div className="flex items-center">
                  <Loader2 className="h-6 w-6 text-[#204983] animate-spin mr-2" />
                  <span className="text-gray-600">Cargando más protocolos...</span>
                </div>
              )}
            </div>
          )}

          {!hasMore && filteredProtocols.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>No hay más protocolos para mostrar</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
