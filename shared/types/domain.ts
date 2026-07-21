export const COLOR_MODE = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
} as const

export type ColorMode = (typeof COLOR_MODE)[keyof typeof COLOR_MODE]

export type SettingKey = 'token' | 'user' | 'repo' | 'branch' | 'color-mode'

export interface Settings {
  token: string
  user: string
  repo: string
  branch: string
  'color-mode': ColorMode
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
