"use client"

import useAuth from "@/contexts/auth-context"
import { Layout } from "./layout"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function DebugPermissions() {
  const { user, hasPermission, debugPermissions } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (user) {
      debugPermissions()
    }
  }, [user, debugPermissions, refreshKey])

  const permissionsList = [
    { id: 24, name: "Ver usuario" },
    { id: 21, name: "Crear usuario" },
    { id: 22, name: "Modificar usuario" },
    { id: 23, name: "Eliminar usuario" },
    { id: 9, name: "Crear grupo/rol" },
    { id: 34, name: "Asignar rol" },
    { id: 35, name: "Quitar rol" },
    { id: 36, name: "Gestionar permisos temporales" },
    { id: 37, name: "Crear paciente" },
    { id: 38, name: "Modificar paciente" },
    { id: 39, name: "Eliminar paciente" },
    { id: 40, name: "Ver paciente" },
  ]

  if (!user) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-6">
          <Card>
            <CardHeader>
              <CardTitle>Depuración de Permisos</CardTitle>
              <CardDescription>Debes iniciar sesión para ver esta página</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Depuración de Permisos</CardTitle>
              <CardDescription>Información detallada sobre los permisos del usuario actual</CardDescription>
            </div>
            <Button onClick={() => setRefreshKey((prev) => prev + 1)}>Actualizar</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Información del Usuario</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Usuario</p>
                    <p>{user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nombre</p>
                    <p>
                      {user.first_name} {user.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p>{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rol</p>
                    <p>{user.group ? user.group.name : "Sin rol"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Permisos del Usuario</h3>
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">Estructura de permisos:</p>
                  <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(user.permissions, null, 2)}
                  </pre>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Verificación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionsList.map((perm) => {
                      const hasPermissionValue = hasPermission(perm.id)
                      const isInArray = user.permissions?.some((p) => p.id === perm.id)

                      return (
                        <TableRow key={perm.id}>
                          <TableCell>{perm.id}</TableCell>
                          <TableCell>{perm.name}</TableCell>
                          <TableCell>
                            {isInArray ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Presente</Badge>
                            ) : (
                              <Badge variant="outline">No presente</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasPermissionValue ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Permitido</Badge>
                            ) : (
                              <Badge variant="outline">No permitido</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Permisos Temporales</h3>
                {user.permissions?.some((p) => p.es_temporal) ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Expira</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.permissions
                        .filter((p) => p.es_temporal)
                        .map((perm) => {
                          const isExpired = perm.fecha_expiracion && new Date(perm.fecha_expiracion) < new Date()

                          return (
                            <TableRow key={perm.id}>
                              <TableCell>{perm.id}</TableCell>
                              <TableCell>{perm.nombre}</TableCell>
                              <TableCell>
                                {perm.fecha_expiracion ? new Date(perm.fecha_expiracion).toLocaleString() : "N/A"}
                              </TableCell>
                              <TableCell>
                                {isExpired ? (
                                  <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                                    Expirado
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-500">No hay permisos temporales activos</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
