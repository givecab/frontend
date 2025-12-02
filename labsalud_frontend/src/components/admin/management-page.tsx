"use client"

import { useState, useEffect } from "react"
import useAuth from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import { USER_ENDPOINTS, AC_ENDPOINTS } from "@/config/api"
import { PERMISSIONS } from "@/config/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "./user-management"
import { RoleManagement } from "./role-management"
import { PermissionManagement } from "./permission-management"
import { Loader2, AlertCircle } from "lucide-react"
import type { User, Role, Permission } from "@/types"

export default function ManagementPage() {
  const { hasPermission, user: currentUser } = useAuth()
  const { apiRequest } = useApi()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS.id)
  const canManageRoles = hasPermission(PERMISSIONS.MANAGE_ROLES.id)
  const canManageTempPermissions = hasPermission(PERMISSIONS.MANAGE_TEMP_PERMISSIONS.id)

  const canAccessManagement = canManageUsers || canManageRoles || canManageTempPermissions

  const refreshData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Cargando datos de gestión...")

      if (canManageUsers) {
        let usersUrl = USER_ENDPOINTS.USERS
        if (!currentUser?.is_superuser) {
          // Usuarios normales solo ven usuarios activos y no superusuarios
          usersUrl = `${USER_ENDPOINTS.USERS}?is_superuser=false&is_active=True`
          console.log("[v0] Usuario normal: cargando solo usuarios activos y no superusuarios")
        } else {
          console.log("[v0] Usuario superusuario: cargando todos los usuarios")
        }

        const usersResponse = await apiRequest(usersUrl)
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          if (usersData && Array.isArray(usersData.results)) {
            setUsers(usersData.results)
            console.log("[v0] Usuarios cargados:", usersData.results.length)
          }
        } else {
          console.error("[v0] Error al cargar usuarios:", usersResponse.status)
        }
      }

      if (canManageRoles) {
        const rolesResponse = await apiRequest(`${AC_ENDPOINTS.ROLES}?limit=100`)
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json()
          if (rolesData && Array.isArray(rolesData.results)) {
            setRoles(rolesData.results)
            console.log("[v0] Roles cargados:", rolesData.results.length)
          }
        } else {
          console.error("[v0] Error al cargar roles:", rolesResponse.status)
        }
      }

      if (canManageRoles) {
        const permissionsResponse = await apiRequest(`${AC_ENDPOINTS.PERMISSIONS}?limit=100`)
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json()
          if (permissionsData && Array.isArray(permissionsData.results)) {
            setPermissions(permissionsData.results)
            console.log("[v0] Permisos cargados:", permissionsData.results.length)
          }
        } else {
          console.error("[v0] Error al cargar permisos:", permissionsResponse.status)
        }
      }
    } catch (err) {
      console.error("[v0] Error al cargar datos:", err)
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
            {canManageUsers && <TabsTrigger value="users">Usuarios</TabsTrigger>}
            {canManageRoles && <TabsTrigger value="roles">Roles</TabsTrigger>}
            {canManageRoles && <TabsTrigger value="permissions">Permisos</TabsTrigger>}
          </TabsList>

          {canManageUsers && (
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

          {canManageRoles && (
            <TabsContent value="roles">
              <RoleManagement roles={roles} setRoles={setRoles} refreshData={refreshData} />
            </TabsContent>
          )}

          {canManageRoles && (
            <TabsContent value="permissions">
              <PermissionManagement permission={permissions} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
