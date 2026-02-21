import { SkeletonBox, Stack } from '@primer/react'
import { SkeletonAvatar, SkeletonText } from '@primer/react/experimental'
import { useMemo } from 'react'

const SKELETON_ITEM_HEIGHT = 32

// TODO: use memo?

export function IssueSkeleton() {
  return (
    <Stack padding="normal" sx={{ height: '100%', overflow: 'hidden' }}>
      <Stack.Item>
        <HeaderSkeleton />
      </Stack.Item>
      <Stack.Item grow>
        <ListSkeleton />
      </Stack.Item>
    </Stack>
  )
}

export function HeaderSkeleton() {
  return (
    <Stack>
      <Stack direction="horizontal" gap="condensed" align="center">
        <SkeletonAvatar size={SKELETON_ITEM_HEIGHT} />
        <SkeletonText size="titleSmall" width="50px" />
      </Stack>
      <SkeletonBox height={SKELETON_ITEM_HEIGHT} />
      <SkeletonBox height={SKELETON_ITEM_HEIGHT} />
    </Stack>
  )
}

export function ListSkeleton() {
  const list = useMemo(() => Array.from({ length: 3 }, () => 1), [])
  return (
    <Stack gap="normal">
      {list.map((_, index) => (
        <SkeletonBox key={index} height={SKELETON_ITEM_HEIGHT} />
      ))}
      <SkeletonBox width="80%" height={SKELETON_ITEM_HEIGHT} />
      <SkeletonBox width="60%" height={SKELETON_ITEM_HEIGHT} />
      <SkeletonBox width="40%" height={SKELETON_ITEM_HEIGHT} />
    </Stack>
  )
}
