import type { RPCClient } from '@tofrankie/vscode-webview-rpc'
import type { Webview } from 'vscode'
import type {
  GraphqlIssueCountResponse,
  GraphqlIssueCountWithFilterResponse,
  GraphqlIssuesResponse,
} from '@/types'

import type {
  AppRPC,
  CreateBlobCallParams,
  CreateCommitCallParams,
  CreateIssueCallParams,
  CreateLabelCallParams,
  CreateTreeCallParams,
  DeleteLabelCallParams,
  GetCommitCallParams,
  GetIssueCountWithFilterCallParams,
  GetIssuesCallParams,
  GetIssuesWithFilterCallParams,
  Settings,
  UpdateColorModeCallParams,
  UpdateIssueCallParams,
  UpdateLabelCallParams,
  UpdateRefCallParams,
} from '~/types'
import { Octokit } from '@octokit/core'
import { createExtensionRPC } from '@tofrankie/vscode-webview-rpc'
import { isEmpty } from 'licia'
import { env, Uri } from 'vscode'
import { APIS } from '@/constants'
import * as graphqlQuery from '@/server/graphql'
import { cdnURL, getSettings, to, updateColorMode } from '@/utils'
import {
  normalizeIssueFromGraphql,
  normalizeIssueFromRest,
  normalizeLabelFromRest,
} from '@/utils/normalize'
import { createResponse } from '@/utils/response'
import { DEFAULT_PAGINATION_SIZE } from '~/constants'

export default class Service {
  public config: Settings
  public octokit: Octokit
  public webview: Webview
  public rpc: RPCClient<AppRPC>

  constructor(webview: Webview) {
    this.webview = webview
    this.config = getSettings({ fresh: true })
    this.octokit = new Octokit({ auth: this.config.token })
    this.rpc = createExtensionRPC<AppRPC>(this.webview, {
      calls: {
        'settings.get': () => getSettings({ fresh: true }),
        'settings.color-mode.update': async params => this.updateColorMode(params),
        'repo.get': async () => this.getRepo(),
        'labels.list': async () => this.getLabels(),
        'labels.create': async params => this.createLabel(params),
        'labels.delete': async params => this.deleteLabel(params),
        'labels.update': async params => this.updateLabel(params),
        'issues.count': async () => this.getIssueCount(),
        'issues.count-with-filter': async params => this.getIssueCountWithFilter(params),
        'issues.list': async params => this.getIssues(params),
        'issues.list-with-filter': async params => this.getIssuesWithFilter(params),
        'issues.create': async params => this.createIssue(params),
        'issues.update': async params => this.updateIssue(params),
        'git.ref.get': async () => this.getRef(),
        'git.ref.update': async params => this.updateRef(params),
        'git.commit.get': async params => this.getCommit(params),
        'git.commit.create': async params => this.createCommit(params),
        'git.blob.create': async params => this.createBlob(params),
        'git.tree.create': async params => this.createTree(params),
        'images.upload': async params => this.uploadImage(params),
      },
      notifications: {
        'external-link.open': ({ url }) => {
          void env.openExternal(Uri.parse(url))
        },
      },
    })
  }

  private async updateColorMode({ colorMode }: UpdateColorModeCallParams): Promise<void> {
    await updateColorMode(colorMode)
    this.config = getSettings({ fresh: true })
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

  private async createLabel({ name, color, description }: CreateLabelCallParams) {
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

  private async deleteLabel({ name }: DeleteLabelCallParams) {
    const res = await to(
      this.octokit.request(APIS.DELETE_LABEL, {
        owner: this.config.user,
        repo: this.config.repo,
        name,
      })
    )

    createResponse(res)
  }

  private async updateLabel({ newName, name, color, description }: UpdateLabelCallParams) {
    const params = {
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

  private async getIssues({ page, labels }: GetIssuesCallParams) {
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

  private async getIssuesWithFilter({ after, labels, title }: GetIssuesWithFilterCallParams) {
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

  private async updateIssue({ issueNumber, title, body, labelNames }: UpdateIssueCallParams) {
    const params = {
      issue_number: issueNumber,
      title,
      body,
      labels: labelNames,
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

  private async createIssue({ title, body, labelNames }: CreateIssueCallParams) {
    const params = {
      title,
      body,
      labels: labelNames,
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

  private async uploadImage({ content, path }: { content: string; path: string }) {
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

  private async getIssueCountWithFilter({ title, labels }: GetIssueCountWithFilterCallParams) {
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

  private async getCommit({ commitSha }: GetCommitCallParams) {
    const params = {
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

  private async createBlob({ content }: CreateBlobCallParams) {
    const params = {
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

  private async createTree({ baseTree, treePath, treeSha }: CreateTreeCallParams) {
    const params = {
      base_tree: baseTree,
      tree: [{ path: treePath, mode: '100644' as const, type: 'blob' as const, sha: treeSha }],
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

  private async createCommit({ parentCommitSha, treeSha, message }: CreateCommitCallParams) {
    const params = {
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

  private async updateRef({ sha }: UpdateRefCallParams) {
    const params = {
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

  public dispose(): void {
    this.rpc.dispose()
  }
}
