"use client"

import type React from "react"
import { AlertTriangle, Clock } from "lucide-react"

interface IdleWarningModalProps {
  isOpen: boolean
  timeLeft: number
  onExtend: () => void
  onLogout: () => void
}

export const IdleWarningModal: React.FC<IdleWarningModalProps> = ({ isOpen, timeLeft, onExtend, onLogout }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="idle-warning-modal">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-yellow-100 rounded-full p-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Sesión por expirar</h2>

        <p className="text-gray-600 text-center mb-4">Tu sesión expirará por inactividad en:</p>

        <div className="flex items-center justify-center mb-6">
          <div className="bg-red-100 rounded-lg px-4 py-2 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-red-600" />
            <span className="text-2xl font-bold text-red-600">
              {timeLeft} segundo{timeLeft !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onExtend}
            className="flex-1 bg-[#204983] hover:bg-[#1a3d6f] text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Continuar sesión
          </button>
          <button
            onClick={onLogout}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
