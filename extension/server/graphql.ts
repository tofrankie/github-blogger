interface IssueCountParams {
  /** GitHub 用户名 */
  username: string
  /** GitHub 仓库名 */
  repository: string
}

interface _IssueCountParamsWithFilter extends IssueCountParams {
  /** 标签名称，多个标签用逗号分隔 */
  labels?: string
  /** 标题关键词 */
  title?: string
}

interface _IssueParamsWithFilter extends IssueCountParams {
  /** 每页数量 */
  first?: number
  /** 标签名称，多个标签用逗号分隔 */
  labels?: string
  /** 标题关键词 */
  title?: string
  /** 分页游标 */
  cursor?: string
}

export function getIssueCount({ username, repository }: IssueCountParams) {
  return `
    query {
      repository(
        owner: "${username}"
        name: "${repository}"
      ) {
        issues(states: OPEN) {
          totalCount
        }
      }
    }
  `
}

export function getIssueCountWithFilter() {
  return `
    query IssueCountWithFilter(
      $queryStr: String!
    ) {
      search(
        type: ISSUE
        query: $queryStr
      ) {
        issueCount
      }
    }
  `
}

export function getIssuesWithFilter() {
  return `
    query IssuesWithFilter(
      $first: Int!
      $after: String
      $queryStr: String!
    ) {
      search(
        type: ISSUE
        first: $first
        after: $after
        query: $queryStr
      ) {
        edges {
          node {
            ... on Issue {
              id
              number
              url
              title
              body
              createdAt
              updatedAt
              labels(first: 100) {
                nodes {
                  id
                  name
                  color
                  description
                }
              }
              repository {
                nameWithOwner
              }
            }
          }
        }
      }
    }
  `
}
