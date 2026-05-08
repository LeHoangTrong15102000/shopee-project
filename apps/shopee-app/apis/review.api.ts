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

export interface ReviewComment {
  _id: string
  user: { _id: string; name: string; avatar?: string }
  review_id: string
  content: string
  createdAt: string
}

export interface ReviewCommentPayload {
  content: string
}

export interface EditReviewPayload {
  rating?: number
  comment?: string
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

export async function getReviewComments(reviewId: string): Promise<ApiResponse<ReviewComment[]>> {
  const res = await http.get<ApiResponse<ReviewComment[]>>(`reviews/comments/${reviewId}`)
  return res.data
}

export async function postReviewComment(
  reviewId: string,
  content: string
): Promise<ApiResponse<ReviewComment>> {
  const res = await http.post<ApiResponse<ReviewComment>>('reviews/comment', {
    review_id: reviewId,
    content,
  })
  return res.data
}

export async function editReview(
  reviewId: string,
  payload: EditReviewPayload
): Promise<ApiResponse<Review>> {
  const res = await http.put<ApiResponse<Review>>(`reviews/${reviewId}`, payload)
  return res.data
}

export async function deleteReview(reviewId: string): Promise<ApiResponse<unknown>> {
  const res = await http.delete<ApiResponse<unknown>>(`reviews/${reviewId}`)
  return res.data
}

export async function canReview(purchaseId: string): Promise<ApiResponse<{ can_review: boolean }>> {
  const res = await http.get<ApiResponse<{ can_review: boolean }>>(
    `reviews/can-review/${purchaseId}`
  )
  return res.data
}
