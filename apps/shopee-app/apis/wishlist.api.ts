import http from '@/utils/http'
import type { ProductDetail } from '@/apis/product-detail.api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  message: string
  data: T
}

export interface WishlistItem {
  _id: string
  product: ProductDetail
  createdAt: string
}

export interface WishlistPage {
  items: WishlistItem[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// ─── Wishlist API ─────────────────────────────────────────────────────────────

export async function getWishlist(page: number, limit = 20) {
  const res = await http.get<ApiResponse<WishlistPage>>('wishlist', {
    params: { page, limit },
  })
  return res.data
}
