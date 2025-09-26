"use client"

import { Input } from "../../ui/input"
import { Textarea } from "../../ui/textarea"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Calculator, CheckCircle2, XCircle, Save, Loader2, Clock, History } from "lucide-react"

interface Analysis {
  id: number
  name: string
  measure_unit: string
  code: string
}

interface Result {
  id: number
  value: string
  is_abnormal: boolean
  note: string
  validated_at: string | null
}

interface ResultValue {
  value: string
  is_abnormal: boolean
  note: string
}

interface AnalysisInputProps {
  analysis: Analysis
  result?: Result
  resultValue: ResultValue
  isCalculated: boolean
  isSaving: boolean
  onValueChange: (field: "value" | "is_abnormal" | "note", value: any) => void
  onSave: () => void
  onFocus: () => void
  onShowHistory: () => void
  onEnterSave?: () => void
  nextInputRef?: () => HTMLInputElement | null
}

export function AnalysisInput({
  analysis,
  result,
  resultValue,
  isCalculated,
  isSaving,
  onValueChange,
  onSave,
  onFocus,
  onShowHistory,
  onEnterSave,
  nextInputRef,
}: AnalysisInputProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
      {/* Analysis Info */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              {analysis.name}
              {isCalculated && <Calculator className="h-4 w-4 text-purple-600" aria-label="Calculado por fórmula" />}
            </p>
            <p className="text-xs text-gray-500">Unidad: {analysis.measure_unit}</p>
          </div>
        </div>
      </div>

      {/* Value Input or Existing Result */}
      <div>
        <label className="text-xs text-gray-600 block mb-1">Resultado ({analysis.measure_unit})</label>
        {result ? (
          <div className="flex gap-1">
            <Input
              value={resultValue.value}
              onChange={(e) => onValueChange("value", e.target.value)}
              onFocus={onFocus}
              onKeyDown={(e) => {
                if (e.key === "Enter" && resultValue.value?.trim()) {
                  e.preventDefault()
                  if (onEnterSave) {
                    onEnterSave()
                  } else {
                    onSave()
                  }
                  // Focus next input after saving
                  setTimeout(() => {
                    const nextInput = nextInputRef?.()
                    if (nextInput) {
                      nextInput.focus()
                    }
                  }, 100)
                }
              }}
              className="text-center bg-white border-green-300"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={onShowHistory}
              className="px-2 shrink-0 bg-transparent"
              title="Ver historial"
            >
              <History className="h-3 w-3" />
            </Button>
          </div>
        ) : isCalculated ? (
          <div className="p-2 bg-purple-100 rounded text-center font-medium text-purple-800">
            <Calculator className="h-4 w-4 mx-auto mb-1" />
            <span className="text-xs">Calculado</span>
          </div>
        ) : (
          <div className="flex gap-1">
            <Input
              placeholder="Valor"
              value={resultValue.value}
              onChange={(e) => onValueChange("value", e.target.value)}
              onFocus={onFocus}
              onKeyDown={(e) => {
                if (e.key === "Enter" && resultValue.value?.trim()) {
                  e.preventDefault()
                  if (onEnterSave) {
                    onEnterSave()
                  } else {
                    onSave()
                  }
                  // Focus next input after saving
                  setTimeout(() => {
                    const nextInput = nextInputRef?.()
                    if (nextInput) {
                      nextInput.focus()
                    }
                  }, 100)
                }
              }}
              className="text-center bg-white"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={onShowHistory}
              className="px-2 shrink-0 bg-transparent"
              title="Ver historial"
            >
              <History className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Normal/Abnormal Status */}
      <div>
        <label className="text-xs text-gray-600 block mb-1">Estado</label>
        {result ? (
          <Select
            value={resultValue.is_abnormal ? "abnormal" : "normal"}
            onValueChange={(value) => onValueChange("is_abnormal", value === "abnormal")}
            disabled={isCalculated}
          >
            <SelectTrigger className="bg-white border-green-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Normal
                </div>
              </SelectItem>
              <SelectItem value="abnormal">
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  Anormal
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select
            value={resultValue.is_abnormal ? "abnormal" : "normal"}
            onValueChange={(value) => onValueChange("is_abnormal", value === "abnormal")}
            disabled={isCalculated}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Normal
                </div>
              </SelectItem>
              <SelectItem value="abnormal">
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  Anormal
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-gray-600 block mb-1">Notas</label>
        {result ? (
          <Textarea
            value={resultValue.note}
            onChange={(e) => onValueChange("note", e.target.value)}
            className="min-h-[60px] bg-white text-xs border-green-300"
            disabled={isCalculated}
          />
        ) : (
          <Textarea
            placeholder="Notas..."
            value={resultValue.note}
            onChange={(e) => onValueChange("note", e.target.value)}
            className="min-h-[60px] bg-white text-xs"
            disabled={isCalculated}
          />
        )}
      </div>

      {/* Action Buttons or Status */}
      <div className="flex flex-col gap-2">
        {result?.validated_at ? (
          <Badge variant="default" className="bg-green-600 text-white text-xs justify-center">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Validado
          </Badge>
        ) : !isCalculated ? (
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving || !resultValue.value?.trim()}
            className="bg-[#204983] hover:bg-[#204983]/90 text-xs"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            <span className="ml-1">{result ? "Actualizar" : "Guardar"}</span>
          </Button>
        ) : (
          <Badge variant="outline" className="text-xs bg-purple-50 border-purple-300 text-purple-700 justify-center">
            <Calculator className="h-3 w-3 mr-1" />
            Auto
          </Badge>
        )}

        {result && !result.validated_at && (
          <Badge variant="outline" className="text-xs bg-orange-50 border-orange-300 text-orange-700 justify-center">
            <Clock className="h-3 w-3 mr-1" />
            Sin Validar
          </Badge>
        )}
      </div>
    </div>
  )
}
