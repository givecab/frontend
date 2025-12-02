"use client"

import type React from "react"
import { useState } from "react"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"
import { CATALOG_ENDPOINTS } from "@/config/api"
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
import { Loader2, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Info } from "lucide-react"

interface ImportDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ImportDataDialog({ open, onOpenChange, onSuccess }: ImportDataDialogProps) {
  const { apiRequest } = useApi()

  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
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
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await apiRequest(CATALOG_ENDPOINTS.IMPORT_XLSX, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header, let browser set it with boundary for multipart/form-data
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || "Los datos se importaron correctamente")
        onOpenChange(false)
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.detail || errorData.error || "Error al importar el catálogo"
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (err) {
      const errorMessage = (err as Error).message || "Error de conexión al importar el catálogo"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFile(null)
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Catálogo de Paneles y Análisis
          </DialogTitle>
          <DialogDescription>
            Selecciona un archivo Excel (.xls o .xlsx) con el formato correcto para importar paneles y análisis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong className="block mb-2">Formato requerido del archivo Excel:</strong>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold">Tabla 1: "paneles"</p>
                  <p className="text-xs mt-1">Debe contener las siguientes columnas:</p>
                  <ul className="list-disc list-inside text-xs mt-1 ml-2 space-y-0.5">
                    <li>
                      <code className="bg-blue-100 px-1 rounded">id</code> - Identificador único del panel
                    </li>
                    <li>
                      <code className="bg-blue-100 px-1 rounded">codigo</code> - Código del panel
                    </li>
                    <li>
                      <code className="bg-blue-100 px-1 rounded">nombre</code> - Nombre del panel
                    </li>
                    <li>
                      <code className="bg-blue-100 px-1 rounded">urgencia</code> - Indica si es urgente (true/false)
                    </li>
                    <li>
                      <code className="bg-blue-100 px-1 rounded">ub</code> - Unidad bioquímica
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">Tabla 2: "analisis"</p>
                  <p className="text-xs mt-1">Debe contener las siguientes columnas:</p>
                  <ul className="list-disc list-inside text-xs mt-1 ml-2 space-y-0.5">
                    <li>
                      <code className="bg-blue-100 px-1 rounded">nombre</code> - Nombre del análisis
                    </li>
                    <li>
                      <code className="bg-blue-100 px-1 rounded">unidad_medida</code> - Unidad de medida
                    </li>
                    <li>
                      <code className="bg-blue-100 px-1 rounded">panelid</code> - ID del panel al que pertenece
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>

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
                <CheckCircle2 className="h-4 w-4 text-green-600" />
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
