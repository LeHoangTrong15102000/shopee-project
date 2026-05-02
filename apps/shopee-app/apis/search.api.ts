import http from '@/utils/http'
import { type ApiResponse, type Pagination } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Product {
  _id: string
  name: string
  image: string
  images: string[]
  price: number
  price_before_discount: number
  rating: number
  sold: number
  quantity: number
  category: { _id: string; name: string }
}

export interface SearchResult {
  products: Product[]
  pagination: Pagination
}

export interface SearchSuggestion {
  keyword: string
}

export interface SearchHistoryItem {
  _id: string
  keyword: string
  createdAt: string
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
  const res = await http.get<ApiResponse<SearchHistoryItem[]>>('search/history')
  return res.data
}

export async function saveSearchHistory(keyword: string) {
  const res = await http.post<ApiResponse<SearchHistoryItem>>('search/history', { keyword })
  return res.data
}

export async function deleteHistoryItem(id: string) {
  const res = await http.delete<ApiResponse<unknown>>(`search/history/${id}`)
  return res.data
}

export async function clearSearchHistory() {
  const res = await http.delete<ApiResponse<unknown>>('search/history')
  return res.data
}
