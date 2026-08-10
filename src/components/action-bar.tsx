import {
  CloudIcon,
  LinkExternalIcon,
  ListUnorderedIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  TagIcon,
} from '@primer/octicons-react'
import { IconButton, Stack, useConfirm, useTheme } from '@primer/react'
import { cloneDeep } from 'licia'
import { useMemo, useState } from 'react'
import { EMPTY_ISSUE } from '@/constants'
import { useCreateIssue, useToast, useUpdateIssue } from '@/hooks'
import { useEditorStore } from '@/stores/use-editor-store'
import { openExternalLink, updateColorMode } from '@/utils'

interface ActionBoxProps {
  onLabelsVisible: (visible: boolean) => void
  onIssuesVisible: (visible: boolean) => void
}

export default function ActionBar({ onLabelsVisible, onIssuesVisible }: ActionBoxProps) {
  const issue = useEditorStore(state => state.issue)
  const isChanged = useEditorStore(state => state.isChanged)
  const canSubmit = useEditorStore(state => state.canSubmit)
  const setIssue = useEditorStore(state => state.setIssue)

  const { mutateAsync: createIssue } = useCreateIssue()
  const { mutateAsync: updateIssue } = useUpdateIssue()
  const { resolvedColorMode, setColorMode } = useTheme()
  const toast = useToast()

  const confirm = useConfirm()

  const [isSaving, setIsSaving] = useState(false)
  const [isSwitchingColorMode, setIsSwitchingColorMode] = useState(false)

  const saveBtnEnabled = useMemo(
    () => canSubmit && isChanged && !isSaving,
    [canSubmit, isChanged, isSaving]
  )

  const onSave = async () => {
    setIsSaving(true)

    try {
      if (issue.number === -1) {
        await createIssue(issue)
        return
      }
      await updateIssue(issue)
    } catch {
      // The error notification has been handled externally.
    } finally {
      setIsSaving(false)
    }
  }

  const onSwitch = async () => {
    if (!isChanged && issue.number === -1) return

    if (isChanged) {
      const result = await confirm({
        title: 'Tips',
        content:
          'You have unsaved changes. Creating a new issue will discard your current changes. Do you want to continue?',
        cancelButtonContent: 'Cancel',
        confirmButtonContent: 'Continue',
        confirmButtonType: 'danger',
      })
      if (!result) return
    }

    setIssue(cloneDeep(EMPTY_ISSUE))
  }

  const nextColorMode = resolvedColorMode === 'light' ? 'dark' : 'light'
  const colorModeToggleDescription = `Switch to ${nextColorMode} mode`

  const toggleColorMode = async () => {
    setIsSwitchingColorMode(true)

    try {
      await updateColorMode(nextColorMode)
      setColorMode(nextColorMode)
    } catch (error) {
      toast.critical(error instanceof Error ? error.message : 'Failed to switch color mode.')
    } finally {
      setIsSwitchingColorMode(false)
    }
  }

  return (
    <Stack className="app-action-bar" gap="condensed">
      <IconButton
        icon={CloudIcon}
        onClick={onSave}
        disabled={!saveBtnEnabled}
        description="Save"
        aria-label="Save"
        tooltipDirection="w"
        variant="primary"
        loading={isSaving}
      />
      <IconButton
        icon={PlusIcon}
        onClick={onSwitch}
        disabled={isSaving}
        description="Create new issue"
        aria-label="Create new issue"
        tooltipDirection="w"
      />
      <IconButton
        icon={resolvedColorMode === 'light' ? SunIcon : MoonIcon}
        onClick={toggleColorMode}
        disabled={isSwitchingColorMode}
        description={colorModeToggleDescription}
        aria-label={colorModeToggleDescription}
        tooltipDirection="w"
        loading={isSwitchingColorMode}
      />
      {issue.number > -1 && (
        <IconButton
          icon={LinkExternalIcon}
          onClick={() => openExternalLink(issue.url)}
          description="Open in browser"
          aria-label="Open in browser"
          tooltipDirection="w"
        />
      )}
      <IconButton
        icon={TagIcon}
        onClick={() => onLabelsVisible(true)}
        description="Labels"
        aria-label="Labels"
        tooltipDirection="w"
      />
      <IconButton
        icon={ListUnorderedIcon}
        onClick={() => onIssuesVisible(true)}
        description="Issues"
        aria-label="Issues"
        tooltipDirection="w"
      />
    </Stack>
  )
}
