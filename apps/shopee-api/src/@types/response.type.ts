export interface ApiResponse<T = unknown> {
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  message: string
  data: {
    products: T[]
    pagination: {
      page: number
      limit: number
      page_size: number
    }
  }
}

export interface ErrorResponse {
  message: string
  error?: string | Record<string, string>
}
