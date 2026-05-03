import http from '@/utils/http'
import { type ApiResponse } from '@/types/api.type'
import type { Review } from '@/apis/product-detail.api'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateReviewPayload {
  purchaseId: string
  rating: number
  comment: string
  images?: string[]
}

// ─── Review API ───────────────────────────────────────────────────────────────

export async function createReview(payload: CreateReviewPayload): Promise<ApiResponse<Review>> {
  const res = await http.post<ApiResponse<Review>>('reviews', {
    purchase_id: payload.purchaseId,
    rating: payload.rating,
    comment: payload.comment,
    images: payload.images,
  })
  return res.data
}
