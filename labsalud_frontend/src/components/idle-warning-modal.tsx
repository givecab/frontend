"use client"

import type React from "react"
import { AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface IdleWarningModalProps {
  isOpen: boolean
  timeLeft: number
  onExtend: () => void
  onLogout: () => void
}

export const IdleWarningModal: React.FC<IdleWarningModalProps> = ({ isOpen, timeLeft, onExtend, onLogout }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}`
    }
    return `${secs}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Sesión por expirar
          </DialogTitle>
          <DialogDescription className="text-center py-4">Tu sesión expirará por inactividad en:</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          <div className="flex items-center gap-2 text-3xl font-bold text-red-600 mb-2">
            <Clock className="h-8 w-8" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <p className="text-sm text-gray-600 text-center">
            {timeLeft <= 10 ? "¡Tu sesión se cerrará muy pronto!" : "¿Deseas continuar con tu sesión?"}
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onLogout} className="flex-1 bg-transparent">
            Cerrar sesión
          </Button>
          <Button onClick={onExtend} className="flex-1 bg-[#204983] hover:bg-[#1a3d6f]">
            Continuar sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default IdleWarningModal
