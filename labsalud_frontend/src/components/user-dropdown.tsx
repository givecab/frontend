"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { User, LogOut, Settings, UserCircle, Shield } from "lucide-react"
import useAuth from "@/contexts/auth-context"
import { Link } from "react-router-dom"
import { PERMISSIONS } from "@/config/permissions"

interface UserDropdownProps {
  isMobile?: boolean
  onMenuToggle?: (isOpen: boolean) => void
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ isMobile = false, onMenuToggle }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, logout, hasPermission } = useAuth()

  const canAccessManagement = hasPermission(PERMISSIONS.MANAGE_USERS.id)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    onMenuToggle?.(isOpen)
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleLogout = () => {
    logout(true)
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={handleToggle}
        className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
      >
        {user.photo ? (
          <img
            src={user.photo || "/placeholder.svg"}
            alt={`${user.username} avatar`}
            className="w-8 h-8 rounded-full object-cover border border-gray-300"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#204983] flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
        {!isMobile && <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.username}</span>}
      </button>

      {/* Dropdown Menu */}
      <div
        ref={menuRef}
        className={`
          absolute z-50 bg-white shadow-lg overflow-hidden transition-all duration-200 ease-in-out
          ${isMobile ? "left-0 w-full fixed top-[3.5rem] rounded-b-lg" : "right-0 mt-0 w-48 rounded-b-lg"}
          ${isOpen ? "opacity-100 max-h-96" : "opacity-0 max-h-0 pointer-events-none"}
        `}
        style={
          !isMobile
            ? {
                right: "-2rem",
                marginTop: "0px",
              }
            : {}
        }
      >
        {/* User Info */}
        <div className="px-4 py-4 border-b border-gray-100">
          {isMobile && (
            <div className="mb-3">
              <p className="text-lg font-medium text-gray-900">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-sm text-gray-500">{user.username}</p>
            </div>
          )}
          {!isMobile && (
            <p className="text-sm font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </p>
          )}
        </div>

        {/* Menu Items */}
        <div className={isMobile ? "p-4" : ""}>
          <Link
            to="/profile"
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors duration-150"
            onClick={() => setIsOpen(false)}
          >
            <UserCircle className="w-5 h-5" />
            <span>Mi Perfil</span>
          </Link>

          {canAccessManagement && (
            <Link
              to="/management"
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors duration-150"
              onClick={() => setIsOpen(false)}
            >
              <Shield className="w-5 h-5" />
              <span>Gestión de Usuarios</span>
            </Link>
          )}

          <Link
            to="/configuracion"
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors duration-150"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </Link>

          <hr className="my-2" />

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors duration-150"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  )
}
