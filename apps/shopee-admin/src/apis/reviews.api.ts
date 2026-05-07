import http from 'src/utils/http'
import type { SuccessResponse, Review, ReviewComment } from 'src/types'

export type ModerationStatus = 'pending' | 'approved' | 'flagged'

interface ReviewListParams {
  page?: number
  limit?: number
  sort_by?: string
  order?: string
  rating?: number
  product_id?: string
  user_id?: string
  search?: string
  moderation_status?: ModerationStatus
}

interface ReviewListResponse {
  reviews: Review[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface ReviewStats {
  total: number
  average_rating: number
  rating_distribution: Record<string, number>
  moderation_counts?: { pending: number; approved: number; flagged: number }
}

interface ReviewDetail extends Review {
  comments: ReviewComment[]
}

const reviewsApi = {
  getReviews: (params?: ReviewListParams) =>
    http.get<SuccessResponse<ReviewListResponse>>('admin/reviews', { params }),

  getReview: (id: string) => http.get<SuccessResponse<ReviewDetail>>(`admin/reviews/${id}`),

  getReviewStats: () => http.get<SuccessResponse<ReviewStats>>('admin/reviews/stats'),

  moderateReview: (id: string, status: ModerationStatus) =>
    http.patch<SuccessResponse<Review>>(`admin/reviews/${id}/moderate`, { status }),

  deleteReview: (id: string) => http.delete<SuccessResponse<null>>(`admin/reviews/${id}`),

  deleteComment: (id: string) => http.delete<SuccessResponse<null>>(`admin/reviews/comments/${id}`),
}

export default reviewsApi
