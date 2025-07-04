"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"

interface LoadingState {
  [key: string]: boolean
}

interface LoadingOptions {
  showToast?: boolean
  toastMessage?: string
  minDuration?: number // Duración mínima para evitar flashes
}

export function useLoading(initialKeys: string[] = []) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(() => {
    return initialKeys.reduce((acc, key) => {
      acc[key] = false
      return acc
    }, {} as LoadingState)
  })

  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const toastRefs = useRef<{ [key: string]: string | number }>({})

  const setLoading = useCallback((key: string, isLoading: boolean, options?: LoadingOptions) => {
    const { showToast = false, toastMessage = "Cargando...", minDuration = 300 } = options || {}

    if (isLoading) {
      // Iniciar loading
      setLoadingStates((prev) => ({ ...prev, [key]: true }))

      if (showToast) {
        toastRefs.current[key] = toast.loading(toastMessage)
      }
    } else {
      // Finalizar loading con duración mínima
      const startTime = Date.now()

      const finishLoading = () => {
        setLoadingStates((prev) => ({ ...prev, [key]: false }))

        if (toastRefs.current[key]) {
          toast.dismiss(toastRefs.current[key])
          delete toastRefs.current[key]
        }
      }

      const elapsed = Date.now() - startTime
      if (elapsed < minDuration) {
        timeoutRefs.current[key] = setTimeout(finishLoading, minDuration - elapsed)
      } else {
        finishLoading()
      }
    }
  }, [])

  const isLoading = useCallback(
    (key: string) => {
      return loadingStates[key] || false
    },
    [loadingStates],
  )

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean)
  }, [loadingStates])

  const withLoading = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>,
    options?: LoadingOptions
  ): Promise<T> => {
    setLoading(key, true, options)
  try {
    const result = await operation()
    return result
  } finally {
    setLoading(key, false)
  }
}
, [setLoading])

const clearAllLoading = useCallback(() => {
  // Limpiar todos los timeouts
  Object.values(timeoutRefs.current).forEach((timeout) => {
    clearTimeout(timeout)
  })
  timeoutRefs.current = {}

  // Limpiar todos los toasts
  Object.values(toastRefs.current).forEach((toastId) => {
    toast.dismiss(toastId)
  })
  toastRefs.current = {}

  // Limpiar estados
  setLoadingStates({})
}, [])

return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
    clearAllLoading
  }
}

// Hook específico para operaciones CRUD
export function useCrudLoading() {
  return useLoading(["create", "read", "update", "delete", "fetch"])
}
