import type {
  Review as SharedReview,
  ReviewComment as SharedReviewComment,
} from '@shopee/shared-types'

// Extend shared Review with web-specific fields
export type Review = SharedReview & {
  purchase: string
  is_liked?: boolean
}

// Re-export shared ReviewComment as-is
export type ReviewComment = SharedReviewComment

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_breakdown: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface CreateReviewData {
  purchase_id: string
  rating: number
  comment: string
  images?: string[]
}

export interface CreateCommentData {
  review_id: string
  content: string
  parent_comment_id?: string
}

export interface ReviewQuery {
  product_id?: string
  page?: number
  limit?: number
  rating?: number
  sort?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful'
}

export interface ReviewListResponse {
  reviews: Review[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  stats: ReviewStats
}

export interface CommentListResponse {
  comments: ReviewComment[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface CanReviewResponse {
  can_review: boolean
  reason?: string
  review_id?: string
}
