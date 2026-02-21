export {}

declare global {
  type GraphqlResponse<T> = Promise<T>

  type GraphqlData<T> = T

  type GraphqlDataItem<T> = T extends Array<infer U> ? U : never

  interface GraphqlIssueCountResponse {
    repository: {
      issues: {
        totalCount: number
      }
    }
  }

  interface GraphqlIssueCountWithFilterResponse {
    search: {
      issueCount: number
    }
  }

  interface GraphqlIssuesResponse {
    search: {
      issueCount: number
      edges: Array<{
        node: GraphqlIssue
      }>
    }
  }

  interface GraphqlIssue {
    id: string
    number: number
    url: string
    title: string
    body: string
    createdAt: string
    updatedAt: string
    labels: {
      nodes: {
        id: string
        name: string
        color: string
        description: string | null
      }[]
    }
    repository: {
      nameWithOwner: string
    }
  }
}
