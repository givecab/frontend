"use client"

import type React from "react"
import { Navbar } from "./navbar"

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#adadad] relative">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <img
          src="/logo.png"
          alt="Background Logo"
          className="w-[80vw] h-[80vh] max-w-[1200px] max-h-[1200px] object-contain opacity-90 blur-md"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=800&width=800&text=LOGO&bg=f3f4f6&color=9ca3af"
            target.style.opacity = "0.9"
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <main className="px-4 pt-4">{children}</main>
      </div>
    </div>
  )
}
