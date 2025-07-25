"use client"

import { TestTube, X, Package } from "lucide-react"
import { Button } from "../../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { toast } from "sonner"
import type { AnalysisPanel } from "../../../types"

interface AnalysisTableProps {
  selectedAnalyses: AnalysisPanel[]
  onAnalysisChange: (analyses: AnalysisPanel[]) => void
}

export function AnalysisTable({ selectedAnalyses, onAnalysisChange }: AnalysisTableProps) {

  const handleRemovePanel = (panelId: number) => {
    const panel = selectedAnalyses.find((p) => p.id === panelId)
    onAnalysisChange(selectedAnalyses.filter((p) => p.id !== panelId))
    if (panel) {
      toast.success(`Panel "${panel.name}" removido`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Paneles Seleccionados */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-[#204983] text-base sm:text-lg">
            <TestTube className="h-4 w-4 sm:h-5 sm:w-5 text-[#204983]" />
            Paneles Seleccionados ({selectedAnalyses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {selectedAnalyses.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <Package className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm sm:text-base">No hay paneles seleccionados</p>
              <p className="text-xs sm:text-sm">Haga clic en "Agregar" para seleccionar paneles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Panel</TableHead>
                    <TableHead className="text-xs sm:text-sm">Código</TableHead>
                    <TableHead className="text-xs sm:text-sm">Urgente</TableHead>
                    <TableHead className="w-12 sm:w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAnalyses.map((panel) => (
                    <TableRow key={panel.id}>
                      <TableCell className="font-medium text-xs sm:text-sm">{panel.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {panel.code || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {panel.is_urgent ? (
                          <Badge variant="destructive" className="text-xs">
                            Sí
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePanel(panel.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 sm:h-8 sm:w-8 p-0"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
