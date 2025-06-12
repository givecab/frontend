"use client"

import { useAuth } from "@/contexts/auth-context"
import { useCallback } from "react"

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  body?: any
  headers?: Record<string, string>
}

export const useApi = () => {
  const { token, refreshToken, logout } = useAuth()

  const apiRequest = useCallback(
    async (url: string, options: ApiRequestOptions = {}) => {
      const { method = "GET", body, headers = {} } = options

      // Preparar headers
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...headers,
      }

      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`
      }

      try {
        let response = await fetch(`http://192.168.1.8:8000${url}`, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
        })

        // Si el token expiró (401), intentar refrescar
        if (response.status === 401 && token) {
          console.log("Token expired, attempting refresh...")
          const refreshSuccess = await refreshToken()

          if (refreshSuccess) {
            // Reintentar la request con el nuevo token
            const newToken = localStorage.getItem("access_token")
            if (newToken) {
              requestHeaders.Authorization = `Bearer ${newToken}`
              response = await fetch(`http://192.168.1.8:8000${url}`, {
                method,
                headers: requestHeaders,
                body: body ? JSON.stringify(body) : undefined,
              })
            }
          } else {
            // Si no se pudo refrescar, hacer logout
            logout()
            throw new Error("Session expired")
          }
        }

        return response
      } catch (error) {
        console.error("API request error:", error)
        throw error
      }
    },
    [token, refreshToken, logout],
  )

  return { apiRequest }
}
