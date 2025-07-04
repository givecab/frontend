"use client"

import useAuth from "@/contexts/auth-context"
import { useLoading } from "@/hooks/use-loading"
import { useCallback } from "react"

// JSDoc documentation for ApiRequestOptions and useApi hook
/**
 * Options for API requests, including HTTP method, request body, headers, and timeout.
 */
export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  // Request body payload
  body?: unknown
  headers?: Record<string, string>
  timeout?: number
  /** Optional key to trigger loading indicator via useLoading */
  loadingKey?: string
}

/**
 * Custom hook to perform API requests with automatic token handling, refresh,
 * error logging, and timeout support. Returns an apiRequest function.
 */
export const useApi = () => {
  const { token, refreshToken, logout } = useAuth()
  const { setLoading } = useLoading()

  const apiRequest = useCallback(
    async (url: string, options: ApiRequestOptions = {}) => {
      const { loadingKey, ...apiOptions } = options
      if (loadingKey) setLoading(loadingKey, true)
      const {
        method = "GET",
        body,
        headers = {},
        timeout = Number(import.meta.env.VITE_API_TIMEOUT) || 30000, // Default 30 seconds
      } = apiOptions

      const requestHeaders: Record<string, string> = {
        ...headers,
      }

      const isFormData = body instanceof FormData
      if (!isFormData && body) {
        requestHeaders["Content-Type"] = "application/json"
      }

      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      let finalUrl: string
      if (url.startsWith("http://") || url.startsWith("https://")) {
        finalUrl = url
      } else {
        // Asegurar que la base URL termine con / y el endpoint no empiece con /
        const baseUrl = import.meta.env.VITE_API_BASE_URL
        const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
        const cleanUrl = url.startsWith("/") ? url.slice(1) : url
        finalUrl = `${cleanBaseUrl}${cleanUrl}`
      }

      console.log(`[useApi] Making ${method} request to: ${finalUrl}`)

      try {
        let requestBody: string | FormData | undefined
        if (isFormData) {
          requestBody = body
        } else if (body) {
          requestBody = JSON.stringify(body)
        } else {
          requestBody = undefined
        }

        let response = await fetch(finalUrl, {
          method,
          headers: requestHeaders,
          body: requestBody,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log(`[useApi] Response status: ${response.status} for ${finalUrl}`)

        if (response.status === 401 && token) {
          console.warn("[useApi] 401 Unauthorized. Attempting token refresh...")
          const refreshSuccess = await refreshToken()
          if (refreshSuccess) {
            const newToken = sessionStorage.getItem("access_token")
            if (newToken) {
              requestHeaders.Authorization = `Bearer ${newToken}`
              console.log("[useApi] Token refreshed. Retrying request...")
              // Retry the original request with the new token
              response = await fetch(finalUrl, {
                method,
                headers: requestHeaders,
                body: requestBody,
                signal: controller.signal,
              })
            } else {
              console.error("[useApi] Refresh successful but no new token found in session storage.")
              logout()
              throw new Error("Sesión expirada: No se pudo obtener un nuevo token.")
            }
          } else {
            console.error("[useApi] Token refresh failed. Logging out.")
            logout()
            throw new Error("Sesión expirada: No se pudo refrescar el token.")
          }
        }
        return response
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === "AbortError") {
          console.error(`[useApi] Request timed out for ${finalUrl} after ${timeout}ms`)
          throw new Error(`Tiempo de espera agotado después de ${timeout}ms`)
        }
        console.error(`[useApi] Network or unexpected error for ${finalUrl}:`, error)
        throw error
      } finally {
        if (loadingKey) setLoading(loadingKey, false)
      }
    },
    [token, refreshToken, logout, setLoading],
  )

  return { apiRequest }
}
