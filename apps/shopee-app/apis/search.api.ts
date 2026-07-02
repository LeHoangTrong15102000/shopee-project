import http from '@/utils/http'
import { type ApiResponse, type Pagination } from '@/types/api.type'
import { Product } from '../types/product.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  products: Product[]
  pagination: Pagination
}

export interface SearchSuggestion {
  keyword: string
}

// ─── Search API ───────────────────────────────────────────────────────────────

export async function searchProducts(params: {
  keyword: string
  page?: number
  limit?: number
  sortBy?: string
  order?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  category?: string
  // NOTE: Backend may not support this filter yet — sent as a query param for
  // forward compatibility. Server will ignore it if unrecognised.
  inStock?: boolean
}) {
  const res = await http.get<ApiResponse<SearchResult>>('products', { params })
  return res.data
}

export async function getSearchSuggestions(keyword: string) {
  const res = await http.get<ApiResponse<SearchSuggestion[]>>('search/suggestions', {
    params: { keyword },
  })
  return res.data
}

export async function getSearchHistory() {
  const res = await http.get<ApiResponse<string[]>>('products/search/history')
  return res.data
}

export async function saveSearchHistory(keyword: string) {
  const res = await http.post<ApiResponse<unknown>>('products/search/save-history', { keyword })
  return res.data
}

export async function deleteHistoryItem(keyword: string) {
  const res = await http.delete<ApiResponse<unknown>>(`products/search/history/${encodeURIComponent(keyword)}`)
  return res.data
}

export async function clearSearchHistory() {
  const res = await http.delete<ApiResponse<unknown>>('products/search/history')
  return res.data
}
