import http from '@/utils/http'
import { type ApiResponse } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateReviewPayload {
  productId: string
  orderId: string
  rating: number
  comment: string
  images?: string[]
}

// ─── Review API ───────────────────────────────────────────────────────────────

export async function createReview(payload: CreateReviewPayload): Promise<void> {
  await http.post<ApiResponse<unknown>>('reviews', {
    product_id: payload.productId,
    order_id: payload.orderId,
    rating: payload.rating,
    comment: payload.comment,
    images: payload.images,
  })
}
