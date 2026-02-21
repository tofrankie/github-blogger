import type { DialogButtonProps } from '@primer/react'
import { SparkleFillIcon, SyncIcon } from '@primer/octicons-react'
import {
  ActionMenu,
  Box,
  Dialog,
  FormControl,
  IssueLabelToken,
  Stack,
  Text,
  TextInput,
  useConfirm,
} from '@primer/react'
import { useEffect, useState } from 'react'
import { DEFAULT_LABEL_COLOR, PRESET_ISSUE_TYPE_COLORS, PRESET_LABEL_COLORS } from '@/constants'
import { useCreateLabel, useDeleteLabel, useUpdateLabel } from '@/hooks'

const CYCLE_COLORS = [...PRESET_LABEL_COLORS, ...PRESET_ISSUE_TYPE_COLORS, DEFAULT_LABEL_COLOR]

const HEX_COLOR_REGEX = /^[0-9A-F]{6}$/i

interface LabelEditDialogProps {
  label?: MinimalLabel | null
  allLabelName: string[]
  onClose: () => void
}

export default function LabelEditDialog({
  label: originalLabel,
  allLabelName,
  onClose,
}: LabelEditDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [displayColorForToken, setDisplayColorForToken] = useState(DEFAULT_LABEL_COLOR)
  const [nameError, setNameError] = useState<string | null>(null)
  const [colorError, setColorError] = useState<string | null>(null)
  const [currentColorIndex, setCurrentColorIndex] = useState<number>(
    CYCLE_COLORS.findIndex(color => color.toUpperCase() === DEFAULT_LABEL_COLOR.toUpperCase()) || 0
  )
  const [isColorGridOpen, setIsColorGridOpen] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isEditMode = !!originalLabel

  const { mutateAsync: createLabelAsync } = useCreateLabel()
  const { mutateAsync: updateLabelAsync } = useUpdateLabel()
  const { mutateAsync: deleteLabelAsync } = useDeleteLabel()

  const confirm = useConfirm()

  useEffect(() => {
    setNameError(null)
    setColorError(null)
    setIsColorGridOpen(false)

    if (!originalLabel) {
      setName('')
      setDescription('')
      setColor('')
      setDisplayColorForToken(DEFAULT_LABEL_COLOR)
      setCurrentColorIndex(
        CYCLE_COLORS.findIndex(
          color => color.toUpperCase() === DEFAULT_LABEL_COLOR.toUpperCase()
        ) || 0
      )

      return
    }

    setName(originalLabel.name)
    setDescription(originalLabel.description || '')

    const labelColor = originalLabel.color

    if (labelColor && HEX_COLOR_REGEX.test(labelColor)) {
      setColor(labelColor)
      setDisplayColorForToken(labelColor)
      const foundIndex = CYCLE_COLORS.findIndex(
        color => color.toUpperCase() === labelColor.toUpperCase()
      )
      setCurrentColorIndex(foundIndex !== -1 ? foundIndex : -1)
    } else if (labelColor) {
      setColor(labelColor)
      setDisplayColorForToken(DEFAULT_LABEL_COLOR)
      setCurrentColorIndex(
        CYCLE_COLORS.findIndex(
          color => color.toUpperCase() === DEFAULT_LABEL_COLOR.toUpperCase()
        ) || 0
      )
    } else {
      setColor('')
      setDisplayColorForToken(DEFAULT_LABEL_COLOR)
      setCurrentColorIndex(
        CYCLE_COLORS.findIndex(
          color => color.toUpperCase() === DEFAULT_LABEL_COLOR.toUpperCase()
        ) || 0
      )
    }
  }, [originalLabel])

  const validate = () => {
    let isValid = true

    const formattedName = name.trim()

    if (!formattedName) {
      setNameError('Label name is required.')
      isValid = false
    } else if (allLabelName.includes(formattedName)) {
      setNameError('Label name has already been taken')
      isValid = false
    } else {
      setNameError(null)
    }

    if (color.trim() && !HEX_COLOR_REGEX.test(color)) {
      setColorError('Color must be a 6-character hex code (e.g. FF0000)')
      isValid = false
    } else {
      setColorError(null)
    }

    return isValid
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSaving(true)

    try {
      const newLabel = {
        name: name.trim(),
        color: color.trim() || DEFAULT_LABEL_COLOR,
        description: description.trim() || null,
      }

      if (isEditMode) {
        await updateLabelAsync({
          newLabel,
          oldLabel: originalLabel,
        })
      } else {
        await createLabelAsync(newLabel)
      }

      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!originalLabel) return

    const result = await confirm({
      title: 'Tips',
      content: 'Are you sure? Deleting a label will remove it from all issues and pull requests.',
      cancelButtonContent: 'Cancel',
      confirmButtonContent: 'Delete',
      confirmButtonType: 'danger',
    })

    if (!result) return

    setIsDeleting(true)

    try {
      await deleteLabelAsync(originalLabel.name)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newColorValue = e.target.value
    if (newColorValue.startsWith('#')) {
      newColorValue = newColorValue.substring(1)
    }
    newColorValue = newColorValue.replace(/[^0-9A-F]/gi, '').slice(0, 6)
    setColor(newColorValue)

    if (newColorValue.trim() === '') {
      setDisplayColorForToken(DEFAULT_LABEL_COLOR)
      setColorError(null)
      setCurrentColorIndex(
        CYCLE_COLORS.findIndex(
          color => color.toUpperCase() === DEFAULT_LABEL_COLOR.toUpperCase()
        ) || 0
      )
    } else if (HEX_COLOR_REGEX.test(newColorValue)) {
      setDisplayColorForToken(newColorValue)
      setColorError(null)
      const foundIndex = CYCLE_COLORS.findIndex(
        color => color.toUpperCase() === newColorValue.toUpperCase()
      )
      setCurrentColorIndex(foundIndex !== -1 ? foundIndex : -1)
    } else {
      setDisplayColorForToken(DEFAULT_LABEL_COLOR)
      setColorError(null)
      setCurrentColorIndex(-1)
    }
  }

  const onPresetColorSelect = (selectedColorFromGrid: string) => {
    const newColorValue = selectedColorFromGrid
    setColor(newColorValue)
    setDisplayColorForToken(newColorValue)
    const foundIndex = CYCLE_COLORS.findIndex(
      color => color.toUpperCase() === newColorValue.toUpperCase()
    )
    setCurrentColorIndex(foundIndex !== -1 ? foundIndex : -1)
    setColorError(null)
    setIsColorGridOpen(false)
  }

  const handleCycleColor = () => {
    let nextIndex = currentColorIndex
    if (currentColorIndex === -1 || currentColorIndex >= CYCLE_COLORS.length - 1) {
      nextIndex = 0
    } else {
      nextIndex = currentColorIndex + 1
    }
    const newColorValue = CYCLE_COLORS[nextIndex]
    setCurrentColorIndex(nextIndex)
    setColor(newColorValue)
    setDisplayColorForToken(newColorValue)
    setColorError(null)
  }

  const isColorFieldValidForSubmission =
    !color.trim() || (color.trim() && HEX_COLOR_REGEX.test(color))

  const canSubmit =
    name.trim() && isColorFieldValidForSubmission && !nameError && !isSaving && !isDeleting

  const footerButtons: DialogButtonProps[] = [
    ...(isEditMode
      ? [
          {
            buttonType: 'danger' as const,
            content: 'Delete',
            onClick: handleDelete,
            loading: isDeleting,
            disabled: isDeleting || isSaving,
          },
        ]
      : []),
    {
      buttonType: 'default' as const,
      content: 'Cancel',
      onClick: onClose,
      disabled: isDeleting || isSaving,
    },
    {
      buttonType: 'primary' as const,
      content: isEditMode ? 'Save changes' : 'Create label',
      onClick: handleSubmit,
      disabled: !canSubmit || isDeleting || isSaving,
    },
  ]

  return (
    <Dialog
      title={isEditMode ? 'Edit label' : 'Create new label'}
      onClose={onClose}
      footerButtons={footerButtons}
    >
      <Stack as="form">
        <Stack.Item>
          <FormControl required>
            <FormControl.Label requiredText="">Name</FormControl.Label>
            <TextInput
              block
              value={name}
              aria-label="Label name"
              placeholder="Label name"
              maxLength={50}
              onChange={e => {
                setName(e.target.value)
                if (nameError && e.target.value.trim()) setNameError(null)
              }}
            />
            {nameError && (
              <FormControl.Validation variant="error">{nameError}</FormControl.Validation>
            )}
          </FormControl>
        </Stack.Item>

        <Stack.Item>
          <FormControl>
            <FormControl.Label>Description</FormControl.Label>
            <TextInput
              block
              value={description}
              aria-label="Label description (optional)"
              placeholder="Label description (optional)"
              maxLength={100}
              onChange={e => setDescription(e.target.value)}
            />
          </FormControl>
        </Stack.Item>

        <Stack.Item>
          <FormControl>
            <FormControl.Label htmlFor="color-input">Color</FormControl.Label>
            {colorError ? (
              <FormControl.Validation variant="error">{colorError}</FormControl.Validation>
            ) : (
              <FormControl.Caption>A 6-character hex code (e.g. FF0000)</FormControl.Caption>
            )}
            <Stack direction="horizontal" gap="condensed" align="center">
              <Stack.Item>
                <TextInput
                  id="color-input"
                  leadingVisual="#"
                  value={color}
                  onChange={handleColorInputChange}
                  placeholder={DEFAULT_LABEL_COLOR}
                  maxLength={6}
                  aria-label="Hex color code"
                  sx={{ width: '100px' }}
                />
              </Stack.Item>
              <Stack.Item>
                <ActionMenu open={isColorGridOpen} onOpenChange={setIsColorGridOpen}>
                  <ActionMenu.Button
                    aria-label="Open color picker"
                    variant="default"
                    sx={{ paddingLeft: 'condensed', paddingRight: 'condensed' }}
                  >
                    Colors
                  </ActionMenu.Button>
                  <ActionMenu.Overlay width="medium" sx={{ p: 2 }}>
                    <Stack direction="vertical" gap="condensed">
                      <Text sx={{ fontSize: 0, color: 'fg.muted' }}>
                        Choose from default colors:
                      </Text>
                      <Stack direction="horizontal" gap="condensed" wrap="wrap">
                        {CYCLE_COLORS.map(color => (
                          <Stack.Item key={color} sx={{ position: 'relative' }}>
                            <IssueLabelToken
                              text={<SparkleFillIcon size={16} />}
                              size="large"
                              fillColor={`#${color}`}
                            />
                            <Box
                              aria-label={`Select color ${color}`}
                              onClick={() => onPresetColorSelect(color)}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
                              }}
                            />
                          </Stack.Item>
                        ))}
                      </Stack>
                    </Stack>
                  </ActionMenu.Overlay>
                </ActionMenu>
              </Stack.Item>
              <Stack.Item sx={{ position: 'relative' }}>
                <IssueLabelToken
                  text={<SyncIcon size={16} />}
                  size="large"
                  fillColor={`#${displayColorForToken || DEFAULT_LABEL_COLOR}`}
                />
                <Box
                  onClick={handleCycleColor}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                />
              </Stack.Item>
            </Stack>
          </FormControl>
        </Stack.Item>
      </Stack>
    </Dialog>
  )
}
