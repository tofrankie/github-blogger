import type { Webview as VSCodeWebview } from 'vscode'
import type { ClientUploadImagesResult } from '@/types'
import type {
  ApiError,
  ApiRequestErrorDetail,
  ApiResponse,
  CreateIssueRpcArgs,
  CreateLabelRpcArgs,
  GetIssuesRpcArgs,
  GetIssuesWithFilterRpcArgs,
  MinimalIssue,
  MinimalIssues,
  MinimalLabel,
  MinimalLabels,
  RestBlob,
  RestCommit,
  RestRef,
  RestRepo,
  RestTree,
  UpdateIssueRpcArgs,
  UpdateLabelRpcArgs,
  ValueOf,
} from '~/types'
import dayjs from 'dayjs'
import { encode } from 'js-base64'
import { WebviewRPC } from 'vscode-webview-rpc'
import { ERROR_TYPE_MAP, SUBMIT_TYPE } from '@/constants'
import { checkFileSize, generateMarkdown, getVscode } from '@/utils'
import { DEFAULT_PAGINATION_SIZE, ERROR_TYPE, MESSAGE_TYPE } from '~/constants'

const vscode = getVscode()

export const rpc = new WebviewRPC(window, vscode as unknown as VSCodeWebview)

type RpcMessageType = ValueOf<typeof MESSAGE_TYPE>

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

  if (!Object.values(ERROR_TYPE).includes(value.type as ValueOf<typeof ERROR_TYPE>)) {
    return false
  }

  if (value.type === ERROR_TYPE.UNKNOWN) {
    return true
  }

  return isApiRequestErrorDetail(value.detail)
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!isObject(value) || typeof value.success !== 'boolean') {
    return false
  }

  if (value.success) {
    return 'data' in value && value.error === null
  }

  return value.data === null && isApiError(value.error)
}

async function rpcEmit<T>(type: RpcMessageType, args: unknown[] = []): Promise<T> {
  const payload: unknown[] = args
  const rawResponse: unknown = await rpc.emit(type, payload)

  if (!isApiResponse<T>(rawResponse)) {
    throw new Error('Invalid RPC response')
  }

  const response = rawResponse
  if (!response.success) {
    console.log('🚀 ~ client ~ rpcEmit ~ error ~ detail:', response.error?.detail)
    throw new Error(`${ERROR_TYPE_MAP[response.error.type]}: ${response.error.message}`)
  }
  return response.data
}

export async function getRepo(): Promise<RestRepo> {
  return rpcEmit<RestRepo>(MESSAGE_TYPE.GET_REPO)
}

export async function getLabels(): Promise<MinimalLabels> {
  return rpcEmit<MinimalLabels>(MESSAGE_TYPE.GET_LABELS)
}

export async function createLabel(label: Omit<MinimalLabel, 'id'>): Promise<MinimalLabel> {
  const args: CreateLabelRpcArgs = [label.name, label.color, label.description ?? undefined]
  return rpcEmit<MinimalLabel>(MESSAGE_TYPE.CREATE_LABEL, args)
}

export async function deleteLabel(name: string): Promise<void> {
  await rpcEmit<null>(MESSAGE_TYPE.DELETE_LABEL, [name])
}

export async function updateLabel(
  newLabel: Omit<MinimalLabel, 'id'>,
  oldLabel: MinimalLabel
): Promise<MinimalLabel> {
  const newLabelName = newLabel.name !== oldLabel.name ? newLabel.name : undefined
  const args: UpdateLabelRpcArgs = [
    newLabelName,
    oldLabel.name,
    newLabel.color,
    newLabel.description ?? undefined,
  ]
  return rpcEmit<MinimalLabel>(MESSAGE_TYPE.UPDATE_LABEL, args)
}

export async function getIssueCount(): Promise<number> {
  return rpcEmit<number>(MESSAGE_TYPE.GET_ISSUE_COUNT)
}

export async function getIssueCountWithFilter(
  filterTitle: string,
  filterLabelNames: string[] = []
): Promise<number> {
  if (!filterTitle && filterLabelNames.length === 0) {
    return getIssueCount()
  }

  return rpcEmit<number>(MESSAGE_TYPE.GET_ISSUE_COUNT_WITH_FILTER, [filterTitle, filterLabelNames])
}

export async function getIssues(
  page: number = 1,
  labels: string[] = [],
  title: string = ''
): Promise<MinimalIssues> {
  const useRest = !title && labels.length <= 1

  let res: MinimalIssues = []
  if (useRest) {
    const args: GetIssuesRpcArgs = [page, labels]
    res = await rpcEmit<MinimalIssues>(MESSAGE_TYPE.GET_ISSUES, args)
  } else {
    const offset = (page - 1) * DEFAULT_PAGINATION_SIZE
    const after = page > 1 ? encode(`cursor:${offset}`) : null
    const args: GetIssuesWithFilterRpcArgs = [after, labels, title]
    res = await rpcEmit<MinimalIssues>(MESSAGE_TYPE.GET_ISSUES_WITH_FILTER, args)
  }

  return res
}

export async function createIssue(params: MinimalIssue): Promise<MinimalIssue> {
  const labelNames = params.labels.map(label => label.name)
  const args: CreateIssueRpcArgs = [params.title, params.body, JSON.stringify(labelNames)]
  return rpcEmit<MinimalIssue>(MESSAGE_TYPE.CREATE_ISSUE, args)
}

export async function updateIssue(params: MinimalIssue): Promise<MinimalIssue> {
  const labelNames = params.labels.map(label => label.name)
  const args: UpdateIssueRpcArgs = [
    params.number,
    params.title,
    params.body,
    JSON.stringify(labelNames),
  ]
  return rpcEmit<MinimalIssue>(MESSAGE_TYPE.UPDATE_ISSUE, args)
}

type SubmitType = ValueOf<typeof SUBMIT_TYPE>

export async function archiveIssue(issue: MinimalIssue, type: SubmitType): Promise<void> {
  const { number: issueNumber, createdAt } = issue

  if (!Number.isInteger(issueNumber)) return

  // 1. 获取 Ref
  const refResult = await rpcEmit<RestRef>(MESSAGE_TYPE.GET_REF)
  const commitSha = refResult.object.sha

  // 2. 获取当前 Commit 的 Tree SHA
  const commitResult = await rpcEmit<RestCommit>(MESSAGE_TYPE.GET_COMMIT, [commitSha])
  const treeSha = commitResult.tree.sha

  // 3. 生成 Blob
  const markdown = generateMarkdown(issue)
  const blobResult = await rpcEmit<RestBlob>(MESSAGE_TYPE.CREATE_BLOB, [markdown])
  const blobSha = blobResult.sha

  // 4. 生成 Tree
  const year = dayjs(createdAt).year()
  const filePath = `archives/${year}/${issueNumber}.md`
  const newTreeResult = await rpcEmit<RestTree>(MESSAGE_TYPE.CREATE_TREE, [
    treeSha,
    filePath,
    blobSha,
  ])
  const newTreeSha = newTreeResult.sha

  // 5. 生成 Commit
  const commitMessage =
    type === SUBMIT_TYPE.CREATE
      ? `docs: create issue ${issueNumber}`
      : `docs: update issue ${issueNumber}`
  const newCommitResult = await rpcEmit<RestCommit>(MESSAGE_TYPE.CREATE_COMMIT, [
    commitSha,
    newTreeSha,
    commitMessage,
  ])
  const newCommitSha = newCommitResult.sha

  // 6. 更新 Ref
  await rpcEmit<RestRef>(MESSAGE_TYPE.UPDATE_REF, [newCommitSha])
}

export async function uploadImages(files: File[]): Promise<ClientUploadImagesResult> {
  if (files.length === 0) {
    throw new Error('No images selected')
  }

  const results: ClientUploadImagesResult = []

  // 并行上传可能会发生冲突，详见：https://docs.github.com/zh/rest/repos/contents#create-or-update-file-contents
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
          rpcEmit<string>(MESSAGE_TYPE.UPLOAD_IMAGE, [content, path])
            .then(url => resolve({ url }))
            .catch(reject)
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
