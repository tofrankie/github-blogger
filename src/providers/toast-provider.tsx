import { uuid } from 'licia'
import { createContext, useCallback, useContext, useState } from 'react'
import ToastContainer from '@/components/toast/toast-container'

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

const TOAST_DEFAULT_OPTIONS = {
  withDismiss: true,
  duration: 3000,
} as const

const TYPE_TITLE_MAP: Record<ToastType, string> = {
  critical: 'Error',
  info: 'Info',
  success: 'Success',
  upsell: 'Upsell',
  warning: 'Warning',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast: ToastContextType['addToast'] = useCallback((description, options) => {
    const id = uuid()

    const title =
      options?.title ||
      TYPE_TITLE_MAP[options.type] ||
      options.type.charAt(0).toUpperCase() + options.type.slice(1)

    const newItem = {
      ...TOAST_DEFAULT_OPTIONS,
      ...options,
      id,
      title,
      description,
    }

    setToasts(prev => [...prev, newItem])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}
