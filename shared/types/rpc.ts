import type { RPCDefinition } from '@tofrankie/vscode-webview-rpc'
import type { MinimalIssue, MinimalIssues, MinimalLabel, MinimalLabels, Settings } from './domain'
import type {
  CreateBlobParams,
  CreateCommitParams,
  CreateIssueParams,
  CreateLabelParams,
  DeleteLabelParams,
  GetCommitParams,
  RestBlob,
  RestCommit,
  RestRef,
  RestRepo,
  RestTree,
  UpdateIssueParams,
  UpdateLabelParams,
  UpdateRefParams,
} from './rest'

export type GetIssuesCallParams = {
  page: number
  labels: string[]
}

export type GetIssuesWithFilterCallParams = {
  after: string | null
  labels: string[]
  title: string
}

export type GetIssueCountWithFilterCallParams = {
  title: string
  labels: string[]
}

export type CreateIssueCallParams = {
  title: CreateIssueParams['title']
  body: CreateIssueParams['body']
  labelNames: string[]
}

export type UpdateIssueCallParams = {
  issueNumber: UpdateIssueParams['issue_number']
  title: UpdateIssueParams['title']
  body: UpdateIssueParams['body']
  labelNames: string[]
}

export type CreateLabelCallParams = {
  name: CreateLabelParams['name']
  color: CreateLabelParams['color']
  description?: CreateLabelParams['description']
}

export type UpdateLabelCallParams = {
  newName?: UpdateLabelParams['new_name']
  name: UpdateLabelParams['name']
  color: UpdateLabelParams['color']
  description?: UpdateLabelParams['description']
}

export type DeleteLabelCallParams = {
  name: DeleteLabelParams['name']
}

export type GetCommitCallParams = {
  commitSha: GetCommitParams['commit_sha']
}

export type UpdateRefCallParams = {
  sha: UpdateRefParams['sha']
}

export type CreateBlobCallParams = {
  content: CreateBlobParams['content']
}

export type CreateTreeCallParams = {
  baseTree: string
  treePath: string
  treeSha: string
}

export type CreateCommitCallParams = {
  parentCommitSha: NonNullable<CreateCommitParams['parents']>[number]
  treeSha: CreateCommitParams['tree']
  message: CreateCommitParams['message']
}

export type UploadImageCallParams = {
  content: string
  path: string
}

type AppRPCCalls = {
  'settings.get': {
    params: void
    result: Settings
  }
  'repo.get': {
    params: void
    result: RestRepo
  }
  'labels.list': {
    params: void
    result: MinimalLabels
  }
  'labels.create': {
    params: CreateLabelCallParams
    result: MinimalLabel
  }
  'labels.delete': {
    params: DeleteLabelCallParams
    result: void
  }
  'labels.update': {
    params: UpdateLabelCallParams
    result: MinimalLabel
  }
  'issues.count': {
    params: void
    result: number
  }
  'issues.count-with-filter': {
    params: GetIssueCountWithFilterCallParams
    result: number
  }
  'issues.list': {
    params: GetIssuesCallParams
    result: MinimalIssues
  }
  'issues.list-with-filter': {
    params: GetIssuesWithFilterCallParams
    result: MinimalIssues
  }
  'issues.create': {
    params: CreateIssueCallParams
    result: MinimalIssue
  }
  'issues.update': {
    params: UpdateIssueCallParams
    result: MinimalIssue
  }
  'git.ref.get': {
    params: void
    result: RestRef
  }
  'git.ref.update': {
    params: UpdateRefCallParams
    result: RestRef
  }
  'git.commit.get': {
    params: GetCommitCallParams
    result: RestCommit
  }
  'git.commit.create': {
    params: CreateCommitCallParams
    result: RestCommit
  }
  'git.blob.create': {
    params: CreateBlobCallParams
    result: RestBlob
  }
  'git.tree.create': {
    params: CreateTreeCallParams
    result: RestTree
  }
  'images.upload': {
    params: UploadImageCallParams
    result: string
  }
}

type AppRPCNotifications = {
  'external-link.open': {
    payload: {
      url: string
    }
  }
}

type EmptyEvents = Record<string, never>

export type AppRPC = RPCDefinition<AppRPCCalls, AppRPCNotifications, EmptyEvents>
