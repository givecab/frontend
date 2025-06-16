"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useIdleTimeout } from "@/hooks/use-idle-timeout"
import { IdleWarningModal } from "@/components/idle-warning-modal"
import { env } from "@/config/env"

interface PermissionObject {
  id: number
  nombre: string
  es_temporal: boolean
  fecha_expiracion: string | null
}

interface TempPermission {
  permission: string
  name: string
  expires_at: string
}

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  photo?: string
  is_active: boolean
  date_joined: string
  group?: {
    id: number
    name: string
  }
  temp_permissions?: TempPermission[]
  permissions?: PermissionObject[] // Array de objetos de permisos
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  hasPermission: (permission: string | number) => boolean
  isInGroup: (groupName: string) => boolean
  refreshToken: () => Promise<boolean>
  debugPermissions: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }, [])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem("refresh_token")
      if (!refreshTokenValue) return false

      const response = await fetch(`${env.API_BASE_URL}${env.AUTH_REFRESH_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshTokenValue }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("access_token", data.access)
        setToken(data.access)
        return true
      }
      return false
    } catch (error) {
      console.error("Error en refreshToken:", error)
      return false
    }
  }, [])

  const hasPermission = useCallback(
    (permission: string | number): boolean => {
      if (!user) return false

      // Convertir el permiso a número si es string
      const permissionId = typeof permission === "string" ? Number(permission) : permission

      // Log para depuración si está habilitado
      if (env.DEBUG_MODE) {
        console.log(`Verificando permiso ${permissionId} para usuario ${user.username}`)
        console.log("Permisos del usuario:", user.permissions)
      }

      // Verificar si el permiso está en el array de objetos de permisos
      if (user.permissions && Array.isArray(user.permissions)) {
        // Buscar un objeto de permiso cuyo ID coincida con el permiso solicitado
        const foundPermission = user.permissions.find((perm) => perm.id === permissionId)

        if (foundPermission) {
          // Si el permiso no es temporal, o si es temporal pero no ha expirado
          if (
            !foundPermission.es_temporal ||
            (foundPermission.es_temporal &&
              foundPermission.fecha_expiracion &&
              new Date(foundPermission.fecha_expiracion) > new Date())
          ) {
            if (env.DEBUG_MODE) {
              console.log(`Permiso ${permissionId} concedido`)
            }
            return true
          }
        }
      }

      // Mantener la verificación de permisos temporales como respaldo
      if (user.temp_permissions) {
        const now = new Date()
        const hasTemp = user.temp_permissions.some((tempPerm) => {
          const expiresAt = new Date(tempPerm.expires_at)
          const tempPermId = typeof tempPerm.permission === "string" ? Number(tempPerm.permission) : tempPerm.permission
          return tempPermId === permissionId && expiresAt > now
        })

        if (hasTemp && env.DEBUG_MODE) {
          console.log(`Permiso temporal ${permissionId} concedido`)
        }

        return hasTemp
      }

      if (env.DEBUG_MODE) {
        console.log(`Permiso ${permissionId} denegado`)
      }
      return false
    },
    [user],
  )

  const isInGroup = useCallback(
    (groupName: string): boolean => {
      if (!user || !user.group) return false
      return user.group.name === groupName
    },
    [user],
  )

  const debugPermissions = useCallback(() => {
    if (env.DEBUG_MODE && user) {
      console.log("=== DEBUG PERMISOS ===")
      console.log("Usuario:", user.username)
      console.log("Grupo:", user.group?.name || "Sin grupo")
      console.log("Permisos:", user.permissions)
      console.log("Permisos temporales:", user.temp_permissions)
      console.log("=====================")
    }
  }, [user])

  // Configurar el sistema de inactividad solo si el usuario está logueado
  const { showWarning, timeLeft, extendSession } = useIdleTimeout({
    onIdle: logout,
    idleTime: env.SESSION_IDLE_TIME,
    warningTime: env.SESSION_WARNING_TIME,
  })

  // Verificación inicial de sesión guardada
  useEffect(() => {
    const initializeAuth = () => {
      const savedToken = localStorage.getItem("access_token")
      const savedUser = localStorage.getItem("user")

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setToken(savedToken)
          setUser(parsedUser)

          if (env.DEBUG_MODE) {
            console.log("Sesión restaurada para usuario:", parsedUser.username)
          }
        } catch (e) {
          console.error("Error al parsear usuario guardado:", e)
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          localStorage.removeItem("user")
        }
      }

      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      if (env.DEBUG_MODE) {
        console.log(`Intentando login para usuario: ${username}`)
      }

      const response = await fetch(`${env.API_BASE_URL}${env.AUTH_LOGIN_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("access_token", data.access)
        localStorage.setItem("refresh_token", data.refresh)
        localStorage.setItem("user", JSON.stringify(data.user))
        setToken(data.access)
        setUser(data.user)

        if (env.DEBUG_MODE) {
          console.log("Login exitoso para usuario:", data.user.username)
          console.log("Permisos cargados:", data.user.permissions)
        }

        return true
      } else {
        if (env.DEBUG_MODE) {
          console.log("Login fallido:", response.status)
        }
        return false
      }
    } catch (error) {
      console.error("Error de red en login:", error)
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        hasPermission,
        isInGroup,
        refreshToken,
        debugPermissions,
      }}
    >
      {children}

      {/* Modal de advertencia de inactividad - solo se muestra si hay usuario logueado */}
      {user && <IdleWarningModal isOpen={showWarning} timeLeft={timeLeft} onExtend={extendSession} onLogout={logout} />}
    </AuthContext.Provider>
  )
}
