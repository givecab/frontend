"use client"

import type { Permission } from "@/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface PermissionManagementProps {
  permissions: Permission[]
}

export function PermissionManagement({ permissions }: PermissionManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Validar datos
  const validPermissions = Array.isArray(permissions)
    ? permissions.filter((permission) => permission && permission.id)
    : []

  const filteredPermissions = validPermissions.filter(
    (permission) =>
      (permission.codename || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.id.toString().includes(searchTerm),
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Lista de Permisos</h2>

        <div className="w-64">
          <Input placeholder="Buscar permisos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPermissions.length > 0 ? (
              filteredPermissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>{permission.id}</TableCell>
                  <TableCell className="font-medium">{permission.codename || "Sin código"}</TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{permission.codename || "Sin código"}</code>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>{searchTerm ? "No se encontraron permisos" : "No hay permisos disponibles"}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
