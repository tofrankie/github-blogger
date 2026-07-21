import type { FlashProps } from '@primer/react'
import type { InlineMessageProps } from '@primer/react/experimental'
import { SyncIcon } from '@primer/octicons-react'
import { Flash, IconButton, Stack, Text } from '@primer/react'
import { InlineMessage } from '@primer/react/experimental'
import { useCallback, useState } from 'react'
import { ERROR_TYPE_MAP } from '@/constants'
import { RpcError } from '@/utils/rpc'

interface FlashWithRetryProps {
  title: string
  variant?: FlashProps['variant']
  inlineMessageVariant?: InlineMessageProps['variant']
  error?: unknown
  onRetry: () => Promise<unknown>
}

export function FlashWithRetry({
  title,
  variant = 'danger',
  inlineMessageVariant = 'critical',
  error,
  onRetry,
}: FlashWithRetryProps) {
  const [isLoading, setIsLoading] = useState(false)
  const details = getErrorDetail(error)

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
    <Flash variant={variant} className="flash-retry">
      <Stack direction="horizontal" align="stretch" justify="space-between" gap="condensed">
        <Stack.Item grow>
          <Stack gap="condensed">
            <InlineMessage
              variant={inlineMessageVariant}
              style={{ fontWeight: 'var(--base-text-weight-medium)' }}
            >
              {title}
            </InlineMessage>
            {details.length > 0 && (
              <Text as="div" className="flash-retry-detail">
                <Stack gap="tight">
                  {details.map(item => (
                    <Text as="div" key={item}>
                      {item}
                    </Text>
                  ))}
                </Stack>
              </Text>
            )}
          </Stack>
        </Stack.Item>
        <Stack.Item style={{ flexShrink: 0 }}>
          <IconButton
            className="flash-retry-icon"
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

function getErrorDetail(error: unknown) {
  if (error instanceof RpcError) {
    const { apiError } = error
    const detail = apiError.detail
    const detailItems = [`${ERROR_TYPE_MAP[apiError.type]}: ${apiError.message}`]

    if (detail) {
      detailItems.unshift(`Status: ${detail.status}`)

      const method = detail.request.method ? `${detail.request.method} ` : ''
      detailItems.push(`Request: ${method}${detail.request.url}`)
    }

    return detailItems
  }

  if (error instanceof Error) {
    return [error.message]
  }

  if (error === undefined || error === null) {
    return []
  }

  return [String(error)]
}
