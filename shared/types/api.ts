import type { ValueOf } from './base'

type ErrorTypeConst = typeof import('~/constants').ERROR_TYPE

type ApiErrorType = ValueOf<ErrorTypeConst>
type ApiUnknownErrorType = ErrorTypeConst['UNKNOWN']
type ApiRequestErrorType = Exclude<ApiErrorType, ApiUnknownErrorType>

export interface ApiRequestErrorDetail {
  status: number
  request: {
    url: string
    method?: string
  }
}

export interface ApiRequestError {
  type: ApiRequestErrorType
  message: string
  detail: ApiRequestErrorDetail
}

export interface ApiUnknownError {
  type: ApiUnknownErrorType
  message: string
  detail?: undefined
}

export type ApiError = ApiRequestError | ApiUnknownError

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  error: null
}

export interface ApiErrorResponse {
  success: false
  data: null
  error: ApiError
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
