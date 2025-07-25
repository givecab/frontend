"use client"

import { useCallback } from "react"
import { toast } from "sonner"

type ToastOptions = {
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

export function useToast() {
  const showToast = {
    success: useCallback((title: string, options?: ToastOptions) => {
      toast.success(title, options)
    }, []),
    error: useCallback((title: string, options?: ToastOptions) => {
      toast.error(title, options)
    }, []),
    warning: useCallback((title: string, options?: ToastOptions) => {
      toast.warning(title, options)
    }, []),
    info: useCallback((title: string, options?: ToastOptions) => {
      toast.info(title, options)
    }, []),
    loading: useCallback((title: string, options?: ToastOptions) => {
      return toast.loading(title, options)
    }, []),
    dismiss: useCallback((toastId?: string) => {
      if (toastId) {
        toast.dismiss(toastId)
      } else {
        toast.dismiss()
      }
    }, []),
  }

  return showToast
}
