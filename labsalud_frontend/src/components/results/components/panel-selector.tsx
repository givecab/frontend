"use client"

import { useState } from "react"
import { Card, CardContent } from "../../ui/card"
import { Input } from "../../ui/input"
import { TestTube2, Loader2, Search } from "lucide-react"

interface Panel {
  id: number
  name: string
  bio_unit: string
  code?: string
}

interface PanelSelectorProps {
  panels: Panel[]
  selectedPanel: Panel | null
  isLoading: boolean
  onPanelSelect: (panel: Panel) => void
}

export function PanelSelector({ panels, selectedPanel, isLoading, onPanelSelect }: PanelSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#204983] mb-2" />
          <p className="text-gray-600">Cargando paneles disponibles...</p>
        </div>
      </div>
    )
  }

  if (panels.length === 0) {
    return (
      <div className="text-center py-12">
        <TestTube2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No hay paneles disponibles</p>
        <p className="text-gray-500 text-sm">Ajusta los filtros para ver más resultados</p>
      </div>
    )
  }

  const filteredPanels = panels.filter(
    (panel) =>
      panel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      panel.bio_unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (panel.code && panel.code.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar paneles por nombre, código o unidad bio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPanels.map((panel) => (
          <Card
            key={panel.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedPanel?.id === panel.id
                ? "border-[#204983] bg-blue-50 shadow-lg"
                : "border-gray-200 hover:border-[#204983]/50"
            }`}
            onClick={() => onPanelSelect(panel)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TestTube2 className="h-4 w-4 text-[#204983]" />
                    <h4 className="font-semibold text-gray-900">{panel.name}</h4>
                  </div>
                  {panel.code && <p className="text-sm font-mono text-[#204983] mb-1">Código: {panel.code}</p>}
                  <p className="text-xs text-gray-500">Unidad Bio: {panel.bio_unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPanels.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <TestTube2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600">No se encontraron paneles que coincidan con "{searchTerm}"</p>
          <p className="text-gray-500 text-sm">Intenta con otros términos de búsqueda</p>
        </div>
      )}
    </div>
  )
}
