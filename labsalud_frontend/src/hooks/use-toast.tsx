"use client"

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
    success: (title: string, options?: ToastOptions) => {
      toast.success(title, options)
    },
    error: (title: string, options?: ToastOptions) => {
      toast.error(title, options)
    },
    warning: (title: string, options?: ToastOptions) => {
      toast.warning(title, options)
    },
    info: (title: string, options?: ToastOptions) => {
      toast.info(title, options)
    },
    loading: (title: string, options?: ToastOptions) => {
      return toast.loading(title, options)
    },
    dismiss: (toastId?: string) => {
      if (toastId) {
        toast.dismiss(toastId)
      } else {
        toast.dismiss()
      }
    },
  }

  return showToast
}
