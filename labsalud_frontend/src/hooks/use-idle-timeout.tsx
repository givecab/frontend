"use client"

import { useState, useCallback, useEffect, useRef } from "react"

interface IdleTimeoutProps {
  onIdle: () => void
  idleTime: number
  warningTime: number
}

export function useIdleTimeout({ onIdle, idleTime, warningTime }: IdleTimeoutProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(Math.ceil(warningTime / 1000))

  // Referencias para el temporizador único y estado
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isWarningActiveRef = useRef(false)
  const warningEndTimeRef = useRef<number>(0)
  const lastActivityRef = useRef<number>(Date.now())

  // Función para limpiar el temporizador
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Función para actualizar el contador de advertencia
  const updateCounter = useCallback(() => {
    if (!isWarningActiveRef.current) return

    const now = Date.now()
    const remaining = Math.max(0, warningEndTimeRef.current - now)
    const secondsLeft = Math.ceil(remaining / 1000)

    setTimeLeft(secondsLeft)

    if (remaining <= 0) {
      // Tiempo agotado, cerrar sesión
      isWarningActiveRef.current = false
      setShowWarning(false)
      onIdle()
    } else {
      // Programar la siguiente actualización
      timerRef.current = setTimeout(updateCounter, 1000)
    }
  }, [onIdle])

  // Función para iniciar la fase de advertencia
  const startWarning = useCallback(() => {
    isWarningActiveRef.current = true
    warningEndTimeRef.current = Date.now() + warningTime
    setShowWarning(true)
    setTimeLeft(Math.ceil(warningTime / 1000))

    // Iniciar el contador
    clearTimer()
    timerRef.current = setTimeout(updateCounter, 1000)
  }, [warningTime, clearTimer, updateCounter])

  // Función para resetear el temporizador de inactividad
  const resetTimer = useCallback(() => {
    // No resetear si estamos en modo advertencia
    if (isWarningActiveRef.current) return

    clearTimer()

    // Configurar el temporizador para que dispare la advertencia
    const timeUntilWarning = idleTime - warningTime
    timerRef.current = setTimeout(startWarning, timeUntilWarning)
  }, [idleTime, warningTime, clearTimer, startWarning])

  // Manejador de actividad con throttling
  const handleActivity = useCallback(() => {
    const now = Date.now()

    // Throttling: solo procesar si ha pasado al menos 1 segundo desde la última actividad
    if (now - lastActivityRef.current < 1000) return

    lastActivityRef.current = now

    // Solo resetear si no estamos en modo advertencia
    if (!isWarningActiveRef.current) {
      resetTimer()
    }
  }, [resetTimer])

  // Función para extender la sesión
  const extendSession = useCallback(() => {
    isWarningActiveRef.current = false
    setShowWarning(false)
    warningEndTimeRef.current = 0
    lastActivityRef.current = Date.now()

    clearTimer()
    resetTimer()
  }, [clearTimer, resetTimer])

  // Configurar eventos y temporizador inicial
  useEffect(() => {
    const events = ["mousemove", "mousedown", "keypress", "keydown", "scroll", "touchstart", "click"]

    // Agregar event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Iniciar el temporizador
    resetTimer()

    // Limpiar al desmontar
    return () => {
      clearTimer()
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [handleActivity, resetTimer, clearTimer])

  return { showWarning, timeLeft, extendSession }
}

export default useIdleTimeout
