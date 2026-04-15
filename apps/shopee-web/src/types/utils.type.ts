import type { SuccessResponse, ErrorResponse } from '@shopee/shared-types'

export type SuccessResponseApi<Data> = SuccessResponse<Data>
export type ErrorResponseApi<Data = Record<string, string>> = ErrorResponse<Data>

/**
 * cú pháp `-?` loại bỏ các key optional (ví như name?: string) -> loại bỏ undefined của key optional
 * NonNullable là một utils của thằng typescript nó sẽ loại bỏ đi giá trị undefined của một cái Type
 */
export type NoUndefinedField<T> = {
  [P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>>
}

// Vế đầu tiên là loại bỏ `optional` attribute - Vế sau có nghĩa là loại bỏ đi giá trị null hoặc undefined của `value`

// Error type for retry callbacks in React Query
export interface RetryError {
  name?: string
  code?: string
  response?: {
    status: number
  }
}
