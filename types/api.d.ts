import { ERROR_TYPE } from '@/constants'

export {}

declare global {
  type ApiErrorType = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE]

  interface ApiError {
    type: ApiErrorType
    message: string
    detail?: unknown
  }

  type ApiSuccessResponse<T> = {
    success: true
    data: T
    error: null
  }

  type ApiErrorResponse = {
    success: false
    data: null
    error: ApiError
  }

  type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
}
