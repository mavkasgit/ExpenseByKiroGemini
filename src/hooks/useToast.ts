'use client'

import { useToast as useToastContext } from '@/components/ui/Toast'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export function useToast() {
  const { success, error, warning, info } = useToastContext()

  const showToast = (message: string, type: ToastType = 'info') => {
    switch (type) {
      case 'success':
        success(message)
        break
      case 'error':
        error(message)
        break
      case 'warning':
        warning(message)
        break
      case 'info':
      default:
        info(message)
        break
    }
  }

  return {
    showToast
  }
}