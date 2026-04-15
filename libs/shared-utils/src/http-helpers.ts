import axios, { AxiosError } from 'axios'
import { HTTP_STATUS_CODE } from '@shopee/shared-constants'
import type { ErrorResponse } from '@shopee/shared-types'

export function isAxiosError<T>(error: unknown): error is AxiosError<T> {
  return axios.isAxiosError(error)
}

export function isAxiosUnauthorizedError<T>(error: unknown): error is AxiosError<T> {
  return isAxiosError(error) && error.response?.status === HTTP_STATUS_CODE.Unauthorized
}

export function isAxiosExpiredTokenError<T>(error: unknown): error is AxiosError<T> {
  return (
    isAxiosUnauthorizedError<ErrorResponse<{ name: string; message: string }>>(error) &&
    error.response?.data?.data?.name === 'EXPIRED_TOKEN'
  )
}

export function isAxiosUnprocessableEntityError<T>(error: unknown): error is AxiosError<T> {
  return isAxiosError(error) && error.response?.status === HTTP_STATUS_CODE.UnprocessableEntity
}
