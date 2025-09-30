"use client"

import type React from "react"

import { useState } from "react"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { ANALYSIS_ENDPOINTS } from "@/config/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import * as XLSX from "xlsx"

interface ImportDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ImportResult {
  panels?: { success: boolean; count?: number; error?: string }
  analyses?: { success: boolean; count?: number; error?: string }
}

export function ImportDataDialog({ open, onOpenChange, onSuccess }: ImportDataDialogProps) {
  const { apiRequest } = useApi()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validar que sea un archivo Excel
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xls|xlsx)$/i)) {
        setError("Por favor selecciona un archivo Excel válido (.xls o .xlsx)")
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
      setImportResult(null)
    }
  }

  const parseExcelFile = (file: File): Promise<{ panels: any[]; analyses: any[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: "binary" })

          // Buscar las hojas de paneles y análisis
          const panelsSheet = workbook.Sheets["Paneles"] || workbook.Sheets["paneles"] || workbook.Sheets["PANELES"]
          const analysesSheet =
            workbook.Sheets["Análisis"] ||
            workbook.Sheets["Analisis"] ||
            workbook.Sheets["análisis"] ||
            workbook.Sheets["analisis"] ||
            workbook.Sheets["ANÁLISIS"] ||
            workbook.Sheets["ANALISIS"]

          if (!panelsSheet && !analysesSheet) {
            reject(
              new Error(
                'El archivo debe contener al menos una hoja llamada "Paneles" o "Análisis" (o variantes sin acentos/mayúsculas)',
              ),
            )
            return
          }

          const panels = panelsSheet ? XLSX.utils.sheet_to_json(panelsSheet) : []
          const analyses = analysesSheet ? XLSX.utils.sheet_to_json(analysesSheet) : []

          resolve({ panels, analyses })
        } catch (err) {
          reject(new Error("Error al leer el archivo Excel: " + (err as Error).message))
        }
      }

      reader.onerror = () => {
        reject(new Error("Error al leer el archivo"))
      }

      reader.readAsBinaryString(file)
    })
  }

  const handleImport = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo")
      return
    }

    setIsLoading(true)
    setError(null)
    setImportResult(null)

    try {
      // Parsear el archivo Excel
      const { panels, analyses } = await parseExcelFile(file)

      const result: ImportResult = {}

      // Importar paneles si existen
      if (panels.length > 0) {
        try {
          const panelsResponse = await apiRequest(ANALYSIS_ENDPOINTS.IMPORT_PANELS, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(panels),
          })

          if (panelsResponse.ok) {
            const data = await panelsResponse.json()
            result.panels = { success: true, count: data.imported_count || panels.length }
          } else {
            const errorData = await panelsResponse.json()
            result.panels = {
              success: false,
              error: errorData.detail || errorData.error || "Error al importar paneles",
            }
          }
        } catch (err) {
          result.panels = { success: false, error: "Error de conexión al importar paneles" }
        }
      }

      // Importar análisis si existen
      if (analyses.length > 0) {
        try {
          const analysesResponse = await apiRequest(ANALYSIS_ENDPOINTS.IMPORT_ANALYSES, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(analyses),
          })

          if (analysesResponse.ok) {
            const data = await analysesResponse.json()
            result.analyses = { success: true, count: data.imported_count || analyses.length }
          } else {
            const errorData = await analysesResponse.json()
            result.analyses = {
              success: false,
              error: errorData.detail || errorData.error || "Error al importar análisis",
            }
          }
        } catch (err) {
          result.analyses = { success: false, error: "Error de conexión al importar análisis" }
        }
      }

      setImportResult(result)

      // Mostrar toast según el resultado
      const hasSuccess = result.panels?.success || result.analyses?.success
      const hasError = result.panels?.success === false || result.analyses?.success === false

      if (hasSuccess && !hasError) {
        toast({
          title: "Importación exitosa",
          description: "Los datos se importaron correctamente",
        })
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else if (hasSuccess && hasError) {
        toast({
          title: "Importación parcial",
          description: "Algunos datos se importaron correctamente, pero hubo errores",
          variant: "default",
        })
      } else {
        toast({
          title: "Error en la importación",
          description: "No se pudieron importar los datos",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError((err as Error).message)
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFile(null)
      setError(null)
      setImportResult(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Paneles y Análisis
          </DialogTitle>
          <DialogDescription>
            Selecciona un archivo Excel (.xls o .xlsx) que contenga las hojas "Paneles" y/o "Análisis" con los datos a
            importar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Archivo Excel</Label>
            <Input
              id="file"
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            {file && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {importResult && (
            <div className="space-y-2">
              {importResult.panels && (
                <Alert variant={importResult.panels.success ? "default" : "destructive"}>
                  {importResult.panels.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {importResult.panels.success
                      ? `✓ Paneles importados: ${importResult.panels.count}`
                      : `✗ Error en paneles: ${importResult.panels.error}`}
                  </AlertDescription>
                </Alert>
              )}

              {importResult.analyses && (
                <Alert variant={importResult.analyses.success ? "default" : "destructive"}>
                  {importResult.analyses.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {importResult.analyses.success
                      ? `✓ Análisis importados: ${importResult.analyses.count}`
                      : `✗ Error en análisis: ${importResult.analyses.error}`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Formato esperado:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Hoja "Paneles": columnas según el modelo de Panel</li>
                <li>Hoja "Análisis": columnas según el modelo de Análisis</li>
                <li>Ambas hojas son opcionales, pero debe existir al menos una</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!file || isLoading} className="bg-[#204983] hover:bg-[#1a3d6f]">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
