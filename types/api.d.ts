import type { ERROR_TYPE } from '@/constants'

export {}

declare global {
  type ApiErrorType = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE]

  interface ApiError {
    type: ApiErrorType
    message: string
    detail?: unknown
  }

  interface ApiSuccessResponse<T> {
    success: true
    data: T
    error: null
  }

  interface ApiErrorResponse {
    success: false
    data: null
    error: ApiError
  }

  type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
}
