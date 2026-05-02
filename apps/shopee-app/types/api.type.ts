// ─── Shared API Response Types ────────────────────────────────────────────────
// Single source of truth for ApiResponse<T> and Pagination.
// All API files should import from here instead of declaring locally.

export interface ApiResponse<T> {
  message: string
  data: T
}

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: Pagination
}
