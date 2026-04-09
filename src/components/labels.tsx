import { PlusIcon } from '@primer/octicons-react'
import { CounterLabel, Dialog, IssueLabelToken, SkeletonBox, Stack } from '@primer/react'
import { useMemo, useState } from 'react'
import { useLabels } from '@/hooks'
import { FlashWithRetry } from './flash-with-retry'
import LabelEditDialog from './label-edit-dialog'

const LABEL_SKELETON_COUNT = 12

interface LabelsProps {
  visible: boolean
  onLabelsVisible: (visible: boolean) => void
}

export default function Labels({ visible, onLabelsVisible }: LabelsProps) {
  const [hoveredId, setHoveredId] = useState<string>('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLabel, setEditingLabel] = useState<MinimalLabel | null>(null)

  const {
    data: labels = [],
    isLoading: isLoadingLabels,
    isError: isErrorLabels,
    refetch: refetchLabels,
  } = useLabels()

  const allLabelName = useMemo(() => {
    if (!labels) return []
    return labels
      .filter(label => !editingLabel || label.id !== editingLabel.id)
      .map(label => label.name)
  }, [labels, editingLabel])

  const openEditDialog = (label: MinimalLabel) => {
    setEditingLabel(label)
    setIsEditDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingLabel(null)
    setIsEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setEditingLabel(null)
    setIsEditDialogOpen(false)
  }

  if (!visible) return null

  return (
    <>
      <Dialog
        className="app-labels"
        position="right"
        width="medium"
        onClose={() => onLabelsVisible(false)}
        title={
          <Stack align="center" gap="condensed" direction="horizontal">
            <Stack.Item>Labels</Stack.Item>
            {labels.length > 0 && (
              <Stack.Item>
                <CounterLabel style={{ color: 'var(--fgColor-muted)' }}>
                  {labels.length}
                </CounterLabel>
              </Stack.Item>
            )}
          </Stack>
        }
      >
        {isLoadingLabels ? (
          <Stack gap="condensed" direction="horizontal" wrap="wrap">
            {Array.from({ length: LABEL_SKELETON_COUNT }).map((_, index) => (
              <SkeletonBox key={index} width="48px" height="24px" className="label-skeleton" />
            ))}
          </Stack>
        ) : isErrorLabels ? (
          <FlashWithRetry message="Failed to load labels" onRetry={() => refetchLabels()} />
        ) : (
          <Stack gap="condensed" direction="horizontal" wrap="wrap">
            {labels.map(label => (
              <Stack.Item
                key={label.id}
                style={{ position: 'relative' }}
                onClick={() => openEditDialog(label)}
              >
                <IssueLabelToken
                  id={label.id}
                  text={label.name}
                  fillColor={`#${label.color}`}
                  size="large"
                  isSelected={hoveredId === label.id}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHoveredId(label.id)}
                  onMouseLeave={() => setHoveredId('')}
                />
              </Stack.Item>
            ))}
            {!isLoadingLabels && !isErrorLabels && (
              <Stack.Item onClick={openCreateDialog}>
                <CounterLabel
                  style={{
                    color: 'white',
                    backgroundColor: 'var(--bgColor-success-emphasis)',
                    cursor: 'pointer',
                  }}
                >
                  <PlusIcon size={16} />
                </CounterLabel>
              </Stack.Item>
            )}
          </Stack>
        )}
      </Dialog>

      {isEditDialogOpen && (
        <LabelEditDialog
          onClose={closeEditDialog}
          label={editingLabel}
          allLabelName={allLabelName}
        />
      )}
    </>
  )
}
