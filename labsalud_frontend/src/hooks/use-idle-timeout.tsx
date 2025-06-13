"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface UseIdleTimeoutProps {
  onIdle: () => void
  idleTime?: number // en milisegundos
  warningTime?: number // tiempo antes del logout para mostrar advertencia
}

export const useIdleTimeout = ({ onIdle, idleTime = 5 * 60 * 1000, warningTime = 30 * 1000 }: UseIdleTimeoutProps) => {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(true)
  const lastActivityRef = useRef(Date.now())
  const showWarningRef = useRef(false)
  const toastIdRef = useRef<string | number | null>(null)

  // Sincronizar el ref con el estado
  useEffect(() => {
    showWarningRef.current = showWarning
  }, [showWarning])

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
  }, [])

  const resetTimer = useCallback(() => {
    if (!isActiveRef.current) return

    clearAllTimers()
    setShowWarning(false)
    lastActivityRef.current = Date.now()

    // Timer para mostrar advertencia
    warningTimerRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        setShowWarning(true)
        startCountdown()
      }
    }, idleTime - warningTime)

    // Timer principal de inactividad (como backup)
    idleTimerRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        isActiveRef.current = false
        onIdle()
      }
    }, idleTime)
  }, [idleTime, warningTime, onIdle, clearAllTimers])

  const extendSession = useCallback(() => {
    setShowWarning(false)
    resetTimer()
  }, [resetTimer])

  const startCountdown = useCallback(() => {
    let seconds = Math.floor(warningTime / 1000)
    setTimeLeft(seconds)

    // Eliminar el toast de advertencia - Ya no mostraremos el toast
    // toastIdRef.current = toast.warning("Sesión por expirar", {
    //   description: "Tu sesión expirará pronto por inactividad.",
    //   action: {
    //     label: "Continuar sesión",
    //     onClick: extendSession,
    //   },
    //   duration: warningTime, // Duración igual al tiempo de advertencia
    // })

    countdownTimerRef.current = setInterval(() => {
      seconds -= 1
      setTimeLeft(seconds)

      if (seconds <= 0) {
        clearInterval(countdownTimerRef.current!)
        countdownTimerRef.current = null
        setShowWarning(false)
        isActiveRef.current = false
        onIdle()
      }
    }, 1000)
  }, [warningTime, onIdle])

  // Función para manejar eventos de actividad del usuario
  const handleActivity = useCallback(
    (event: Event) => {
      // Ignorar eventos si vienen del modal de advertencia
      const target = event.target as HTMLElement
      const modalElement = document.getElementById("idle-warning-modal")
      if (modalElement && modalElement.contains(target)) {
        return
      }

      // No resetear si el modal de advertencia está visible
      if (showWarningRef.current) {
        return
      }

      if (isActiveRef.current) {
        resetTimer()
      }
    },
    [resetTimer],
  )

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart", "click", "keydown"]

    // Marcar como activo y configurar timers iniciales
    isActiveRef.current = true
    resetTimer()

    // Agregar event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, true)
    })

    // Cleanup
    return () => {
      clearAllTimers()
      isActiveRef.current = false
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity, true)
      })
    }
  }, [resetTimer, handleActivity, clearAllTimers])

  return {
    showWarning,
    timeLeft,
    extendSession,
    resetTimer,
  }
}
