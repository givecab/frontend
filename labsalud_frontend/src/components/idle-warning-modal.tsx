import React from "react";

interface IdleWarningModalProps {
  isOpen: boolean;
  timeLeft: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function IdleWarningModal({ 
  isOpen, 
  timeLeft, 
  onExtend, 
  onLogout 
}: IdleWarningModalProps) {
  if (!isOpen) return null;

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="mb-4">
          <h3 className="text-lg font-medium">¿Sigues ahí?</h3>
          <p className="text-gray-500 mt-2">
            Tu sesión está a punto de expirar por inactividad.
            Se cerrará automáticamente en <strong>{formatTime(timeLeft)}</strong>.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onLogout}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium"
          >
            Cerrar sesión
          </button>
          <button
            onClick={onExtend}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium"
          >
            Continuar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default IdleWarningModal;
