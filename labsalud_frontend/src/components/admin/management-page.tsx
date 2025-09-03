"use client"

import { useState, useEffect } from "react"
import useAuth from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "./user-management"
import { RoleManagement } from "./role-management"
import { PermissionManagement } from "./permission-management"
import { Loader2, AlertCircle } from "lucide-react"
import type { User, Role, Permission } from "@/types"

export default function ManagementPage() {
  const { hasPermission } = useAuth()
  const { apiRequest } = useApi()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar si el usuario tiene solo permiso de vista y ningún otro de gestión
  const hasOnlyViewPermission =
    hasPermission("24") &&
    !["21", "22", "23", "9", "10", "11", "34", "35", "36"].some((permId) =>
      hasPermission(permId),
    )

  const canAccessManagement =
    !hasOnlyViewPermission &&
    (hasPermission("24") || // view_customuser
      hasPermission("21") || // add_customuser
      hasPermission("22") || // change_customuser
      hasPermission("23") || // delete_customuser
      hasPermission("9")  || // add_group
      hasPermission("10") || // change_group
      hasPermission("11") || // delete_group
      hasPermission("12") || // view_group
      hasPermission("34") || // assign_role
      hasPermission("35") || // remove_role
      hasPermission("36"))   // assign_temp_permission

  const refreshData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Cargando datos de gestión...")

      // Cargar usuarios - permisos: 21, 22, 23, 24
      if (
        hasPermission("24") ||
        hasPermission("21") ||
        hasPermission("22") ||
        hasPermission("23")
      ) {
        const usersResponse = await apiRequest("api/users/users/active/?is_staff=false")
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          if (usersData && Array.isArray(usersData.results)) {
            setUsers(usersData.results)
            console.log(`Usuarios cargados: ${usersData.results.length}`)
          }
        } else {
          console.error("Error al cargar usuarios:", usersResponse.status)
        }
      }

      // Cargar roles - permisos: 9, 10, 11, 12 (paginado)
      if (
        hasPermission("12") ||
        hasPermission("9") ||
        hasPermission("10") ||
        hasPermission("11")
      ) {
        const rolesResponse = await apiRequest("api/users/roles/?limit=20&offset=0&search=")
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json()
          if (rolesData && Array.isArray(rolesData.results)) {
            setRoles(rolesData.results)
            console.log(`Roles cargados: ${rolesData.results.length} / ${rolesData.count}`)
            // rolesData.next → para scroll infinito si se implementa después
          }
        } else {
          console.error("Error al cargar roles:", rolesResponse.status)
        }
      }

      // Cargar permisos - permiso: 8 (paginado)
      if (hasPermission("8")) {
        const permissionsResponse = await apiRequest(
          "api/users/permissions/?limit=20&offset=0&search="
        )
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json()
          if (permissionsData && Array.isArray(permissionsData.results)) {
            setPermissions(permissionsData.results)
            console.log(`Permisos cargados: ${permissionsData.results.length}`)
          }
        } else {
          console.error("Error al cargar permisos:", permissionsResponse.status)
        }
      }
    } catch (err) {
      console.error("Error al cargar datos:", err)
      setError("Error al cargar los datos. Por favor, intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (canAccessManagement) {
      refreshData()
    }
  }, [canAccessManagement])

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6 flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-[#204983] animate-spin mb-2" />
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Usuarios y Permisos</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        </div>
      </div>
    )
  }

  if (!canAccessManagement) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Usuarios y Permisos</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>No tienes permisos para acceder a esta sección.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Usuarios y Permisos</h1>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6">
            {(hasPermission("24") || hasPermission("21") || hasPermission("22") || hasPermission("23")) && (
              <TabsTrigger value="users">Usuarios</TabsTrigger>
            )}
            {(hasPermission("12") || hasPermission("9") || hasPermission("10") || hasPermission("11")) && (
              <TabsTrigger value="roles">Roles</TabsTrigger>
            )}
            {hasPermission("8") && <TabsTrigger value="permissions">Permisos</TabsTrigger>}
          </TabsList>

          {(hasPermission("24") || hasPermission("21") || hasPermission("22") || hasPermission("23")) && (
            <TabsContent value="users">
              <UserManagement
                users={users}
                roles={roles}
                permissions={permissions}
                setUsers={setUsers}
                refreshData={refreshData}
              />
            </TabsContent>
          )}

          {(hasPermission("12") || hasPermission("9") || hasPermission("10") || hasPermission("11")) && (
            <TabsContent value="roles">
              <RoleManagement
                roles={roles}
                setRoles={setRoles}
                refreshData={refreshData}
              />
            </TabsContent>
          )}

          {hasPermission("8") && (
            <TabsContent value="permissions">
              <PermissionManagement permission={permissions} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}