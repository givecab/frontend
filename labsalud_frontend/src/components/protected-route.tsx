"use client"

import type React from "react"
import { Navigate } from "react-router-dom"
import useAuth from "@/contexts/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, isInitialized } = useAuth()

  // Mostrar loading mientras se inicializa la autenticación
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Solo redirigir al login si ya terminó la inicialización y no hay usuario
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
