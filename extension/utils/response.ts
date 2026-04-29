import type { ApiError, ApiRequestErrorDetail, ApiResponse, ResultTuple } from '~/types'
import { ERROR_TYPE } from '~/constants'

type Transform<T, R> = (data: T) => R
type RequestErrorLike = ApiRequestErrorDetail & { message: string }

export function createResponse<T, R>(
  result: ResultTuple<T>,
  transform?: Transform<T, R>
): ApiResponse<T | R> {
  const [err, data] = result
  if (err) {
    return {
      success: false,
      data: null,
      error: createApiError(err),
    }
  }

  if (transform) {
    return {
      success: true,
      data: transform(data),
      error: null,
    }
  }

  return {
    success: true,
    data,
    error: null,
  }
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
