"use client"

import { useRef, useCallback, useEffect } from "react"

interface UseInfiniteScrollOptions {
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  threshold?: number
  rootMargin?: string
  dependencies?: any[] // Adicional: dependencias para re-crear el observer si cambian
}

export function useInfiniteScroll({
  loading,
  hasMore,
  onLoadMore,
  threshold = 0.1,
  rootMargin = "0px 0px 200px 0px", // Cargar más cuando el trigger esté a 200px del viewport
  dependencies = [], // Dependencias para el efecto del observer
}: UseInfiniteScrollOptions) {
  const observer = useRef<IntersectionObserver | null>(null)

  // Usamos un efecto para manejar la lógica del observer,
  // permitiendo que se actualice si las dependencias cambian.
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return

      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading) {
            onLoadMore()
          }
        },
        { threshold, rootMargin },
      )

      if (node) observer.current.observe(node)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, hasMore, onLoadMore, threshold, rootMargin, ...dependencies],
  )

  // Limpiar el observer al desmontar
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])

  return sentinelRef
}
