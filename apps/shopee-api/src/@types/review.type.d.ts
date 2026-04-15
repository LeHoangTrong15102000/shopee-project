export interface Review {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  product: {
    _id: string
    name: string
    image: string
  }
  purchase: string
  rating: number
  comment: string
  images: string[]
  helpful_count: number
  createdAt: string
  updatedAt: string

  // Thông tin bổ sung khi populate
  is_liked?: boolean // User hiện tại đã like chưa
  comments_count?: number // Số lượng comments
}

export interface ReviewLike {
  _id: string
  user: string
  review: string
  createdAt: string
}

export interface ReviewComment {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  review: string
  content: string
  parent_comment?: string
  level: number
  replies_count: number
  createdAt: string
  updatedAt: string

  // Thông tin bổ sung
  replies?: ReviewComment[] // Danh sách replies (nếu có)
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

export interface CreateReviewBody {
  purchase_id: string
  rating: number
  comment: string
  images?: string[]
}

export interface UpdateReviewBody {
  rating?: number
  comment?: string
  images?: string[]
}

export interface ReviewQuery {
  product_id?: string
  user_id?: string
  rating?: number
  page?: number
  limit?: number
  sort?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful'
}

export interface CreateCommentBody {
  review_id: string
  content: string
  parent_comment_id?: string
}
