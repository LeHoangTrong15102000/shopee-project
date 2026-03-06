export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
}

export interface Product {
  _id: string
  name: string
  image: string
}

export interface Review {
  _id: string
  user: User
  product: Product
  purchase: string
  rating: number
  comment: string
  images: string[]
  helpful_count: number
  createdAt: string
  updatedAt: string
  is_liked?: boolean
  comments_count?: number
}

export interface ReviewComment {
  _id: string
  user: User
  review: string
  content: string
  parent_comment?: string
  level: number
  replies_count: number
  createdAt: string
  updatedAt: string
  replies?: ReviewComment[]
}

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
