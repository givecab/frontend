"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useApi } from "@/hooks/use-api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "./user-management"
import { RoleManagement } from "./role-management"
import { PermissionManagement } from "./permission-management"
import { Loader2, AlertCircle } from "lucide-react"
import { env } from "@/config/env"

// Interfaces para los datos - EXPORTADAS
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  groups?: {
    id: number
    name: string
  }[]
  temp_permissions?: TempPermission[]
}

export interface Role {
  id: number
  name: string
  permissions: number[]
}

export interface Permission {
  id: number
  codename: string
  name: string
}

export interface TempPermission {
  id: number
  permission: number
  name: string
  expires_at: string
}

export default function ManagementPage() {
  const { hasPermission } = useAuth()
  const { apiRequest } = useApi()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar si el usuario tiene al menos uno de los permisos de gestión
  const hasOnlyViewPermission =
    hasPermission("24") && ![30, 31, 32, 33, 34, 35, 36].some((permId) => hasPermission(permId.toString()))

  const canAccessManagement =
    !hasOnlyViewPermission &&
    (hasPermission(24) || // consultar usuario
      hasPermission(30) || // crear usuario
      hasPermission(31) || // modificar usuario
      hasPermission(32) || // eliminar usuario
      hasPermission(33) || // crear rol
      hasPermission(34) || // asignar rol
      hasPermission(35) || // quitar rol
      hasPermission(36)) // gestionar permisos temporales

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (env.DEBUG_MODE) {
          console.log("Cargando datos de gestión...")
        }

        // Cargar usuarios
        const usersResponse = await apiRequest(env.USERS_ENDPOINT)
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData)

          if (env.DEBUG_MODE) {
            console.log(`Usuarios cargados: ${usersData.length}`)
          }
        } else {
          console.error("Error al cargar usuarios:", usersResponse.status)
        }

        // Cargar roles
        const rolesResponse = await apiRequest(env.ROLES_ENDPOINT)
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json()
          setRoles(rolesData)

          if (env.DEBUG_MODE) {
            console.log(`Roles cargados: ${rolesData.length}`)
          }
        } else {
          console.error("Error al cargar roles:", rolesResponse.status)
        }

        // Cargar permisos
        const permissionsResponse = await apiRequest(env.PERMISSIONS_ENDPOINT)
        if (permissionsResponse.ok) {
          const permissionsData = await permissionsResponse.json()
          setPermissions(permissionsData)

          if (env.DEBUG_MODE) {
            console.log(`Permisos cargados: ${permissionsData.length}`)
          }
        } else {
          console.error("Error al cargar permisos:", permissionsResponse.status)
        }
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError("Error al cargar los datos. Por favor, intenta nuevamente.")
      } finally {
        setIsLoading(false)
      }
    }

    if (canAccessManagement) {
      fetchData()
    }
  }, [apiRequest, canAccessManagement])

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
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permisos</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement users={users} roles={roles} permissions={permissions} setUsers={setUsers} />
          </TabsContent>

          <TabsContent value="roles">
            <RoleManagement roles={roles} permissions={permissions} setRoles={setRoles} />
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionManagement permissions={permissions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
