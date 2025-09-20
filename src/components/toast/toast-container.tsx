import {Box, Portal} from '@primer/react'
import {useLayoutEffect, useRef, useState} from 'react'
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
      <Box
        sx={{
          position: 'fixed',
          top: '8px',
          right: '8px',
          width: TOAST_CONTAINER_WIDTH,
          zIndex: 500,
        }}
      >
        {toasts.map((toast, index) => (
          <Box
            key={toast.id}
            sx={{
              position: 'absolute',
              width: '100%',
              top: 0,
              right: 0,
              transform: `translateY(${getTranslateY(index)}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <div
              ref={el => {
                itemRefs.current[index] = el
              }}
            >
              <ToastItem toast={toast} onClose={() => onDismiss(toast.id)} />
            </div>
          </Box>
        ))}
      </Box>
    </Portal>
  )
}
