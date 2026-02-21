import { Portal } from '@primer/react'
import { useLayoutEffect, useRef, useState } from 'react'
import ToastItem from './toast-item'

const TOAST_CONTAINER_WIDTH = 300
const GAP_HEIGHT = 8

export default function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [heights, setHeights] = useState<number[]>([])

  useLayoutEffect(() => {
    setHeights(itemRefs.current.map(ref => ref?.offsetHeight || 0))
  }, [toasts])

  const getTranslateY = (index: number) => {
    return heights.slice(0, index).reduce((sum, h) => sum + h + GAP_HEIGHT, 0)
  }

  if (toasts.length === 0) return null

  return (
    <Portal>
      <div
        style={{
          position: 'fixed',
          top: 'var(--base-size-8)',
          right: 'var(--base-size-8)',
          zIndex: 500,
          width: TOAST_CONTAINER_WIDTH,
        }}
      >
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              transition: 'transform 0.3s ease-out',
              transform: `translateY(${getTranslateY(index)}px)`,
            }}
          >
            <div
              ref={el => {
                itemRefs.current[index] = el
              }}
            >
              <ToastItem toast={toast} onClose={() => onDismiss(toast.id)} />
            </div>
          </div>
        ))}
      </div>
    </Portal>
  )
}
