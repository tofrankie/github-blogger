import type {FlashProps} from '@primer/react'
import type {InlineMessageProps} from '@primer/react/experimental'
import {SyncIcon} from '@primer/octicons-react'
import {Flash, IconButton, Stack} from '@primer/react'
import {InlineMessage} from '@primer/react/experimental'
import {useCallback, useState} from 'react'

interface FlashWithRetryProps {
  flashVariant?: FlashProps['variant']
  messageVariant?: InlineMessageProps['variant']
  message: string
  onRetry: (...args: any[]) => Promise<unknown>
}

export function FlashWithRetry({
  flashVariant = 'danger',
  messageVariant = 'critical',
  message,
  onRetry,
}: FlashWithRetryProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleRetry = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      await onRetry()
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, onRetry])

  return (
    <Flash variant={flashVariant} sx={{'& svg': {mr: 0}}}>
      <Stack direction="horizontal" align="center" justify="space-between" gap="condensed">
        <Stack.Item grow>
          <InlineMessage variant={messageVariant}>{message}</InlineMessage>
        </Stack.Item>
        <Stack.Item sx={{flexShrink: 0}}>
          <IconButton
            sx={{'& svg': {color: 'fg.muted'}}}
            onClick={handleRetry}
            icon={SyncIcon}
            aria-label="Retry"
            variant="default"
            loading={isLoading}
            disabled={isLoading}
          />
        </Stack.Item>
      </Stack>
    </Flash>
  )
}
