import { Box } from '@primer/react'
import { Banner } from '@primer/react/experimental'
import { useEffect, useState } from 'react'

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

export default function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 300)
    }, toast.duration)
    return () => clearTimeout(timer)
  }, [toast.duration, onClose])

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        transform: `translateX(${isVisible ? '0' : '100%'})`,
        opacity: isExiting ? 0 : 1,
        transition: isExiting
          ? 'opacity 0.3s ease-out'
          : 'transform 0.5s cubic-bezier(0.51, 1.39, 0.64, 1.00)',
        transformOrigin: 'right',
        willChange: 'transform, opacity',
      }}
    >
      {/* TODO: custom dismiss message */}
      <Banner
        className="color-shadow-medium"
        title={toast.title}
        variant={toast.type}
        onDismiss={toast.withDismiss ? onClose : undefined}
        description={toast.description}
      />
    </Box>
  )
}
