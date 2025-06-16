"use client"

import { useAuth } from "@/contexts/auth-context"
import { useCallback } from "react"
import { env } from "@/config/env"

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  body?: any
  headers?: Record<string, string>
  timeout?: number
}

export const useApi = () => {
  const { token, refreshToken, logout } = useAuth()

  const apiRequest = useCallback(
    async (url: string, options: ApiRequestOptions = {}) => {
      const { method = "GET", body, headers = {}, timeout = env.API_TIMEOUT } = options

      // Preparar headers
      const requestHeaders: Record<string, string> = {
        ...headers,
      }

      // Solo agregar Content-Type si no es FormData
      if (!(body instanceof FormData)) {
        requestHeaders["Content-Type"] = "application/json"
      }

      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`
      }

      // Crear AbortController para timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        if (env.DEBUG_MODE) {
          console.log(`API Request: ${method} ${env.API_BASE_URL}${url}`)
          if (body instanceof FormData) {
            console.log("Sending FormData with files")
          }
        }

        // Preparar el body según el tipo
        let requestBody: string | FormData | undefined
        if (body instanceof FormData) {
          requestBody = body
        } else if (body) {
          requestBody = JSON.stringify(body)
        } else {
          requestBody = undefined
        }

        let response = await fetch(`${env.API_BASE_URL}${url}`, {
          method,
          headers: requestHeaders,
          body: requestBody,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Si el token expiró (401), intentar refrescar
        if (response.status === 401 && token) {
          if (env.DEBUG_MODE) {
            console.log("Token expired, attempting refresh...")
          }

          const refreshSuccess = await refreshToken()

          if (refreshSuccess) {
            // Reintentar la request con el nuevo token
            const newToken = localStorage.getItem("access_token")
            if (newToken) {
              requestHeaders.Authorization = `Bearer ${newToken}`
              response = await fetch(`${env.API_BASE_URL}${url}`, {
                method,
                headers: requestHeaders,
                body: requestBody,
              })
            }
          } else {
            // Si no se pudo refrescar, hacer logout
            logout()
            throw new Error("Session expired")
          }
        }

        if (env.DEBUG_MODE) {
          console.log(`API Response: ${response.status} ${response.statusText}`)
        }

        return response
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === "AbortError") {
          console.error(`API request timeout after ${timeout}ms:`, url)
          throw new Error(`Request timeout after ${timeout}ms`)
        }

        console.error("API request error:", error)
        throw error
      }
    },
    [token, refreshToken, logout],
  )

  return { apiRequest }
}
