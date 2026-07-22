import type { COLOR_MODE, SETTING_KEY } from '~/constants'

export type ColorMode = (typeof COLOR_MODE)[keyof typeof COLOR_MODE]

export type SettingKey = (typeof SETTING_KEY)[keyof typeof SETTING_KEY]

export interface Settings {
  [SETTING_KEY.TOKEN]: string
  [SETTING_KEY.USER]: string
  [SETTING_KEY.REPO]: string
  [SETTING_KEY.BRANCH]: string
  [SETTING_KEY.COLOR_MODE]: ColorMode
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
