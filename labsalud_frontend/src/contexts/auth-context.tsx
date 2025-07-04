"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { IdleWarningModal } from "@/components/idle-warning-modal"

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

// Hook de idle timeout integrado directamente
function useIdleTimeout(onIdle: () => void, idleTime: number = 5 * 60 * 1000, warningTime: number = 30 * 1000) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const resetTimer = useCallback(() => {
    if (!isActive) return
    setShowWarning(false)
  }, [isActive])

  const extendSession = useCallback(() => {
    setShowWarning(false)
    setIsActive(true)
  }, [])

  const handleActivity = useCallback(() => {
    if (showWarning) return // No resetear si el modal está visible
    resetTimer()
  }, [showWarning, resetTimer])

  useEffect(() => {
    if (!isActive) return

    let warningTimer: NodeJS.Timeout
    let logoutTimer: NodeJS.Timeout
    let countdownTimer: NodeJS.Timeout

    // Timer para mostrar advertencia
    warningTimer = setTimeout(() => {
      setShowWarning(true)
      let seconds = Math.floor(warningTime / 1000)
      setTimeLeft(seconds)

      // Countdown
      countdownTimer = setInterval(() => {
        seconds -= 1
        setTimeLeft(seconds)

        if (seconds <= 0) {
          clearInterval(countdownTimer)
          setShowWarning(false)
          setIsActive(false)
          onIdle()
        }
      }, 1000)
    }, idleTime - warningTime)

    // Timer principal de logout
    logoutTimer = setTimeout(() => {
      setIsActive(false)
      onIdle()
    }, idleTime)

    // Event listeners para actividad
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart", "click", "keydown"]
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      clearTimeout(warningTimer)
      clearTimeout(logoutTimer)
      clearInterval(countdownTimer)
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [isActive, idleTime, warningTime, onIdle, handleActivity])

  return { showWarning, timeLeft, extendSession }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { success, error } = useToast()

  const logout = useCallback(() => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    success(
      "Sesión cerrada",
      {description: "Has cerrado sesión exitosamente"}
    )
  }, [success])

  // Hook de idle timeout
  const { showWarning, timeLeft, extendSession } = useIdleTimeout(logout, 5 * 60 * 1000, 30 * 1000)

  const hasPermission = useCallback(
    (permission: number | string): boolean => {
      if (!user) return false

      const permissionStr = permission.toString()
      return user.permissions.some(
        (perm) =>
          perm.id.toString() === permissionStr || perm.codename === permissionStr || perm.name === permissionStr,
      )
    },
    [user],
  )

  const isInGroup = useCallback(
    (groupName: string): boolean => {
      if (!user) return false
      return user.roles.some((role) => role.name === groupName)
    },
    [user],
  )

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refreshTokenValue = localStorage.getItem("refresh_token")
    if (!refreshTokenValue) {
      return false
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_AUTH_REFRESH_ENDPOINT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshTokenValue }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("access_token", data.access)
        setToken(data.access)
        return true
      } else {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user")
        setToken(null)
        setUser(null)
        setIsAuthenticated(false)
        return false
      }
    } catch (error) {
      console.error("Error refreshing token:", error)
      return false
    }
  }, [])

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

        if (response.ok) {
          const data = await response.json()

          localStorage.setItem("access_token", data.access)
          localStorage.setItem("refresh_token", data.refresh)
          localStorage.setItem("user", JSON.stringify(data.user))
          setToken(data.access)
          setUser(data.user)
          setIsAuthenticated(true)
          success(
            "Inicio de sesión exitoso",
            {description: "Bienvenido de vuelta"}
          )
          return true
        } else {
          const errorData = await response.json().catch(() => ({ detail: "Error de autenticación" }))
          error(
            "Error de inicio de sesión",
            {description: errorData.detail || "Credenciales inválidas"}
          )
          return false
        }
      } catch (err) {
        console.error("Login error:", err)
        error(
          "Error de conexión",
          {description: "No se pudo conectar con el servidor"}
        )
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [success, error]
  )

  const refreshUser = useCallback(async () => {
    const tokenValue = localStorage.getItem("access_token")
    if (!tokenValue) {
      setIsInitialized(true)
      setIsLoading(false)
      return
    }

    setToken(tokenValue)

    try {
      const verifyUrl = `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_AUTH_VERIFY_ENDPOINT}`
      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: tokenValue }),
      })

      if (response.ok) {
        const savedUser = localStorage.getItem("user")
        if (savedUser) {
          setUser(JSON.parse(savedUser))
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          setToken(null)
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        const refreshSuccess = await refreshToken()
        if (!refreshSuccess) {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          localStorage.removeItem("user")
          setToken(null)
          setUser(null)
          setIsAuthenticated(false)
        }
      }
    } catch (error) {
      console.error("Error verifying token:", error)
      const refreshSuccess = await refreshToken()
      if (!refreshSuccess) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user")
        setUser(null)
        setIsAuthenticated(false)
      }
    } finally {
      setIsInitialized(true)
      setIsLoading(false)
    }
  }, [refreshToken])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const value: AuthContextType = {
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
    refreshToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isAuthenticated && (
        <IdleWarningModal isOpen={showWarning} timeLeft={timeLeft} onExtend={extendSession} onLogout={logout} />
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
