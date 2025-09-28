"use client"

import { useState, useCallback, useEffect, useRef } from "react"

interface IdleTimeoutProps {
  onIdle: () => void
  idleTime: number
  warningTime: number
  enabled?: boolean
}

export function useIdleTimeout({ onIdle, idleTime, warningTime, enabled = true }: IdleTimeoutProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(Math.ceil(warningTime / 1000))

  // Referencias para el temporizador y estado
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isWarningActiveRef = useRef(false)
  const lastActivityRef = useRef<number>(Date.now())

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
    if (warningTimerRef.current) {
      clearInterval(warningTimerRef.current)
      warningTimerRef.current = null
    }
  }, [])

  const startWarning = useCallback(() => {
    console.log("[v0] Starting warning phase")
    isWarningActiveRef.current = true
    setShowWarning(true)

    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }

    const initialSeconds = Math.ceil(warningTime / 1000)
    setTimeLeft(initialSeconds)

    warningTimerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1
        console.log("[v0] Counter updated:", newTime)

        if (newTime <= 0) {
          console.log("[v0] Time expired, logging out")
          isWarningActiveRef.current = false
          setShowWarning(false)
          if (warningTimerRef.current) {
            clearInterval(warningTimerRef.current)
            warningTimerRef.current = null
          }
          onIdle()
          return 0
        }
        return newTime
      })
    }, 1000)
  }, [warningTime, onIdle])

  const resetIdleTimer = useCallback(() => {
    if (isWarningActiveRef.current) {
      return // No resetear durante la advertencia
    }

    clearAllTimers()
    lastActivityRef.current = Date.now()

    const timeUntilWarning = idleTime - warningTime
    console.log("[v0] Setting idle timer for", timeUntilWarning, "ms")

    idleTimerRef.current = setTimeout(() => {
      console.log("[v0] Idle timer executed, starting warning")
      startWarning()
    }, timeUntilWarning)
  }, [idleTime, warningTime, clearAllTimers, startWarning])

  const handleActivity = useCallback(() => {
    const now = Date.now()

    // Throttling simple: solo cada 2 segundos
    if (now - lastActivityRef.current < 2000) {
      return
    }

    console.log("[v0] Activity detected")

    if (!isWarningActiveRef.current) {
      resetIdleTimer()
    }
  }, [resetIdleTimer])

  const extendSession = useCallback(() => {
    console.log("[v0] Extending session")
    isWarningActiveRef.current = false
    setShowWarning(false)
    clearAllTimers()
    resetIdleTimer()
  }, [clearAllTimers, resetIdleTimer])

  const resetIdleTimeout = useCallback(() => {
    console.log("[v0] Full reset of idle timeout")
    isWarningActiveRef.current = false
    setShowWarning(false)
    setTimeLeft(Math.ceil(warningTime / 1000))
    clearAllTimers()
    resetIdleTimer()
  }, [clearAllTimers, resetIdleTimer, warningTime])

  useEffect(() => {
    if (!enabled) {
      console.log("[v0] Idle timeout disabled")
      return
    }

    const events = ["mousemove", "mousedown", "keypress", "scroll", "click"]

    console.log("[v0] Setting up idle timeout")

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Iniciar el timer inmediatamente
    resetIdleTimer()

    return () => {
      console.log("[v0] Cleaning up idle timeout")
      clearAllTimers()
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [enabled]) // Added enabled to dependencies

  return { showWarning, timeLeft, extendSession, resetIdleTimeout }
}

export default useIdleTimeout
