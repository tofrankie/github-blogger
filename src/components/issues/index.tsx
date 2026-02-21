import type { ActionListItemInput } from '@primer/react/deprecated'
import {
  ChevronRightIcon,
  GearIcon,
  GraphIcon,
  IssueOpenedIcon,
  MarkGithubIcon,
  PlayIcon,
  SearchIcon,
  SparkleFillIcon,
  TagIcon,
  TriangleDownIcon,
  XCircleFillIcon,
} from '@primer/octicons-react'
import {
  Avatar,
  Button,
  CounterLabel,
  Dialog,
  IconButton,
  Link,
  NavList,
  PageHeader,
  Pagination,
  SelectPanel,
  Stack,
  Text,
  TextInput,
  Truncate,
  useConfirm,
} from '@primer/react'
import { Blankslate } from '@primer/react/experimental'
import { debounce, intersect, unique } from 'licia'
import { useCallback, useMemo, useState } from 'react'
import { DEFAULT_PAGINATION_SIZE, MESSAGE_TYPE } from '@/constants'
import { useIssueCount, useIssueCountWithFilter, useIssues, useLabels, useRepo } from '@/hooks'
import { useEditorStore } from '@/stores/use-editor-store'
import { getVscode } from '@/utils'
import { FlashWithRetry } from '../flash-with-retry'
import { IssueSkeleton, ListSkeleton } from './skeleton'

const SELECT_PANEL_PLACEHOLDER = 'Filter by labels'

const vscode = getVscode()

const LINK_TYPE = {
  REPO: 'repo',
  PROFILE: 'profile',
  ISSUES: 'issues',
  LABELS: 'labels',
  ACTIONS: 'actions',
  INSIGHTS: 'insights',
  SETTINGS: 'settings',
} as const

type LinkType = ValueOf<typeof LINK_TYPE>

interface IssuesProps {
  visible: boolean
  onIssuesVisible: (visible: boolean) => void
}

export default function Issues({ visible, onIssuesVisible }: IssuesProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [filterTitle, setFilterTitle] = useState('')
  const [filterLabelNames, setFilterLabelNames] = useState<string[]>([])

  const [titleValue, setTitleValue] = useState('')
  const [selected, setSelected] = useState<ActionListItemInput[]>([])
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(false)

  const confirm = useConfirm()

  const {
    data: repo,
    isLoading: isLoadingRepo,
    isError: isErrorRepo,
    refetch: refetchRepo,
  } = useRepo()

  const { data: labels = [] } = useLabels()

  const {
    data: issues,
    isLoading: isLoadingIssues,
    isPending: isPendingIssues,
    isError: isErrorIssues,
    refetch: refetchIssues,
  } = useIssues({
    page: currentPage,
    labelNames: filterLabelNames,
    title: filterTitle,
  })

  const { data: issueCount, isFetched: isFetchedIssueCount } = useIssueCount()

  const { data: issueCountWithFilter } = useIssueCountWithFilter({
    labelNames: filterLabelNames,
    title: filterTitle,
  })

  const withoutIssue = useMemo(
    () => isFetchedIssueCount && issueCount === 0,
    [isFetchedIssueCount, issueCount]
  )

  const withFilter = useMemo(() => {
    return !!filterTitle || filterLabelNames.length > 0
  }, [filterTitle, filterLabelNames])

  const currentIssueNumber = useEditorStore(state => state.issue.number)
  const isChanged = useEditorStore(state => state.isChanged)
  const setIssue = useEditorStore(state => state.setIssue)

  const items = useMemo(() => {
    return labels.map(item => ({ text: item.name }))
  }, [labels])

  const filteredItems = items.filter(
    item =>
      selected.some(selectedItem => selectedItem.text === item.text) ||
      item.text?.toLowerCase().includes(filter.trim().toLowerCase())
  )

  const selectedItemsSortedFirst = sortBySelected<ActionListItemInput>(filteredItems, selected)

  const searchByTitle = useCallback(
    debounce((title: string) => {
      setFilterTitle(title)
      setCurrentPage(1)
    }, 500),
    []
  )

  const searchByLabel = useCallback(
    debounce((labelNames: string[]) => {
      const allName = labels.map(l => l.name)
      const filteredNames: string[] = intersect(allName, labelNames)
      setCurrentPage(1)
      setFilterLabelNames(filteredNames)
    }, 500),
    [labels]
  )

  const handleSelectedChange = (items: ActionListItemInput[]) => {
    setSelected(items)
    const labelNames = items.map(item => item.text).filter(Boolean) as string[]
    searchByLabel(labelNames)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setTitleValue(title)
    searchByTitle(title.trim())
  }

  const handleIssueClick = async (e: React.MouseEvent<HTMLAnchorElement>, issue: MinimalIssue) => {
    e.preventDefault()

    if (issue.number === currentIssueNumber) {
      onIssuesVisible(false)
      return
    }

    if (isChanged) {
      const result = await confirm({
        title: 'Tips',
        content:
          'You have unsaved changes. Switching to another issue will discard your current changes. Do you want to continue?',
        cancelButtonContent: 'Cancel',
        confirmButtonContent: 'Continue',
        confirmButtonType: 'danger',
      })

      if (!result) return
    }

    setIssue(issue)
    onIssuesVisible(false)
  }

  if (!visible) return null

  return (
    <Dialog
      position="left"
      width="large"
      onClose={() => onIssuesVisible(false)}
      title={
        <Stack align="center" gap="condensed" direction="horizontal">
          <Stack.Item>Issues</Stack.Item>
          {issueCount && withFilter && issueCountWithFilter ? (
            <CounterLabel style={{ color: 'var(--fgColor-muted)' }}>
              {issueCountWithFilter}/{issueCount}
            </CounterLabel>
          ) : issueCount ? (
            <CounterLabel style={{ color: 'var(--fgColor-muted)' }}>{issueCount}</CounterLabel>
          ) : null}
        </Stack>
      }
      renderBody={() => {
        if (isErrorRepo) {
          return (
            <Stack padding="normal">
              <FlashWithRetry message="Failed to load repository" onRetry={() => refetchRepo()} />
            </Stack>
          )
        }

        if (isLoadingRepo || !repo) return <IssueSkeleton />

        return (
          <div style={{ height: '100%' }}>
            <Stack style={{ height: '100%' }}>
              <Stack.Item style={{ flexShrink: 0 }}>
                <div
                  style={{
                    paddingTop: 'var(--base-size-16)',
                    paddingRight: 'var(--base-size-16)',
                    paddingLeft: 'var(--base-size-16)',
                  }}
                >
                  <Stack>
                    <HeaderIssues repo={repo} />
                    <TextInput
                      style={{ width: '100%' }}
                      placeholder="Filter by title"
                      onChange={handleTitleChange}
                      value={titleValue}
                      trailingAction={
                        titleValue ? (
                          <TextInput.Action
                            icon={XCircleFillIcon}
                            aria-label="Clear filter"
                            onClick={() => {
                              setTitleValue('')
                              searchByTitle('')
                            }}
                          />
                        ) : (
                          <></>
                        )
                      }
                    />
                    <SelectPanel
                      renderAnchor={({ children, ...anchorProps }) => (
                        <Button
                          {...anchorProps}
                          style={{ width: '100%' }}
                          alignContent="start"
                          trailingAction={TriangleDownIcon}
                          aria-haspopup="dialog"
                          labelWrap
                        >
                          {sortSelectedItems(children as string, selectedItemsSortedFirst)}
                        </Button>
                      )}
                      footer={
                        <Button
                          style={{ width: '100%' }}
                          onClick={() => {
                            setFilter('')
                            setSelected([])
                            searchByLabel([])
                          }}
                        >
                          Clear filters
                        </Button>
                      }
                      title="Select labels"
                      placeholder={SELECT_PANEL_PLACEHOLDER}
                      placeholderText="Filter labels"
                      open={open}
                      onOpenChange={setOpen}
                      items={selectedItemsSortedFirst}
                      selected={selected}
                      onSelectedChange={handleSelectedChange}
                      onFilterChange={setFilter}
                    />
                  </Stack>
                </div>
              </Stack.Item>
              <Stack.Item
                grow
                style={{
                  paddingLeft: 'var(--base-size-16)',
                  paddingRight: 'var(--base-size-16)',
                  overflow: 'auto',
                }}
              >
                <>
                  {isLoadingIssues || isPendingIssues ? (
                    <ListSkeleton />
                  ) : isErrorIssues ? (
                    <FlashWithRetry
                      message="Failed to load issues"
                      onRetry={() => refetchIssues()}
                    />
                  ) : withoutIssue ? (
                    <WithoutIssue onActionClick={() => onIssuesVisible(false)} />
                  ) : withFilter && !isPendingIssues && !issues.length ? (
                    <NoFilterResult />
                  ) : (
                    <NavList className="issues-nav-list">
                      <Stack style={{ gap: 'var(--base-size-4)' }}>
                        {issues.map(item => {
                          const isCurrent = item.number === currentIssueNumber
                          return (
                            <NavList.Item
                              key={item.id}
                              style={{ width: '100%' }}
                              aria-current={isCurrent ? 'page' : undefined}
                              onClick={e => handleIssueClick(e, item)}
                            >
                              <Stack direction="horizontal" gap="condensed" align="center">
                                <Stack.Item style={{ minWidth: 0, flexGrow: 1 }}>
                                  <Stack direction="horizontal" align="baseline" gap="condensed">
                                    <Stack.Item
                                      style={{ fontWeight: 'var(--base-text-weight-semibold)' }}
                                    >
                                      <Truncate title={item.title} maxWidth="100%">
                                        {item.title}
                                      </Truncate>
                                    </Stack.Item>
                                    <Stack.Item style={{ flexShrink: 0 }}>
                                      <Text
                                        style={{
                                          color: 'var(--fgColor-muted)',
                                          fontSize: 'var(--text-body-size-small)',
                                          fontWeight: 'var(--base-text-weight-normal)',
                                        }}
                                      >
                                        #{item.number}
                                      </Text>
                                    </Stack.Item>
                                  </Stack>
                                </Stack.Item>
                                <Stack.Item
                                  style={{
                                    flexShrink: 0,
                                    flexGrow: 0,
                                    color: 'var(--fgColor-muted)',
                                  }}
                                >
                                  <ChevronRightIcon size={16} />
                                </Stack.Item>
                              </Stack>
                            </NavList.Item>
                          )
                        })}
                      </Stack>
                    </NavList>
                  )}
                </>
              </Stack.Item>
            </Stack>
          </div>
        )
      }}
      renderFooter={() => {
        const count = withFilter ? issueCountWithFilter : issueCount
        return (
          <div
            style={{
              borderTop: '1px solid var(--borderColor-default)',
            }}
          >
            <Pagination
              currentPage={currentPage}
              pageCount={Math.ceil((count ?? 0) / DEFAULT_PAGINATION_SIZE)}
              surroundingPageCount={1}
              showPages={{ narrow: false }}
              onPageChange={(_event, number) => setCurrentPage(number)}
            />
          </div>
        )
      }}
    />
  )
}

interface HeaderIssuesProps {
  repo: RestRepo
}

function HeaderIssues({ repo }: HeaderIssuesProps) {
  const openExternalLink = (type: LinkType) => {
    if (!type) return

    const repoUrl = repo.html_url
    const links = {
      [LINK_TYPE.REPO]: repoUrl,
      [LINK_TYPE.PROFILE]: repo.owner.html_url,
      [LINK_TYPE.ISSUES]: `${repoUrl}/issues`,
      [LINK_TYPE.LABELS]: `${repoUrl}/labels`,
      [LINK_TYPE.ACTIONS]: `${repoUrl}/actions`,
      [LINK_TYPE.INSIGHTS]: `${repoUrl}/graphs/traffic`,
      [LINK_TYPE.SETTINGS]: `${repoUrl}/settings`,
    }

    vscode.postMessage({
      command: MESSAGE_TYPE.OPEN_EXTERNAL_LINK,
      externalLink: links[type],
    })
  }

  return (
    <PageHeader>
      <PageHeader.TitleArea>
        <PageHeader.Title>
          <Stack gap="condensed" direction="horizontal" align="center">
            {repo.owner.avatar_url ? (
              <Avatar
                size={32}
                src={repo.owner.avatar_url}
                onClick={() => openExternalLink(LINK_TYPE.PROFILE)}
                style={{ cursor: 'pointer' }}
              />
            ) : (
              <MarkGithubIcon size={32} />
            )}
            <Link className="issues-header-link" onClick={() => openExternalLink(LINK_TYPE.REPO)}>
              {repo.name}
            </Link>
          </Stack>
        </PageHeader.Title>
      </PageHeader.TitleArea>
      <PageHeader.Actions>
        <IconButton
          aria-label="Issues"
          icon={IssueOpenedIcon}
          tooltipDirection="n"
          onClick={() => openExternalLink(LINK_TYPE.ISSUES)}
        />
        <IconButton
          aria-label="Labels"
          icon={TagIcon}
          tooltipDirection="n"
          onClick={() => openExternalLink(LINK_TYPE.LABELS)}
        />
        <IconButton
          aria-label="Actions"
          icon={PlayIcon}
          tooltipDirection="n"
          onClick={() => openExternalLink(LINK_TYPE.ACTIONS)}
        />
        <IconButton
          aria-label="Insights"
          icon={GraphIcon}
          tooltipDirection="n"
          onClick={() => openExternalLink(LINK_TYPE.INSIGHTS)}
        />
        <IconButton
          aria-label="Settings"
          icon={GearIcon}
          tooltipDirection="n"
          onClick={() => openExternalLink(LINK_TYPE.SETTINGS)}
        />
      </PageHeader.Actions>
    </PageHeader>
  )
}

function WithoutIssue({ onActionClick }: { onActionClick: () => void }) {
  return (
    <Blankslate spacious>
      <Blankslate.Visual>
        <SparkleFillIcon size="medium" />
      </Blankslate.Visual>
      <Blankslate.Heading>Welcome to GitHub Blogger</Blankslate.Heading>
      <Blankslate.Description>Create and manage blog posts via GitHub issue</Blankslate.Description>
      <Blankslate.PrimaryAction onClick={onActionClick}>
        Create your first issue
      </Blankslate.PrimaryAction>
    </Blankslate>
  )
}

function NoFilterResult() {
  return (
    <Blankslate spacious>
      <Blankslate.Visual>
        <SearchIcon size="medium" />
      </Blankslate.Visual>
      <Blankslate.Heading>No results</Blankslate.Heading>
      <Blankslate.Description>Try adjusting your search filters.</Blankslate.Description>
    </Blankslate>
  )
}

function sortBySelected<T extends { text?: string }>(allItem: T[], selectedItems: T[]) {
  return [...allItem].sort((a, b) => {
    const aIsSelected = selectedItems.some(i => i.text === a.text)
    const bIsSelected = selectedItems.some(i => i.text === b.text)
    if (aIsSelected && !bIsSelected) return -1
    if (!aIsSelected && bIsSelected) return 1
    return 0
  })
}

function sortSelectedItems(selectedStr: string, sortedItems: ActionListItemInput[]) {
  // 未选择任何标签
  if (selectedStr === SELECT_PANEL_PLACEHOLDER) return selectedStr

  const selectedItems = unique(selectedStr.split(', '))
  return sortedItems
    .filter(item => selectedItems.includes(item.text))
    .map(item => item.text)
    .join(', ')
}
