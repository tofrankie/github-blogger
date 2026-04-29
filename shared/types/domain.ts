export type SettingKey = 'token' | 'user' | 'repo' | 'branch'

export type Settings = {
  [K in SettingKey]: string
}

export type GitHubNodeId = string

export type ISODateString = string

export interface MinimalLabel {
  id: GitHubNodeId
  name: string
  color: string
  description: string | null
}

export type MinimalLabels = MinimalLabel[]

export interface MinimalIssue {
  id: GitHubNodeId
  number: number
  url: string
  title: string
  body: string
  createdAt: ISODateString
  updatedAt: ISODateString
  labels: MinimalLabels
}

export type MinimalIssues = MinimalIssue[]
