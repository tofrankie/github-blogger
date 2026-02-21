import {
  ClockIcon,
  InfoIcon,
  IssueOpenedIcon,
  LinkExternalIcon,
  LinkIcon,
} from '@primer/octicons-react'
import { ActionList, ActionMenu, IconButton, RelativeTime } from '@primer/react'
import { useToast } from '@/hooks'
import { openExternalLink } from '@/utils'

interface InfoProps {
  issue: MinimalIssue
}

export default function Info({ issue }: InfoProps) {
  const toast = useToast()

  const copyLink = () => {
    navigator.clipboard.writeText(issue.url)
    toast.success('copied.')
  }

  return (
    <ActionMenu>
      <ActionMenu.Anchor>
        <IconButton variant="invisible" aria-label="Issue info" icon={InfoIcon} />
      </ActionMenu.Anchor>
      <ActionMenu.Overlay width="medium">
        <ActionList>
          <ActionList.Item onSelect={() => openExternalLink(issue.url)}>
            <ActionList.LeadingVisual>
              <LinkExternalIcon />
            </ActionList.LeadingVisual>
            Open in browser
          </ActionList.Item>
          <ActionList.Item onSelect={copyLink}>
            <ActionList.LeadingVisual>
              <LinkIcon />
            </ActionList.LeadingVisual>
            Copy link
          </ActionList.Item>
          <ActionList.Item disabled>
            <ActionList.LeadingVisual>
              <IssueOpenedIcon />
            </ActionList.LeadingVisual>
            {`#${issue.number}`}
          </ActionList.Item>
          <ActionList.Item disabled>
            <ActionList.LeadingVisual>
              <ClockIcon />
            </ActionList.LeadingVisual>
            Created at <RelativeTime datetime={issue.createdAt} prefix="" />
          </ActionList.Item>
          <ActionList.Item disabled>
            <ActionList.LeadingVisual>
              <ClockIcon />
            </ActionList.LeadingVisual>
            Updated at <RelativeTime datetime={issue.updatedAt} prefix="" />
          </ActionList.Item>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  )
}
