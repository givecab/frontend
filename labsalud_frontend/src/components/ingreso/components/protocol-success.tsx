"use client"

import { useEffect, useState } from "react"
import { CheckIcon } from "lucide-react"
import type { Patient } from "../../../types"

interface ProtocolSuccessProps {
  protocol: any
  patient: Patient | null
  onClose: () => void
}

export function ProtocolSuccess({ onClose }: ProtocolSuccessProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)

  useEffect(() => {
    // Mostrar el checkmark después de un pequeño delay
    const checkmarkTimer = setTimeout(() => {
      setShowCheckmark(true)
    }, 100)

    // Iniciar la animación de expansión después de mostrar el checkmark
    const expansionTimer = setTimeout(() => {
      setShowSuccess(true)
    }, 300)

    // Cerrar automáticamente después de 3 segundos
    const closeTimer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => {
      clearTimeout(checkmarkTimer)
      clearTimeout(expansionTimer)
      clearTimeout(closeTimer)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Círculo verde que crece para cubrir toda la pantalla */}
      <div
        className={`
          absolute rounded-full bg-green-500 transition-all duration-1000 ease-out
          flex items-center justify-center
          ${showSuccess ? "w-[300vw] h-[300vw]" : "w-16 h-16"}
        `}
      >
        {/* Checkmark que aparece en el centro */}
        <CheckIcon
          className={`
            text-white transition-all duration-500 z-10
            ${showCheckmark ? "opacity-100 scale-100" : "opacity-0 scale-0"}
            ${showSuccess ? "text-[80px]" : "text-[32px]"}
          `}
          strokeWidth={3}
        />
      </div>
    </div>
  )
}
