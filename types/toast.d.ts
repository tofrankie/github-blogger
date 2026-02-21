export {}

declare global {
  type ToastType = 'critical' | 'info' | 'success' | 'upsell' | 'warning'

  interface ToastOptions {
    title?: string
    duration?: number
    withDismiss?: boolean
  }

  interface Toast extends ToastOptions {
    id: string
    type: ToastType
    description: string
  }

  interface ToastContextType {
    addToast: (description: string, options: ToastOptions & { type: ToastType }) => void
  }

  type ToastMethodMap = {
    [K in ToastType]: (description: string, options?: ToastOptions) => void
  }
}
