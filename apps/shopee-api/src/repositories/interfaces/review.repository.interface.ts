import { Types } from 'mongoose'
import { PaginatedResult, PaginationOptions } from './base.repository.interface'

/**
 * Review interface
 */
export interface IReviewItem {
  _id?: Types.ObjectId
  user: Types.ObjectId | { name?: string; email?: string; avatar?: string }
  product: Types.ObjectId | { name?: string; image?: string }
  purchase: Types.ObjectId
  rating: number
  comment: string
  images: string[]
  helpful_count: number
  is_liked?: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Review comment interface
 */
export interface IReviewCommentItem {
  _id?: Types.ObjectId
  user: Types.ObjectId | { name?: string; email?: string; avatar?: string }
  review: Types.ObjectId
  content: string
  parent_comment?: Types.ObjectId | null
  level: number
  replies?: IReviewCommentItem[]
  createdAt?: Date
}

/**
 * Create review DTO
 */
export interface CreateReviewDTO {
  user: string | Types.ObjectId
  product: string | Types.ObjectId
  purchase: string | Types.ObjectId
  rating: number
  comment: string
  images?: string[]
}

/**
 * Create review comment DTO
 */
export interface CreateReviewCommentDTO {
  user: string | Types.ObjectId
  review: string | Types.ObjectId
  content: string
  parent_comment?: string | Types.ObjectId | null
  level: number
}

/**
 * Review filter options
 */
export interface ReviewFilterOptions {
  product_id: string | Types.ObjectId
  rating?: number
  sort?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful'
}

/**
 * Review stats
 */
export interface IReviewStats {
  total_reviews: number
  average_rating: number
  rating_breakdown: { 1: number; 2: number; 3: number; 4: number; 5: number }
}

/**
 * Review repository interface
 */
export interface IReviewRepository {
  // Reviews
  findByProduct(
    filters: ReviewFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IReviewItem>>

  findById(reviewId: string | Types.ObjectId): Promise<IReviewItem | null>

  findByPurchase(purchaseId: string | Types.ObjectId): Promise<IReviewItem | null>

  create(data: CreateReviewDTO): Promise<IReviewItem>

  getProductStats(productId: string | Types.ObjectId): Promise<IReviewStats>

  // Likes
  findUserLike(userId: string | Types.ObjectId, reviewId: string | Types.ObjectId): Promise<boolean>

  findUserLikes(userId: string | Types.ObjectId, reviewIds: (string | Types.ObjectId)[]): Promise<Set<string>>

  toggleLike(userId: string | Types.ObjectId, reviewId: string | Types.ObjectId): Promise<{ is_liked: boolean; helpful_count: number }>

  // Comments
  findCommentsByReview(
    reviewId: string | Types.ObjectId,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IReviewCommentItem>>

  findCommentById(commentId: string | Types.ObjectId): Promise<IReviewCommentItem | null>

  createComment(data: CreateReviewCommentDTO): Promise<IReviewCommentItem>
}

