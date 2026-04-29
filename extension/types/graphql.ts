import type { GitHubNodeId, ISODateString } from '~/types'

export type GraphqlResponse<T> = Promise<T>

export type GraphqlData<T> = T

export type GraphqlDataItem<T> = T extends Array<infer U> ? U : never

export interface GraphqlLabelNode {
  id: GitHubNodeId
  name: string
  color: string
  description: string | null
}

export interface GraphqlIssue {
  id: GitHubNodeId
  number: number
  url: string
  title: string
  body: string
  createdAt: ISODateString
  updatedAt: ISODateString
  labels: {
    nodes: GraphqlLabelNode[]
  }
  repository: {
    nameWithOwner: string
  }
}

export interface GraphqlIssueCountResponse {
  repository: {
    issues: {
      totalCount: number
    }
  }
}

export interface GraphqlIssueCountWithFilterResponse {
  search: {
    issueCount: number
  }
}

export interface GraphqlIssuesResponse {
  search: {
    issueCount: number
    edges: Array<{
      node: GraphqlIssue
    }>
  }
}
