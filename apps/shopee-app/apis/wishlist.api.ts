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
