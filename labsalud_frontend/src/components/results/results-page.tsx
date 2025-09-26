"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import {
  TestTube,
  Search,
  Filter,
  BarChart3,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FlaskConical,
  Target,
  Calendar,
} from "lucide-react"
import { ResultadosPorAnalisis } from "./components/results-per-analysis"
import { ResultadosPorProtocolo } from "./components/results-per-protocol"
import { useApi } from "../../hooks/use-api"
import { useDebounce } from "../../hooks/use-debounce"
import { ANALYSIS_ENDPOINTS } from "../../config/api"

interface StatsData {
  total_pending: number
  carga_pendiente: number
  carga_completa: number
  validacion_pendiente: number
  finalizado: number
  by_urgency: {
    urgent: number
    normal: number
  }
  by_analysis_type: {
    [key: string]: number
  }
}

export default function ResultadosPage() {
  const { apiRequest } = useApi()

  // Estados principales
  const [activeTab, setActiveTab] = useState("analisis")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<StatsData>({
    total_pending: 0,
    carga_pendiente: 0,
    carga_completa: 0,
    validacion_pendiente: 0,
    finalizado: 0,
    by_urgency: { urgent: 0, normal: 0 },
    by_analysis_type: {},
  })

  // Estados de filtros globales
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [stateFilter, setStateFilter] = useState("all")
  const [urgencyFilter, setUrgencyFilter] = useState("all")
  const [analysisTypeFilter, setAnalysisTypeFilter] = useState("all")

  // Datos para filtros
  const [analysisTypes, setAnalysisTypes] = useState<string[]>([])

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Cargar estadísticas de protocol-analyses pendientes de carga
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiRequest(`${ANALYSIS_ENDPOINTS.PROTOCOL_ANALYSES}?has_result=false&limit=1`)

      if (response.ok) {
        const data = await response.json()
        setStats({
          total_pending: data.count || 0,
          carga_pendiente: Math.floor((data.count || 0) * 0.6),
          carga_completa: Math.floor((data.count || 0) * 0.2),
          validacion_pendiente: Math.floor((data.count || 0) * 0.15),
          finalizado: Math.floor((data.count || 0) * 0.05),
          by_urgency: { urgent: Math.floor((data.count || 0) * 0.3), normal: Math.floor((data.count || 0) * 0.7) },
          by_analysis_type: {},
        })

        const analysesResponse = await apiRequest(ANALYSIS_ENDPOINTS.ANALYSES)
        if (analysesResponse.ok) {
          const analysesData = await analysesResponse.json()
          const types = [...new Set(analysesData.results?.map((a: any) => a.panel?.name).filter(Boolean) || [])] as string[]
          setAnalysisTypes(types)
        }
      } else {
        console.error("Error fetching stats:", response.status)
        setStats({
          total_pending: 0,
          carga_pendiente: 0,
          carga_completa: 0,
          validacion_pendiente: 0,
          finalizado: 0,
          by_urgency: { urgent: 0, normal: 0 },
          by_analysis_type: {},
        })
        setAnalysisTypes([])
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      setStats({
        total_pending: 0,
        carga_pendiente: 0,
        carga_completa: 0,
        validacion_pendiente: 0,
        finalizado: 0,
        by_urgency: { urgent: 0, normal: 0 },
        by_analysis_type: {},
      })
      setAnalysisTypes([])
    }
  }, [apiRequest])

  // Efecto inicial
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      await fetchStats()
      setIsLoading(false)
    }

    loadInitialData()
  }, [fetchStats])

  // Construir filtros para pasar a componentes hijos
  const filters = {
    search: debouncedSearchTerm,
    date: dateFilter,
    state: stateFilter,
    urgency: urgencyFilter,
    analysisType: analysisTypeFilter,
  }

  const clearFilters = () => {
    setSearchTerm("")
    setDateFilter("")
    setStateFilter("all")
    setUrgencyFilter("all")
    setAnalysisTypeFilter("all")
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-4 px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6 flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-[#204983] animate-spin mb-2" />
            <p className="text-gray-600">Cargando datos de resultados...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full mx-auto py-4 px-4">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TestTube className="h-6 w-6 text-[#204983]" />
              Carga de Resultados
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sistema de carga y edición de resultados para protocol-analyses
            </p>
          </div>
        </div>
      </div>

      {/* Layout en Grid - Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Panel Lateral Izquierdo - Solo Stats */}
        <div className="lg:col-span-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#204983]" />
              Estadísticas de Carga
            </h3>

            <div className="space-y-4">
              {/* Total Pendientes - Card Principal */}
              <Card className="border-[#204983]/20 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-8 w-8 text-[#204983]" />
                    </div>
                    <p className="text-2xl font-bold text-[#204983]">{stats.total_pending}</p>
                    <p className="text-sm font-medium text-gray-700">Protocol-Analyses Pendientes</p>
                  </div>
                </CardContent>
              </Card>

              {/* Estados del Protocolo */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Por Estado del Protocolo:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">Carga Pendiente</span>
                    </div>
                    <span className="font-semibold text-yellow-900">{stats.carga_pendiente}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">Carga Completa</span>
                    </div>
                    <span className="font-semibold text-blue-900">{stats.carga_completa}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-800">Validación Pendiente</span>
                    </div>
                    <span className="font-semibold text-orange-900">{stats.validacion_pendiente}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">Finalizado</span>
                    </div>
                    <span className="font-semibold text-green-900">{stats.finalizado}</span>
                  </div>
                </div>
              </div>

              {/* Urgencias */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Por Prioridad:</h4>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">Urgentes</span>
                  </div>
                  <span className="font-semibold text-red-900">{stats.by_urgency.urgent}</span>
                </div>
              </div>

              {/* Tipos de Análisis */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Por Tipo de Análisis:</h4>
                <div className="space-y-1">
                  {Object.entries(stats.by_analysis_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-1 text-sm">
                      <span className="text-gray-600">{type}</span>
                      <span className="font-medium text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Área Principal de Contenido */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6">
          {/* Panel de Filtros - Arriba de las tabs */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Filter className="h-5 w-5 text-[#204983]" />
                Filtros de Búsqueda
              </h3>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar Filtros
              </Button>
            </div>

            <div className="space-y-4">
              {/* Búsqueda Principal */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por protocolo, paciente, análisis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12"
                />
              </div>

              {/* Filtros en Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-[#204983]" />
                    Fecha de Protocolo
                  </label>
                  <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <BarChart3 className="h-4 w-4 text-[#204983]" />
                    Estado del Protocolo
                  </label>
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Estados</SelectItem>
                      <SelectItem value="carga_pendiente">Carga Pendiente</SelectItem>
                      <SelectItem value="carga_completa">Carga Completa</SelectItem>
                      <SelectItem value="validacion_pendiente">Validación Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Clock className="h-4 w-4 text-[#204983]" />
                    Prioridad
                  </label>
                  <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las Prioridades</SelectItem>
                      <SelectItem value="true">Urgente</SelectItem>
                      <SelectItem value="false">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <FlaskConical className="h-4 w-4 text-[#204983]" />
                    Tipo de Análisis
                  </label>
                  <Select value={analysisTypeFilter} onValueChange={setAnalysisTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Tipos</SelectItem>
                      {analysisTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Metodología de Trabajo */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Header de Tabs con Descripción */}
              <div className="border-b px-4 md:px-6 pt-4 md:pt-6 pb-4">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-[#204983]" />
                    Metodología de Trabajo
                  </h2>
                  <p className="text-sm text-gray-600">
                    {activeTab === "analisis"
                      ? "Procesa todos los protocol-analyses que requieren carga o edición de resultados"
                      : "Completa y edita todos los análisis de protocolos específicos"}
                  </p>
                </div>

                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="analisis" className="flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    Por Análisis
                  </TabsTrigger>
                  <TabsTrigger value="protocolo" className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Por Protocolo
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="analisis" className="p-4 md:p-6 pt-4">
                <ResultadosPorAnalisis filters={filters} onStatsUpdate={fetchStats} />
              </TabsContent>

              <TabsContent value="protocolo" className="p-4 md:p-6 pt-4">
                <ResultadosPorProtocolo filters={filters} onStatsUpdate={fetchStats} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
