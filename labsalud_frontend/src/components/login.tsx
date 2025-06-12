"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User, Lock, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, isLoading, user } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log("Usuario autenticado, redirigiendo...")
      navigate("/", { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Formulario enviado")

    setError("") // Limpiar errores previos
    setIsSubmitting(true)

    if (!username.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos")
      setIsSubmitting(false)
      return
    }

    console.log("Llamando a login...")
    const success = await login(username, password)
    console.log("Resultado del login:", success)

    if (success) {
      console.log("Login exitoso")
      // La redirección se manejará en el useEffect cuando user cambie
    } else {
      console.log("Login falló, mostrando error")
      setError("Usuario o contraseña incorrectos. Por favor, verifica tus credenciales e intenta nuevamente.")
    }

    setIsSubmitting(false)
  }

  // Mostrar loading solo durante la verificación inicial
  if (isLoading) {
    console.log("Mostrando pantalla de carga inicial")
    return (
      <div className="min-h-screen bg-[#adadad] flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-[#204983] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700">Verificando sesión...</span>
          </div>
        </div>
      </div>
    )
  }

  // Si ya hay usuario, no mostrar nada (el useEffect se encargará de redirigir)
  if (user) {
    console.log("Usuario existe, no mostrando login")
    return null
  }

  console.log("Renderizando formulario de login")

  return (
    <div className="min-h-screen bg-[#adadad] relative overflow-hidden">
      {/* Notch Container */}
      <div className="relative w-full flex justify-center">
        {/* Notch */}
        <div className="bg-white rounded-b-3xl shadow-2xl w-full max-w-md transition-all duration-700 ease-out">
          {/* Login Form */}
          <div className="px-8 py-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido</h1>
              <p className="text-gray-600 text-sm">Inicia sesión en tu cuenta</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 text-sm font-medium">Error de autenticación</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (error) setError("") // Limpiar error al escribir
                  }}
                  placeholder="Usuario"
                  className={`
                    w-full pl-10 pr-4 py-3 bg-gray-100 border rounded-lg text-gray-800 placeholder-gray-500 
                    focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200
                    ${error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-[#204983]"}
                  `}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-600" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError("") // Limpiar error al escribir
                  }}
                  placeholder="Contraseña"
                  className={`
                    w-full pl-10 pr-4 py-3 bg-gray-100 border rounded-lg text-gray-800 placeholder-gray-500 
                    focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200
                    ${error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-[#204983]"}
                  `}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  w-full py-3 px-4 bg-[#204983] hover:bg-[#1a3d6f]
                  text-white font-medium rounded-lg 
                  transition-colors duration-200 
                  focus:outline-none focus:ring-2 focus:ring-[#204983] focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center space-x-2
                "
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </button>
            </form>

            {/* Additional Options */}
            <div className="mt-6 text-center">
              <a href="#" className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
