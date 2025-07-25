"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, TestTube, Package, Plus } from "lucide-react"
import { Input } from "../../ui/input"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { useApi } from "../../../hooks/use-api"
import { useDebounce } from "../../../hooks/use-debounce"
import { useInfiniteScroll } from "../../../hooks/use-infinite-scroll"
import { toast } from "sonner"
import type { AnalysisPanel } from "../../../types"

interface AnalysisSearchProps {
  selectedAnalyses: AnalysisPanel[]
  onAnalysisChange: (analyses: AnalysisPanel[]) => void
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export function AnalysisSearch({ selectedAnalyses, onAnalysisChange }: AnalysisSearchProps) {
  const { apiRequest } = useApi()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<AnalysisPanel[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [nextUrl, setNextUrl] = useState<string | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const resultsRef = useRef<HTMLDivElement>(null)

  const loadMorePanels = () => {
    if (nextUrl && !isLoadingMore) {
      searchPanels(debouncedSearchTerm, false)
    }
  }

  const { setLastElementRef } = useInfiniteScroll({
    loading: isLoadingMore,
    hasMore,
    onLoadMore: loadMorePanels,
  })

  const searchPanels = async (term: string, isNewSearch = false) => {
    if (!term.trim()) {
      setSearchResults([])
      setShowResults(false)
      setHasMore(false)
      setNextUrl(null)
      return
    }

    try {
      if (isNewSearch) {
        setIsSearching(true)
        setSearchResults([])
      } else {
        setIsLoadingMore(true)
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL
      const url = isNewSearch
        ? `${baseUrl}/api/analysis/panels/?search=${encodeURIComponent(term.trim())}&is_active=true&limit=20&offset=0`
        : nextUrl

      if (!url) return

      console.log("Searching panels with URL:", url)

      const response = await apiRequest(url)

      if (response.ok) {
        const data: PaginatedResponse<AnalysisPanel> = await response.json()
        const newResults = data.results || []

        console.log("Search results:", newResults)

        if (isNewSearch) {
          setSearchResults(newResults)
        } else {
          setSearchResults((prev) => [...prev, ...newResults])
        }

        setHasMore(!!data.next)
        setNextUrl(data.next)
        setShowResults(newResults.length > 0 || searchResults.length > 0)
      } else {
        console.error("Search failed with status:", response.status)
        const errorData = await response.json()
        console.error("Search error:", errorData)
      }
    } catch (error) {
      console.error("Error searching panels:", error)
    } finally {
      setIsSearching(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      searchPanels(debouncedSearchTerm, true)
    } else {
      setSearchResults([])
      setShowResults(false)
      setHasMore(false)
      setNextUrl(null)
    }
  }, [debouncedSearchTerm])

  const handleAddPanel = (panel: AnalysisPanel) => {
    if (!selectedAnalyses.find((p) => p.id === panel.id)) {
      onAnalysisChange([...selectedAnalyses, panel])
      toast.success(`Panel "${panel.name}" agregado`)
    } else {
      toast.info(`El panel "${panel.name}" ya está seleccionado`)
    }
    setSearchTerm("")
    setShowResults(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredResults.length > 0) {
      e.preventDefault()
      handleAddPanel(filteredResults[0])
    }
  }

  const filteredResults = searchResults.filter(
    (panel) => !selectedAnalyses.find((selected) => selected.id === panel.id),
  )

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar paneles por nombre o código... (Enter para agregar el primero)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 border-gray-300 focus:border-[#204983] focus:ring-[#204983]"
          onFocus={() => searchTerm && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#204983]" />
          </div>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {showResults && filteredResults.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {filteredResults.map((panel, index) => (
            <div
              key={`panel-${panel.id}`}
              ref={index === filteredResults.length - 1 ? setLastElementRef : null}
              className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-[#204983]" />
                <div>
                  <div className="font-medium text-sm">{panel.name}</div>
                  <div className="text-xs text-gray-500">Código: {panel.code || "N/A"} | Panel completo</div>
                </div>
                {panel.is_urgent && (
                  <Badge variant="destructive" className="text-xs">
                    Urgente
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddPanel(panel)}
                className="border-[#204983] text-[#204983] hover:bg-[#204983] hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {isLoadingMore && (
            <div className="flex items-center justify-center p-3 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#204983] mr-2" />
              Cargando más paneles...
            </div>
          )}

          {!hasMore && filteredResults.length > 0 && (
            <div className="text-center p-2 text-xs text-gray-400">No hay más resultados</div>
          )}
        </div>
      )}

      {/* No hay resultados */}
      {showResults && searchTerm && filteredResults.length === 0 && !isSearching && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          <TestTube className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No se encontraron paneles para "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
}
