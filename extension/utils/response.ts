import type { ApiError, ApiRequestErrorDetail, ResultTuple } from '~/types'
import { RPCError } from '@tofrankie/vscode-webview-rpc'
import { ERROR_TYPE } from '~/constants'

type Transform<T, R> = (data: T) => R
type RequestErrorLike = ApiRequestErrorDetail & { message: string }

export function createResponse<T>(result: ResultTuple<T>): T
export function createResponse<T, R>(result: ResultTuple<T>, transform: Transform<T, R>): R
export function createResponse<T, R>(result: ResultTuple<T>, transform?: Transform<T, R>): T | R {
  const [err, data] = result
  if (err) {
    const apiError = createApiError(err)
    throw new RPCError(apiError.message, {
      code: 'GITHUB_API_ERROR',
      data: { apiError },
    })
  }

  if (transform) {
    return transform(data)
  }

  return data
}

function createApiError(error: unknown): ApiError {
  if (isRequestError(error)) {
    const url = error.request.url
    const type = url.includes('graphql') ? ERROR_TYPE.GRAPHQL : ERROR_TYPE.REST

    return {
      type,
      message: error.message,
      detail: {
        status: error.status,
        request: {
          url: error.request.url,
          method: error.request.method,
        },
      },
    }
  }

  if (error instanceof Error) {
    return {
      type: ERROR_TYPE.UNKNOWN,
      message: error.message,
    }
  }

  return {
    type: ERROR_TYPE.UNKNOWN,
    message: String(error),
  }
}

// https://github.com/octokit/request-error.js#usage-with-octokit
function isRequestError(error: unknown): error is RequestErrorLike {
  if (!isRecord(error)) {
    return false
  }

  const { message, status, request } = error
  if (typeof message !== 'string' || typeof status !== 'number' || !isRecord(request)) {
    return false
  }

  const { url, method } = request
  return typeof url === 'string' && (method === undefined || typeof method === 'string')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
