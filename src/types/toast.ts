export type ToastType = 'critical' | 'info' | 'success' | 'upsell' | 'warning'

export interface ToastOptions {
  title?: string
  duration?: number
  withDismiss?: boolean
}

export interface Toast extends ToastOptions {
  id: string
  type: ToastType
  description: string
}

export interface ToastContextType {
  addToast: (description: string, options: ToastOptions & { type: ToastType }) => void
}

export type ToastMethodMap = {
  [K in ToastType]: (description: string, options?: ToastOptions) => void
}
