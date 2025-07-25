"use client"

import { useCallback } from "react"
import { useLoading } from "@/hooks/use-loading"

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
  /** Skip automatic token refresh on 401 (for refresh token requests) */
  skipTokenRefresh?: boolean
}

/**
 * Custom hook to perform API requests with automatic token handling, refresh,
 * error logging, and timeout support. Returns an apiRequest function.
 */
export const useApi = () => {
  const { setLoading } = useLoading()

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
        },
      )

      if (!response.ok) return false

      const data = await response.json()
      localStorage.setItem("access_token", data.access)
      return true
    } catch {
      return false
    }
  }, [])

  const showSessionExpiredModal = useCallback(() => {
    // Crear y mostrar modal de sesión expirada
    const modal = document.createElement("div")
    modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Sesión Expirada</h3>
            <p class="text-sm text-gray-600">Su sesión ha expirado. Por favor, vuelva a iniciar sesión.</p>
          </div>
        </div>
        <div class="flex justify-end">
          <button id="relogin-btn" class="px-4 py-2 bg-[#204983] text-white rounded-md hover:bg-[#1a3d6f] transition-colors">
            Volver a Login
          </button>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Manejar click del botón
    const reloginBtn = modal.querySelector("#relogin-btn")
    reloginBtn?.addEventListener("click", () => {
      // Limpiar localStorage
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")

      // Recargar la página para que el AuthContext redirija al login
      window.location.reload()
    })
  }, [])

  const apiRequest = useCallback(
    async (url: string, options: ApiRequestOptions = {}) => {
      const { loadingKey, skipTokenRefresh = false, ...apiOptions } = options
      if (loadingKey) setLoading(loadingKey, true)

      const {
        method = "GET",
        body,
        headers = {},
        timeout = Number(import.meta.env.VITE_API_TIMEOUT) || 30000, // Default 30 seconds
      } = apiOptions

      const makeRequest = async (): Promise<Response> => {
        const requestHeaders: Record<string, string> = {
          ...headers,
        }

        const isFormData = body instanceof FormData
        if (!isFormData && body) {
          requestHeaders["Content-Type"] = "application/json"
        }

        // Get token from localStorage
        const token = localStorage.getItem("access_token")
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

          const response = await fetch(finalUrl, {
            method,
            headers: requestHeaders,
            body: requestBody,
            signal: controller.signal,
          })

          clearTimeout(timeoutId)
          console.log(`[useApi] Response status: ${response.status} for ${finalUrl}`)

          return response
        } catch (error) {
          clearTimeout(timeoutId)
          if (error instanceof Error && error.name === "AbortError") {
            console.error(`[useApi] Request timed out for ${finalUrl} after ${timeout}ms`)
            throw new Error(`Tiempo de espera agotado después de ${timeout}ms`)
          }
          console.error(`[useApi] Network or unexpected error for ${finalUrl}:`, error)
          throw error
        }
      }

      try {
        // Hacer la primera petición
        let response = await makeRequest()

        // Si recibimos 401 y no estamos saltando el refresh de token
        if (response.status === 401 && !skipTokenRefresh) {
          console.warn("[useApi] 401 Unauthorized. Attempting token refresh...")

          // Intentar refrescar el token
          const refreshSuccess = await refreshToken()

          if (refreshSuccess) {
            console.log("[useApi] Token refreshed successfully. Retrying request...")
            // Reintentar la petición con el nuevo token
            response = await makeRequest()
          } else {
            console.error("[useApi] Token refresh failed. Session expired.")
            // Mostrar modal de sesión expirada
            showSessionExpiredModal()
            throw new Error("Sesión expirada")
          }
        }

        return response
      } catch (error) {
        console.error(`[useApi] Final error:`, error)
        throw error
      } finally {
        if (loadingKey) setLoading(loadingKey, false)
      }
    },
    [setLoading, refreshToken, showSessionExpiredModal],
  )

  return { apiRequest }
}
