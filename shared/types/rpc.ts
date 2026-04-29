import type {
  CreateIssueParams,
  CreateLabelParams,
  UpdateIssueParams,
  UpdateLabelParams,
} from './rest'

export type LabelNamesJsonString = string

export type GetIssuesRpcArgs = [page: number, labels: string[]]

export type GetIssuesWithFilterRpcArgs = [after: string | null, labels: string[], title: string]

export type GetIssueCountWithFilterRpcArgs = [title: string, labels: string[]]

export type CreateIssueRpcArgs = [
  title: CreateIssueParams['title'],
  body: CreateIssueParams['body'],
  labelsJson: LabelNamesJsonString,
]

export type UpdateIssueRpcArgs = [
  issueNumber: UpdateIssueParams['issue_number'],
  title: UpdateIssueParams['title'],
  body: UpdateIssueParams['body'],
  labelsJson: LabelNamesJsonString,
]

export type UpdateLabelRpcArgs = [
  newName: UpdateLabelParams['new_name'],
  name: UpdateLabelParams['name'],
  color: UpdateLabelParams['color'],
  description: UpdateLabelParams['description'],
]

export type CreateLabelRpcArgs = [
  name: CreateLabelParams['name'],
  color: CreateLabelParams['color'],
  description: CreateLabelParams['description'],
]

export type DeleteLabelRpcArgs = [name: string]

export type GetLabelsRpcArgs = [page?: number, perPage?: number]

export type GetCommitRpcArgs = [commitSha: string]

export type UpdateRefRpcArgs = [sha: string]

export type CreateBlobRpcArgs = [content: string]

export type CreateTreeRpcArgs = [baseTree: string, treePath: string, treeSha: string]

export type CreateCommitRpcArgs = [parentsCommitSha: string, treeSha: string, message: string]

export type UploadImageRpcArgs = [content: string, path: string]
