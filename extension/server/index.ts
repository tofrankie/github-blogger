import type { Webview } from 'vscode'
import type {
  GraphqlIssueCountResponse,
  GraphqlIssueCountWithFilterResponse,
  GraphqlIssuesResponse,
} from '@/types'
import type {
  CreateBlobParams,
  CreateBlobRpcArgs,
  CreateCommitParams,
  CreateCommitRpcArgs,
  CreateIssueParams,
  CreateIssueRpcArgs,
  CreateLabelRpcArgs,
  CreateTreeParams,
  CreateTreeRpcArgs,
  DeleteLabelRpcArgs,
  GetCommitParams,
  GetCommitRpcArgs,
  GetIssueCountWithFilterRpcArgs,
  GetIssuesRpcArgs,
  GetIssuesWithFilterRpcArgs,
  Settings,
  UpdateIssueParams,
  UpdateIssueRpcArgs,
  UpdateLabelParams,
  UpdateLabelRpcArgs,
  UpdateRefParams,
  UpdateRefRpcArgs,
} from '~/types'

import { Octokit } from '@octokit/core'
import { isEmpty } from 'licia'
import { ExtensionRPC } from 'vscode-webview-rpc'
import { APIS } from '@/constants'
import * as graphqlQuery from '@/server/graphql'
import { cdnURL, getSettings, to } from '@/utils'
import {
  normalizeIssueFromGraphql,
  normalizeIssueFromRest,
  normalizeLabelFromRest,
} from '@/utils/normalize'
import { createResponse } from '@/utils/response'
import { DEFAULT_PAGINATION_SIZE, MESSAGE_TYPE } from '~/constants'

export default class Service {
  public config: Settings
  public octokit: Octokit
  public webview: Webview
  public rpc: ExtensionRPC

  constructor(webview: Webview) {
    this.webview = webview
    this.config = {} as Settings
    this.octokit = {} as Octokit
    this.rpc = new ExtensionRPC(this.webview)
    this.init()
  }

  private async init() {
    this.config = getSettings({ fresh: true })
    this.octokit = new Octokit({ auth: this.config.token })
    this.registerRpcListener()
  }

  private async getLabels() {
    const res = await to(
      this.octokit.request(APIS.GET_LABELS, {
        owner: this.config.user,
        repo: this.config.repo,
        page: 0,
        per_page: 100,
      })
    )

    return createResponse(res, octokitRes =>
      octokitRes.data.map(label => normalizeLabelFromRest(label))
    )
  }

  private async createLabel(...args: CreateLabelRpcArgs) {
    const [name, color, description] = args

    const res = await to(
      this.octokit.request(APIS.CREATE_LABEL, {
        owner: this.config.user,
        repo: this.config.repo,
        name,
        color,
        description: description ?? '',
      })
    )

    return createResponse(res, octokitRes => normalizeLabelFromRest(octokitRes.data))
  }

  private async deleteLabel(...args: DeleteLabelRpcArgs) {
    const [name] = args

    const res = await to(
      this.octokit.request(APIS.DELETE_LABEL, {
        owner: this.config.user,
        repo: this.config.repo,
        name,
      })
    )

    return createResponse(res)
  }

  private async updateLabel(...args: UpdateLabelRpcArgs) {
    const [newName, name, color, description] = args

    const params: UpdateLabelParams = {
      new_name: newName,
      name,
      color,
      description,
    }
    const res = await to(
      this.octokit.request(APIS.UPDATE_LABEL, {
        owner: this.config.user,
        repo: this.config.repo,
        ...params,
      })
    )

    return createResponse(res, octokitRes => normalizeLabelFromRest(octokitRes.data))
  }

  private async getIssues(...args: GetIssuesRpcArgs) {
    const [page, labels] = args

    const res = await to(
      this.octokit.request(APIS.GET_ISSUES, {
        owner: this.config.user,
        repo: this.config.repo,
        per_page: DEFAULT_PAGINATION_SIZE,
        page,
        labels: labels.join(',') || undefined,
      })
    )

    return createResponse(res, octokitRes =>
      octokitRes.data.map(issue => normalizeIssueFromRest(issue))
    )
  }

  private async getIssuesWithFilter(...args: GetIssuesWithFilterRpcArgs) {
    const [after, labels, title] = args

    const queryParts = {
      sort: 'sort:created-desc',
      user: `user:${this.config.user}`,
      repo: `repo:${this.config.repo}`,
      state: 'state:open',
      label: isEmpty(labels) ? undefined : `label:${labels.join(',')}`,
      title: title ? `in:title ${title}` : '',
    }

    const variables = {
      first: DEFAULT_PAGINATION_SIZE,
      after: after || undefined,
      queryStr: Object.values(queryParts).filter(Boolean).join(' '),
    }

    const res = await to(
      this.octokit.graphql<GraphqlIssuesResponse>(graphqlQuery.getIssuesWithFilter(), variables)
    )

    const repoNameWithOwner = `${this.config.user}/${this.config.repo}`

    return createResponse(res, octokitRes =>
      octokitRes.search.edges
        .filter(edge => edge.node.repository.nameWithOwner === repoNameWithOwner)
        .map(edge => normalizeIssueFromGraphql(edge.node))
    )
  }

  private async updateIssue(...args: UpdateIssueRpcArgs) {
    const [issueNumber, title, body, labelsJson] = args

    const params: UpdateIssueParams = {
      issue_number: issueNumber,
      title,
      body,
      labels: parseLabelNames(labelsJson),
    }
    const res = await to(
      this.octokit.request(APIS.UPDATE_ISSUE, {
        owner: this.config.user,
        repo: this.config.repo,
        ...params,
      })
    )

    return createResponse(res, octokitRes => normalizeIssueFromRest(octokitRes.data))
  }

  private async createIssue(...args: CreateIssueRpcArgs) {
    const [title, body, labelsJson] = args

    const params: CreateIssueParams = {
      title,
      body,
      labels: parseLabelNames(labelsJson),
    }
    const res = await to(
      this.octokit.request(APIS.CREATE_ISSUE, {
        owner: this.config.user,
        repo: this.config.repo,
        ...params,
      })
    )

    return createResponse(res, octokitRes => normalizeIssueFromRest(octokitRes.data))
  }

  private async uploadImage(content: string, path: string) {
    const res = await to(
      this.octokit.request(APIS.UPLOAD_IMAGE, {
        owner: this.config.user,
        repo: this.config.repo,
        branch: this.config.branch,
        message: 'chore: upload image',
        content,
        path,
      })
    )

    return createResponse(res, () =>
      cdnURL({
        user: this.config.user,
        repo: this.config.repo,
        branch: this.config.branch,
        filePath: path,
      })
    )
  }

  private async getIssueCount() {
    const res = await to(
      this.octokit.graphql<GraphqlIssueCountResponse>(
        graphqlQuery.getIssueCount({
          username: this.config.user,
          repository: this.config.repo,
        })
      )
    )

    return createResponse(res, octokitRes => octokitRes.repository.issues.totalCount)
  }

  private async getIssueCountWithFilter(...args: GetIssueCountWithFilterRpcArgs) {
    const [title, labels] = args

    const queryParts = {
      sort: 'sort:created-desc',
      user: `user:${this.config.user}`,
      repo: `repo:${this.config.repo}`,
      state: 'state:open',
      label: isEmpty(labels) ? undefined : `label:${labels.join(',')}`,
      title: title ? `in:title ${title}` : '',
    }

    const variables = {
      queryStr: Object.values(queryParts).filter(Boolean).join(' '),
    }

    const res = await to<GraphqlIssueCountWithFilterResponse>(
      this.octokit.graphql(graphqlQuery.getIssueCountWithFilter(), variables)
    )

    return createResponse(res, octokitRes => octokitRes.search.issueCount)
  }

  private async getRef() {
    const res = await to(
      this.octokit.request(APIS.GET_REF, {
        owner: this.config.user,
        repo: this.config.repo,
        ref: `heads/${this.config.branch}`,
      })
    )

    return createResponse(res, octokitRes => octokitRes.data)
  }

  private async getCommit(...args: GetCommitRpcArgs) {
    const [commitSha] = args

    const params: GetCommitParams = {
      commit_sha: commitSha,
    }
    const res = await to(
      this.octokit.request(APIS.GET_COMMIT, {
        owner: this.config.user,
        repo: this.config.repo,
        ...params,
      })
    )

    return createResponse(res, octokitRes => octokitRes.data)
  }

  private async createBlob(...args: CreateBlobRpcArgs) {
    const [content] = args

    const params: CreateBlobParams = {
      content,
    }
    const res = await to(
      this.octokit.request(APIS.CREATE_BLOB, {
        owner: this.config.user,
        repo: this.config.repo,
        ...params,
      })
    )

    return createResponse(res, octokitRes => octokitRes.data)
  }

  private async createTree(...args: CreateTreeRpcArgs) {
    const [baseTree, treePath, treeSha] = args

    const params: CreateTreeParams = {
      base_tree: baseTree,
      tree: [{ path: treePath, mode: '100644', type: 'blob', sha: treeSha }],
    }
    const res = await to(
      this.octokit.request(APIS.CREATE_TREE, {
        owner: this.config.user,
        repo: this.config.repo,
        ...params,
      })
    )

    return createResponse(res, octokitRes => octokitRes.data)
  }

  private async createCommit(...args: CreateCommitRpcArgs) {
    const [parentCommitSha, treeSha, message] = args

    const params: CreateCommitParams = {
      parents: [parentCommitSha],
      tree: treeSha,
      message,
    }
    const res = await to(
      this.octokit.request(APIS.CREATE_COMMIT, {
        owner: this.config.user,
        repo: this.config.repo,
        ...params,
      })
    )

    return createResponse(res, octokitRes => octokitRes.data)
  }

  private async updateRef(...args: UpdateRefRpcArgs) {
    const [sha] = args

    const params: UpdateRefParams = {
      sha,
    }
    const res = await to(
      this.octokit.request(APIS.UPDATE_REF, {
        owner: this.config.user,
        repo: this.config.repo,
        ref: `heads/${this.config.branch}`,
        ...params,
      })
    )

    return createResponse(res, octokitRes => octokitRes.data)
  }

  private async getRepo() {
    const res = await to(
      this.octokit.request(APIS.GET_REPO, {
        owner: this.config.user,
        repo: this.config.repo,
      })
    )

    return createResponse(res, octokitRes => octokitRes.data)
  }

  private registerRpcListener() {
    const labelHandlers = {
      [MESSAGE_TYPE.GET_LABELS]: this.getLabels,
      [MESSAGE_TYPE.DELETE_LABEL]: this.deleteLabel,
      [MESSAGE_TYPE.CREATE_LABEL]: this.createLabel,
      [MESSAGE_TYPE.UPDATE_LABEL]: this.updateLabel,
    }

    const issueHandlers = {
      [MESSAGE_TYPE.GET_ISSUES]: this.getIssues,
      [MESSAGE_TYPE.GET_ISSUES_WITH_FILTER]: this.getIssuesWithFilter,
      [MESSAGE_TYPE.UPDATE_ISSUE]: this.updateIssue,
      [MESSAGE_TYPE.CREATE_ISSUE]: this.createIssue,
      [MESSAGE_TYPE.GET_ISSUE_COUNT]: this.getIssueCount,
      [MESSAGE_TYPE.GET_ISSUE_COUNT_WITH_FILTER]: this.getIssueCountWithFilter,
    }

    const gitHandlers = {
      [MESSAGE_TYPE.GET_REF]: this.getRef,
      [MESSAGE_TYPE.UPDATE_REF]: this.updateRef,
      [MESSAGE_TYPE.GET_COMMIT]: this.getCommit,
      [MESSAGE_TYPE.CREATE_COMMIT]: this.createCommit,
      [MESSAGE_TYPE.CREATE_BLOB]: this.createBlob,
      [MESSAGE_TYPE.CREATE_TREE]: this.createTree,
    }

    const otherHandlers = {
      [MESSAGE_TYPE.GET_REPO]: this.getRepo,
      [MESSAGE_TYPE.UPLOAD_IMAGE]: this.uploadImage,
    }

    Object.entries({
      ...labelHandlers,
      ...issueHandlers,
      ...gitHandlers,
      ...otherHandlers,
    }).forEach(([type, handler]) => {
      this.rpc.on(type, handler.bind(this))
    })
  }
}

function parseLabelNames(raw: string): string[] {
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.filter((item): item is string => typeof item === 'string')
}
