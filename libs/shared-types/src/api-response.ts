export interface SuccessResponse<T> {
  message: string
  data: T
}

export interface ErrorResponse<T = Record<string, string>> {
  message: string
  data?: T
}

export interface PaginatedData<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    page_size: number
    total?: number
    total_pages?: number
  }
}
