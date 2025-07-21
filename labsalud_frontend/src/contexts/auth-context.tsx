"use client"

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect,
  useCallback, 
  useRef,
  type ReactNode 
} from "react"
import { useToast } from "@/hooks/use-toast"
import { IdleWarningModal } from "@/components/idle-warning-modal"
import useIdleTimeout from "@/hooks/use-idle-timeout"

interface Permission {
  id: number
  codename: string
  name: string
  temporary: boolean
  expires_at: string | null
}

interface Role {
  id: number
  name: string
}

interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  photo?: string
  roles: Role[]
  permissions: Permission[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: number | string) => boolean
  isInGroup: (groupName: string) => boolean
  refreshUser: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { success, error } = useToast()
  const initializationRef = useRef(false)

  const [idleConfig] = useState({
    idleTime: 10 * 1000,
    warningTime: 5 * 1000
  })

  const logout = useCallback(() => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    success("Sesión cerrada", {
      description: "Has cerrado sesión exitosamente"
    })
  }, [success])

  const { showWarning, timeLeft, extendSession } = useIdleTimeout({
    onIdle: logout,
    idleTime: idleConfig.idleTime,
    warningTime: idleConfig.warningTime
  })

  const hasPermission = useCallback(
    (permission: number | string): boolean => {
      if (!user) return false
      const permissionStr = permission.toString()
      return user.permissions.some(
        (perm) =>
          perm.id.toString() === permissionStr || 
          perm.codename === permissionStr || 
          perm.name === permissionStr
      )
    },
    [user]
  )

  const isInGroup = useCallback(
    (groupName: string): boolean => {
      if (!user) return false
      return user.roles.some((role) => role.name === groupName)
    },
    [user]
  )

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refreshTokenValue = localStorage.getItem("refresh_token")
    if (!refreshTokenValue) return false

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_AUTH_REFRESH_ENDPOINT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshTokenValue }),
        }
      )

      if (!response.ok) throw new Error()

      const data = await response.json()
      localStorage.setItem("access_token", data.access)
      setToken(data.access)
      return true
    } catch {
      logout()
      return false
    }
  }, [logout])

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setIsLoading(true)
      try {
        const loginUrl = `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_AUTH_LOGIN_ENDPOINT}`
        const response = await fetch(loginUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        })

        if (!response.ok) {
          const errorData = await response.json()
            .catch(() => ({ detail: "Error de autenticación" }))
          
          error("Error de inicio de sesión", {
            description: errorData.detail || "Credenciales inválidas"
          })
          return false
        }

        const data = await response.json()
        localStorage.setItem("access_token", data.access)
        localStorage.setItem("refresh_token", data.refresh)
        localStorage.setItem("user", JSON.stringify(data.user))
        setToken(data.access)
        setUser(data.user)
        setIsAuthenticated(true)
        
        success("Inicio de sesión exitoso", {
          description: "Bienvenido de vuelta"
        })
        return true
      } catch {
        error("Error de conexión", {
          description: "No se pudo conectar con el servidor"
        })
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [success, error]
  )

  const refreshUser = useCallback(async () => {
    if (initializationRef.current) return
    
    const tokenValue = localStorage.getItem("access_token")
    const savedUser = localStorage.getItem("user")

    if (!tokenValue || !savedUser) {
      setIsInitialized(true)
      return
    }

    try {
      setToken(tokenValue)
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
      setIsAuthenticated(true)
    } catch {
      logout()
    } finally {
      initializationRef.current = true
      setIsInitialized(true)
    }
  }, [logout])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const value = {
    user,
    token,
    isAuthenticated,
    isInitialized,
    isLoading,
    login,
    logout,
    hasPermission,
    isInGroup,
    refreshUser,
    refreshToken
  }

  if (!isInitialized) {
    return null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isAuthenticated && showWarning && (
        <IdleWarningModal 
          isOpen={true}
          timeLeft={timeLeft} 
          onExtend={extendSession} 
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  )
}

export default function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}