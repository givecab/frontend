"use client"

import { Card, CardContent } from "../../ui/card"
import { TestTube2, Loader2 } from "lucide-react"

interface Panel {
  id: number
  name: string
  bio_unit: string
}

interface PanelSelectorProps {
  panels: Panel[]
  selectedPanel: Panel | null
  isLoading: boolean
  onPanelSelect: (panel: Panel) => void
}

export function PanelSelector({ panels, selectedPanel, isLoading, onPanelSelect }: PanelSelectorProps) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {panels.map((panel) => (
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
                <p className="text-xs text-gray-500">Unidad Bio: {panel.bio_unit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
