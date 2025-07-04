"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface IdleWarningModalProps {
  isOpen: boolean
  timeLeft: number
  onExtend: () => void
  onLogout: () => void
}

export function IdleWarningModal({ isOpen, timeLeft, onExtend, onLogout }: IdleWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        id="idle-warning-modal"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Sesión por expirar
          </DialogTitle>
          <DialogDescription>
            Tu sesión expirará por inactividad en <span className="font-bold text-red-600">{timeLeft}</span> segundos.
          </DialogDescription>
        </DialogHeader>

        <div className="text-center py-4">
          <div className="text-6xl font-bold text-red-600 mb-2">{timeLeft}</div>
          <p className="text-sm text-muted-foreground">¿Deseas continuar con tu sesión?</p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onLogout} className="flex-1 bg-transparent">
            Cerrar sesión
          </Button>
          <Button onClick={onExtend} className="flex-1">
            Continuar sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
