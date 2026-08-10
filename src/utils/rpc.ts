import type { RPCCallMethodArgs, RPCCallParams, RPCClient } from '@tofrankie/vscode-webview-rpc'
import type { ClientUploadImagesResult } from '@/types'
import type {
  ApiError,
  ApiRequestErrorDetail,
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
  MinimalIssue,
  MinimalIssues,
  MinimalLabel,
  MinimalLabels,
  RestRepo,
  UpdateColorModeCallParams,
  UpdateIssueCallParams,
  UpdateLabelCallParams,
  UpdateRefCallParams,
} from '~/types'
import { createWebviewRPC, RPCRemoteError } from '@tofrankie/vscode-webview-rpc'
import dayjs from 'dayjs'
import { encode } from 'js-base64'
import { ERROR_TYPE_MAP, SUBMIT_TYPE } from '@/constants'
import { checkFileSize, generateMarkdown, getVscode } from '@/utils'
import { DEFAULT_PAGINATION_SIZE, ERROR_TYPE } from '~/constants'

let rpc: RPCClient<AppRPC> | null = null

export function initRpc(): RPCClient<AppRPC> {
  const instance = createWebviewRPC<AppRPC>(getVscode(), {
    timeout: 10_000,
  })

  rpc = instance
  return instance
}

export function getRpc(): RPCClient<AppRPC> {
  if (!rpc) {
    throw new Error('RPC has not been initialized')
  }

  return rpc
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isApiRequestErrorDetail(value: unknown): value is ApiRequestErrorDetail {
  if (!isObject(value)) {
    return false
  }

  const request = value.request
  if (!isObject(request)) {
    return false
  }

  const method = request.method

  return (
    typeof value.status === 'number' &&
    typeof request.url === 'string' &&
    (method === undefined || typeof method === 'string')
  )
}

function isApiError(value: unknown): value is ApiError {
  if (!isObject(value)) {
    return false
  }

  if (typeof value.type !== 'string' || typeof value.message !== 'string') {
    return false
  }

  if (!Object.values(ERROR_TYPE).includes(value.type as ApiError['type'])) {
    return false
  }

  if (value.type === ERROR_TYPE.UNKNOWN) {
    return true
  }

  return isApiRequestErrorDetail(value.detail)
}

export class RpcError extends Error {
  readonly apiError: ApiError

  constructor(apiError: ApiError) {
    super(`${ERROR_TYPE_MAP[apiError.type]}: ${apiError.message}`)
    this.name = 'RpcError'
    this.apiError = apiError
  }
}

function toRpcError(error: unknown): Error {
  if (!(error instanceof RPCRemoteError)) {
    return error instanceof Error ? error : new Error(String(error))
  }

  const payload = error.data
  if (!isObject(payload)) {
    return error
  }

  const apiError = (payload as { apiError?: unknown }).apiError
  if (isApiError(apiError)) {
    return new RpcError(apiError)
  }

  return error
}

async function rpcCall<TMethod extends keyof AppRPC['calls']>(
  method: TMethod,
  ...args: RPCCallMethodArgs<RPCCallParams<AppRPC['calls'], TMethod>>
): Promise<AppRPC['calls'][TMethod]['result']> {
  try {
    return await getRpc().call(method, ...args)
  } catch (error) {
    throw toRpcError(error)
  }
}

export function notifyOpenExternalLink(url: string): void {
  getRpc().notify('external-link.open', { url })
}

export async function getSettings() {
  return rpcCall('settings.get')
}

export async function updateColorMode(params: UpdateColorModeCallParams): Promise<void> {
  await rpcCall('settings.color-mode.update', params)
}

export async function getRepo(): Promise<RestRepo> {
  return rpcCall('repo.get')
}

export async function getLabels(): Promise<MinimalLabels> {
  return rpcCall('labels.list')
}

export async function createLabel(label: Omit<MinimalLabel, 'id'>): Promise<MinimalLabel> {
  const params: CreateLabelCallParams = {
    name: label.name,
    color: label.color,
    description: label.description ?? undefined,
  }

  return rpcCall('labels.create', params)
}

export async function deleteLabel(name: string): Promise<void> {
  const params: DeleteLabelCallParams = { name }
  await rpcCall('labels.delete', params)
}

export async function updateLabel(
  newLabel: Omit<MinimalLabel, 'id'>,
  oldLabel: MinimalLabel
): Promise<MinimalLabel> {
  const params: UpdateLabelCallParams = {
    newName: newLabel.name !== oldLabel.name ? newLabel.name : undefined,
    name: oldLabel.name,
    color: newLabel.color,
    description: newLabel.description ?? undefined,
  }

  return rpcCall('labels.update', params)
}

export async function getIssueCount(): Promise<number> {
  return rpcCall('issues.count')
}

export async function getIssueCountWithFilter(
  filterTitle: string,
  filterLabelNames: string[] = []
): Promise<number> {
  if (!filterTitle && filterLabelNames.length === 0) {
    return getIssueCount()
  }

  const params: GetIssueCountWithFilterCallParams = {
    title: filterTitle,
    labels: filterLabelNames,
  }

  return rpcCall('issues.count-with-filter', params)
}

export async function getIssues(
  page: number = 1,
  labels: string[] = [],
  title: string = ''
): Promise<MinimalIssues> {
  const useRest = !title && labels.length <= 1

  if (useRest) {
    const params: GetIssuesCallParams = { page, labels }
    return rpcCall('issues.list', params)
  }

  const offset = (page - 1) * DEFAULT_PAGINATION_SIZE
  const after = page > 1 ? encode(`cursor:${offset}`) : null
  const params: GetIssuesWithFilterCallParams = {
    after,
    labels,
    title,
  }

  return rpcCall('issues.list-with-filter', params)
}

export async function createIssue(params: MinimalIssue): Promise<MinimalIssue> {
  const payload: CreateIssueCallParams = {
    title: params.title,
    body: params.body,
    labelNames: params.labels.map(label => label.name),
  }

  return rpcCall('issues.create', payload)
}

export async function updateIssue(params: MinimalIssue): Promise<MinimalIssue> {
  const payload: UpdateIssueCallParams = {
    issueNumber: params.number,
    title: params.title,
    body: params.body,
    labelNames: params.labels.map(label => label.name),
  }

  return rpcCall('issues.update', payload)
}

type SubmitType = (typeof SUBMIT_TYPE)[keyof typeof SUBMIT_TYPE]

export async function archiveIssue(issue: MinimalIssue, type: SubmitType): Promise<void> {
  const { number: issueNumber, createdAt } = issue

  if (!Number.isInteger(issueNumber)) return

  const refResult = await rpcCall('git.ref.get')
  const commitSha = refResult.object.sha

  const commitParams: GetCommitCallParams = { commitSha }
  const commitResult = await rpcCall('git.commit.get', commitParams)
  const treeSha = commitResult.tree.sha

  const markdown = generateMarkdown(issue)
  const blobParams: CreateBlobCallParams = { content: markdown }
  const blobResult = await rpcCall('git.blob.create', blobParams)
  const blobSha = blobResult.sha

  const year = dayjs(createdAt).year()
  const filePath = `archives/${year}/${issueNumber}.md`
  const treeParams: CreateTreeCallParams = {
    baseTree: treeSha,
    treePath: filePath,
    treeSha: blobSha,
  }
  const newTreeResult = await rpcCall('git.tree.create', treeParams)
  const newTreeSha = newTreeResult.sha

  const commitMessage =
    type === SUBMIT_TYPE.CREATE
      ? `docs: create issue ${issueNumber}`
      : `docs: update issue ${issueNumber}`
  const createCommitParams: CreateCommitCallParams = {
    parentCommitSha: commitSha,
    treeSha: newTreeSha,
    message: commitMessage,
  }
  const newCommitResult = await rpcCall('git.commit.create', createCommitParams)

  const updateRefParams: UpdateRefCallParams = {
    sha: newCommitResult.sha,
  }
  await rpcCall('git.ref.update', updateRefParams)
}

export async function uploadImages(files: File[]): Promise<ClientUploadImagesResult> {
  if (files.length === 0) {
    throw new Error('No images selected')
  }

  const results: ClientUploadImagesResult = []

  for (const img of files) {
    const isLt2M = checkFileSize(img)
    if (!isLt2M) {
      throw new Error(`Image ${img.name} exceeds 2MB limit`)
    }

    const dayjsObj = dayjs()
    const year = dayjsObj.year()
    const month = dayjsObj.month() + 1
    const timestamp = dayjsObj.valueOf()
    const ext = img.name.split('.').pop()?.toLowerCase()
    const path = `images/${year}/${month}/${timestamp}.${ext}`

    try {
      const result = await new Promise<ClientUploadImagesResult[number]>((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.readAsDataURL(img)

        fileReader.onloadend = () => {
          const content = fileReader.result?.toString().split(',')[1]
          if (!content) {
            reject(new Error(`Failed to read ${img.name}`))
            return
          }

          getRpc()
            .call('images.upload', { content, path })
            .then(url => resolve({ url }))
            .catch(error => reject(toRpcError(error)))
        }
      })
      results.push(result)
    } catch (error) {
      console.error(`Failed to upload ${img.name}:`, error)
    }
  }

  if (results.length === 0) {
    throw new Error('Image upload failed')
  }

  return results
}
