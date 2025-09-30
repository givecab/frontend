"use client"

import type React from "react"

import { Input } from "../../ui/input"
import { Textarea } from "../../ui/textarea"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { CheckCircle2, XCircle, Save, Loader2, Clock, History, User, ShieldCheck } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { HistoryPanel } from "./history-panel"

interface UserInfo {
  username: string
  photo: string
}

interface PreviousResult {
  protocol_id: number
  value: string
  created_at: string
  created_by: UserInfo
}

interface ResultValue {
  value: string
  is_abnormal: boolean
  note: string
}

interface AnalysisInputProps {
  protocolAnalysisId: number
  analysisName: string
  measureUnit: string
  hasExistingResult: boolean
  isValidated: boolean
  validatedBy?: UserInfo | null
  validatedAt?: string | null
  createdBy?: UserInfo
  createdAt?: string
  previousResults: PreviousResult[]
  resultValue: ResultValue
  isSaving: boolean
  onValueChange: (field: "value" | "is_abnormal" | "note", value: any) => void
  onSave: () => void
  onFocus: () => void
  onShowHistory: () => void
  nextInputKey?: string | null
}

const inputRefs = new Map<string, HTMLInputElement>()

export function AnalysisInput({
  protocolAnalysisId,
  analysisName,
  measureUnit,
  hasExistingResult,
  isValidated,
  validatedBy,
  validatedAt,
  createdBy,
  createdAt,
  previousResults,
  resultValue,
  isSaving,
  onValueChange,
  onSave,
  onFocus,
  onShowHistory,
  nextInputKey,
}: AnalysisInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (inputRef.current) {
      const key = `input-${protocolAnalysisId}`
      inputRefs.set(key, inputRef.current)
      return () => {
        inputRefs.delete(key)
      }
    }
  }, [protocolAnalysisId])

  useEffect(() => {
    if (isFocused && previousResults.length > 0 && !hasExistingResult) {
      setShowHistoryPanel(true)
    }
  }, [isFocused, previousResults.length, hasExistingResult])

  useEffect(() => {
    if (!isFocused) {
      const timer = setTimeout(() => {
        setShowHistoryPanel(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isFocused])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && resultValue.value?.trim()) {
      e.preventDefault()
      onSave()
      setTimeout(() => {
        if (nextInputKey) {
          const nextInput = inputRefs.get(`input-${nextInputKey.split("-")[1]}`)
          if (nextInput) {
            nextInput.focus()
          }
        }
      }, 100)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-start p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        {/* Analysis Info */}
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-gray-900">{analysisName}</p>

            {hasExistingResult && createdBy && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <User className="h-3 w-3" />
                  <span>Creado por: {createdBy.username}</span>
                </div>
                {createdAt && (
                  <p className="text-xs text-gray-500 ml-4">{new Date(createdAt).toLocaleString("es-AR")}</p>
                )}

                {isValidated && validatedBy && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Validado por: {validatedBy.username}</span>
                    </div>
                    {validatedAt && (
                      <p className="text-xs text-green-600 ml-4 mt-0.5">
                        {new Date(validatedAt).toLocaleString("es-AR")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {previousResults.length > 0 && (
              <Badge
                variant="outline"
                className="mt-2 bg-blue-50 border-blue-200 text-blue-700 text-xs w-fit cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => setShowHistoryPanel(true)}
              >
                <History className="h-3 w-3 mr-1" />
                {previousResults.length} resultado(s) anterior(es)
              </Badge>
            )}
          </div>
        </div>

        {/* Value Input */}
        <div className="relative">
          <label className="text-xs font-medium text-gray-700 block mb-1">Resultado ({measureUnit})</label>
          <Input
            ref={inputRef}
            placeholder="Valor"
            value={resultValue.value}
            onChange={(e) => onValueChange("value", e.target.value)}
            onFocus={() => {
              setIsFocused(true)
              onFocus()
            }}
            onBlur={() => {
              setTimeout(() => setIsFocused(false), 200)
            }}
            onKeyDown={handleKeyDown}
            className={`text-center ${hasExistingResult ? "bg-green-50 border-green-300" : "bg-white"} ${isValidated ? "bg-green-100" : ""}`}
            disabled={isValidated}
          />
        </div>

        {/* Normal/Abnormal Status */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Estado</label>
          <Select
            value={resultValue.is_abnormal ? "abnormal" : "normal"}
            onValueChange={(value) => onValueChange("is_abnormal", value === "abnormal")}
            disabled={isValidated}
          >
            <SelectTrigger
              className={`${hasExistingResult ? "bg-green-50 border-green-300" : "bg-white"} ${isValidated ? "bg-green-100" : ""}`}
            >
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
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Notas</label>
          <Textarea
            placeholder="Notas..."
            value={resultValue.note}
            onChange={(e) => onValueChange("note", e.target.value)}
            className={`min-h-[60px] text-xs ${hasExistingResult ? "bg-green-50 border-green-300" : "bg-white"} ${isValidated ? "bg-green-100" : ""}`}
            disabled={isValidated}
          />
        </div>

        {/* Action Buttons or Status */}
        <div className="flex flex-col gap-2">
          {isValidated ? (
            <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-white text-xs justify-center py-2">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Validado
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onSave}
              disabled={isSaving || !resultValue.value?.trim()}
              className="bg-[#204983] hover:bg-[#1a3a6b] text-xs text-white"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              <span className="ml-1">{hasExistingResult ? "Actualizar" : "Guardar"}</span>
            </Button>
          )}

          {hasExistingResult && !isValidated && (
            <Badge
              variant="outline"
              className="text-xs bg-amber-50 border-amber-300 text-amber-700 justify-center py-1.5"
            >
              <Clock className="h-3 w-3 mr-1" />
              Sin Validar
            </Badge>
          )}
        </div>
      </div>

      <HistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        previousResults={previousResults}
        measureUnit={measureUnit}
        analysisName={analysisName}
      />
    </>
  )
}
