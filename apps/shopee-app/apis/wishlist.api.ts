import http from '@/utils/http'
import type { ProductDetail } from '@/apis/product-detail.api'
import { type ApiResponse, type Pagination } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WishlistItem {
  _id: string
  product: ProductDetail
  createdAt: string
}

export interface WishlistPage {
  items: WishlistItem[]
  pagination: Pagination
}

// ─── Wishlist API ─────────────────────────────────────────────────────────────

export async function getWishlist(page: number, limit = 20) {
  const res = await http.get<ApiResponse<WishlistPage>>('wishlist', {
    params: { page, limit },
  })
  return res.data
}

export async function checkWishlist(productId: string) {
  const res = await http.get<ApiResponse<{ in_wishlist: boolean }>>(`wishlist/check/${productId}`)
  return res.data
}

export async function addToWishlist(productId: string) {
  const res = await http.post<ApiResponse<unknown>>('wishlist', { product_id: productId })
  return res.data
}

export async function removeFromWishlist(productId: string) {
  const res = await http.delete<ApiResponse<unknown>>(`wishlist/${productId}`)
  return res.data
}

export async function getWishlistCount() {
  const res = await http.get<ApiResponse<{ count: number }>>('wishlist/count')
  return res.data
}

export async function clearWishlist() {
  const res = await http.delete<ApiResponse<unknown>>('wishlist')
  return res.data
}
