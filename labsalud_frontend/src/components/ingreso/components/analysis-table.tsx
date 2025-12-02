"use client"

import { TestTube, X, Package } from "lucide-react"
import { Button } from "../../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Switch } from "../../ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { toast } from "sonner"
import type { SelectedAnalysis, Insurance } from "../../../types"

interface AnalysisTableProps {
  selectedAnalyses: SelectedAnalysis[]
  onAnalysisChange: (analyses: SelectedAnalysis[]) => void
  selectedInsurance: Insurance | null
  isPrivateInsurance?: boolean
}

export function AnalysisTable({
  selectedAnalyses,
  onAnalysisChange,
  selectedInsurance,
  isPrivateInsurance = false,
}: AnalysisTableProps) {
  const handleRemoveAnalysis = (analysisId: number) => {
    const analysis = selectedAnalyses.find((a) => a.id === analysisId)
    onAnalysisChange(selectedAnalyses.filter((a) => a.id !== analysisId))
    if (analysis) {
      toast.success(`Análisis "${analysis.name}" removido`)
    }
  }

  const handleToggleAuthorization = (analysisId: number) => {
    onAnalysisChange(
      selectedAnalyses.map((analysis) =>
        analysis.id === analysisId ? { ...analysis, is_authorized: !analysis.is_authorized } : analysis,
      ),
    )
  }

  const calculatePrice = (analysis: SelectedAnalysis): number => {
    if (!selectedInsurance) return 0
    const ub = Number.parseFloat(analysis.bio_unit) || 0
    if (isPrivateInsurance) {
      return ub * (selectedInsurance.private_ub_value || 0)
    }
    if (analysis.is_authorized) {
      return ub * (Number.parseFloat(selectedInsurance.ub_value) || 0)
    }
    return ub * (selectedInsurance.private_ub_value || 0)
  }

  const totalUb = selectedAnalyses.reduce((sum, a) => sum + (Number.parseFloat(a.bio_unit) || 0), 0)
  const authorizedCount = isPrivateInsurance ? 0 : selectedAnalyses.filter((a) => a.is_authorized).length

  return (
    <div className="space-y-4">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center justify-between text-[#204983] text-base sm:text-lg">
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4 sm:h-5 sm:w-5 text-[#204983]" />
              Análisis Seleccionados ({selectedAnalyses.length})
            </div>
            {selectedAnalyses.length > 0 && !isPrivateInsurance && (
              <div className="flex gap-2 text-xs font-normal">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {authorizedCount} autorizados
                </Badge>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {selectedAnalyses.length - authorizedCount} particulares
                </Badge>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {selectedAnalyses.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <Package className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm sm:text-base">No hay análisis seleccionados</p>
              <p className="text-xs sm:text-sm">Busque y agregue análisis usando el buscador</p>
            </div>
          ) : (
            <div>
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm w-[180px]">Análisis</TableHead>
                    <TableHead className="text-xs sm:text-sm text-center w-[80px]">Código</TableHead>
                    <TableHead className="text-xs sm:text-sm text-center w-[60px]">UB</TableHead>
                    {!isPrivateInsurance && (
                      <TableHead className="text-xs sm:text-sm text-center w-[90px]">Autorizado</TableHead>
                    )}
                    {selectedInsurance && (
                      <TableHead className="text-xs sm:text-sm text-right w-[80px]">Precio</TableHead>
                    )}
                    <TableHead className="text-xs sm:text-sm text-center w-[70px]">Urgente</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAnalyses.map((analysis) => (
                    <TableRow key={analysis.id}>
                      <TableCell className="font-medium text-xs sm:text-sm p-2 align-top">
                        <div className="leading-tight break-words whitespace-normal overflow-hidden">
                          {analysis.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-2 align-top">
                        <Badge variant="outline" className="font-mono text-xs">
                          {analysis.code || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm p-2 align-top">
                        {analysis.bio_unit}
                      </TableCell>
                      {!isPrivateInsurance && (
                        <TableCell className="text-center p-2 align-top">
                          <Switch
                            checked={analysis.is_authorized}
                            onCheckedChange={() => handleToggleAuthorization(analysis.id)}
                            className="data-[state=checked]:bg-green-500"
                          />
                        </TableCell>
                      )}
                      {selectedInsurance && (
                        <TableCell className="text-right p-2 align-top">
                          <span
                            className={`text-xs sm:text-sm font-medium ${
                              !isPrivateInsurance && analysis.is_authorized ? "text-green-600" : "text-orange-600"
                            }`}
                          >
                            ${calculatePrice(analysis).toFixed(2)}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-center p-2 align-top">
                        {analysis.is_urgent ? (
                          <Badge variant="destructive" className="text-xs">
                            Sí
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="p-2 align-top">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAnalysis(analysis.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 sm:h-8 sm:w-8 p-0"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  Total UB: <strong className="text-[#204983]">{totalUb.toFixed(2)}</strong>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

