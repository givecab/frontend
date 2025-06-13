"use client"

import type { Permission } from "./management-page"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface PermissionManagementProps {
  permissions: Permission[]
}

export function PermissionManagement({ permissions }: PermissionManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPermissions = permissions.filter(
    (permission) =>
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.codename.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPermissions.length > 0 ? (
              filteredPermissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>{permission.id}</TableCell>
                  <TableCell className="font-medium">{permission.name}</TableCell>
                  <TableCell>{permission.codename}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>No hay permisos disponibles</p>
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
