import {Octokit} from '@octokit/core'
import {ExtensionRPC} from 'vscode-webview-rpc'
import {isEmpty} from 'licia'
import * as vscode from 'vscode'

import {MESSAGE_TYPE} from '../constants'
import {APIS, DEFAULT_PAGINATION_SIZE} from '../constants'
import {getSettings, to, cdnURL} from '../utils'
import {createResponse} from '../utils/response'
import {
  normalizeIssueFromGraphql,
  normalizeIssueFromRest,
  normalizeLabelFromRest,
} from '../utils/normalize'
import * as graphqlQuery from './graphql'

export default class Service {
  public config: Settings
  public octokit: Octokit
  public webview: vscode.Webview
  public rpc: ExtensionRPC

  constructor(webview: vscode.Webview) {
    this.webview = webview
    this.config = {} as Settings
    this.octokit = {} as Octokit
    this.rpc = new ExtensionRPC(this.webview)
    this.init()
  }

  private async init() {
    this.config = getSettings()
    this.octokit = new Octokit({auth: this.config.token})
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
    const res = await to(
      this.octokit.request(APIS.CREATE_LABEL, {
        owner: this.config.user,
        repo: this.config.repo,
        name: args[0],
        color: args[1],
        description: args[2] ?? '',
      })
    )

    return createResponse(res, octokitRes => normalizeLabelFromRest(octokitRes.data))
  }

  private async deleteLabel(...args: DeleteLabelRpcArgs) {
    const res = await to(
      this.octokit.request(APIS.DELETE_LABEL, {
        owner: this.config.user,
        repo: this.config.repo,
        name: args[0],
      })
    )

    return createResponse(res)
  }

  private async updateLabel(...args: UpdateLabelRpcArgs) {
    const params: UpdateLabelParams = {
      new_name: args[0],
      name: args[1],
      color: args[2],
      description: args[3],
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
    const res = await to(
      this.octokit.request(APIS.GET_ISSUES, {
        owner: this.config.user,
        repo: this.config.repo,
        per_page: DEFAULT_PAGINATION_SIZE,
        page: args[0],
        labels: args[1].join(',') || undefined,
      })
    )

    return createResponse(res, octokitRes =>
      octokitRes.data.map(issue => normalizeIssueFromRest(issue))
    )
  }

  private async getIssuesWithFilter(...args: GetIssuesWithFilterRpcArgs) {
    const queryParts = {
      sort: 'sort:created-desc',
      user: `user:${this.config.user}`,
      repo: `repo:${this.config.repo}`,
      state: 'state:open',
      label: isEmpty(args[1]) ? undefined : `label:${args[1].join(',')}`,
      title: args[2] ? `in:title ${args[2]}` : '',
    }

    const variables = {
      first: DEFAULT_PAGINATION_SIZE,
      after: args[0] || undefined,
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
    const params: UpdateIssueParams = {
      issue_number: args[0],
      title: args[1],
      body: args[2],
      labels: JSON.parse(args[3]),
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
    const params: CreateIssueParams = {
      title: args[0],
      body: args[1],
      labels: JSON.parse(args[2]),
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
    const queryParts = {
      sort: 'sort:created-desc',
      user: `user:${this.config.user}`,
      repo: `repo:${this.config.repo}`,
      state: 'state:open',
      label: isEmpty(args[1]) ? undefined : `label:${args[1].join(',')}`,
      title: args[0] ? `in:title ${args[0]}` : '',
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
    const params: GetCommitParams = {
      commit_sha: args[0],
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
    const params: CreateBlobParams = {
      content: args[0],
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
    const params: CreateTreeParams = {
      base_tree: args[0],
      tree: [{path: args[1], mode: '100644', type: 'blob', sha: args[2]}],
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
    const params: CreateCommitParams = {
      parents: [args[0]],
      tree: args[1],
      message: args[2],
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
    const params: UpdateRefParams = {
      sha: args[0],
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
