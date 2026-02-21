import { useToastContext } from '@/providers/toast-provider'

const TOAST_TYPES: readonly ToastType[] = [
  'info',
  'success',
  'warning',
  'critical',
  'upsell',
] as const

export function useToast() {
  const { addToast } = useToastContext()

  const toastMethods = {} as ToastMethodMap
  TOAST_TYPES.forEach(type => {
    toastMethods[type] = (description: string, options?: ToastOptions) =>
      addToast(description, { ...options, type })
  })
  return toastMethods
}
