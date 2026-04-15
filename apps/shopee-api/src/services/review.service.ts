import { Types } from 'mongoose'
import {
  IReviewRepository,
  IReviewItem,
  IReviewCommentItem,
  ReviewFilterOptions,
  IReviewStats,
} from '@repositories/interfaces/review.repository.interface'
import { IPurchaseRepository } from '@repositories/interfaces/purchase.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import {
  PaginatedResult,
  PaginationOptions,
} from '@repositories/interfaces/base.repository.interface'
import {
  BaseService,
  NotFoundError,
  ValidationError,
  BusinessError,
  ForbiddenError,
} from './base.service'
import { STATUS_PURCHASE } from '@constants/purchase'

export class ReviewService extends BaseService {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly productRepository: IProductRepository,
  ) {
    super()
  }

  async createReview(
    userId: string,
    purchaseId: string,
    rating: number,
    comment: string,
    images: string[] = [],
  ): Promise<{ review: IReviewItem; productId: string }> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(purchaseId)) throw new ValidationError('Invalid purchase ID format')

    const purchase = await this.purchaseRepository.findByIdAndUser(purchaseId, userId)
    if (!purchase || purchase.status !== STATUS_PURCHASE.DELIVERED) {
      throw new BusinessError('Không tìm thấy đơn hàng hoặc đơn hàng chưa hoàn thành')
    }

    const existingReview = await this.reviewRepository.findByPurchase(purchaseId)
    if (existingReview) {
      throw new BusinessError('Sản phẩm này đã được đánh giá')
    }

    const productId = (purchase.product as any)._id?.toString() || purchase.product.toString()
    const review = await this.reviewRepository.create({
      user: new Types.ObjectId(userId),
      product: new Types.ObjectId(productId),
      purchase: new Types.ObjectId(purchaseId),
      rating,
      comment,
      images,
    })

    // Update product rating
    await this.updateProductRating(productId)

    return { review, productId }
  }

  async getProductReviews(
    productId: string,
    userId: string | undefined,
    filters: Omit<ReviewFilterOptions, 'product_id'>,
    pagination: PaginationOptions,
  ): Promise<{ reviews: IReviewItem[]; pagination: any; stats: IReviewStats }> {
    const result = await this.reviewRepository.findByProduct(
      { ...filters, product_id: productId },
      this.normalizePagination(pagination),
    )

    let reviewsWithLikes = result.data
    if (userId) {
      const likedIds = await this.reviewRepository.findUserLikes(
        userId,
        result.data.map((r) => r._id!),
      )
      reviewsWithLikes = result.data.map((review) => ({
        ...review,
        is_liked: likedIds.has(review._id!.toString()),
      }))
    }

    const stats = await this.reviewRepository.getProductStats(productId)

    return {
      reviews: reviewsWithLikes,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
      stats,
    }
  }

  async toggleReviewLike(
    userId: string,
    reviewId: string,
  ): Promise<{ is_liked: boolean; helpful_count: number; productId: string }> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(reviewId)) throw new ValidationError('Invalid review ID format')

    const review = await this.reviewRepository.findById(reviewId)
    if (!review) throw new NotFoundError('Review', reviewId)

    const result = await this.reviewRepository.toggleLike(userId, reviewId)
    const productId = (review.product as any)._id?.toString() || review.product.toString()

    return { ...result, productId }
  }

  async createReviewComment(
    userId: string,
    reviewId: string,
    content: string,
    parentCommentId?: string,
  ): Promise<{ comment: IReviewCommentItem; productId: string }> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(reviewId)) throw new ValidationError('Invalid review ID format')

    const review = await this.reviewRepository.findById(reviewId)
    if (!review) throw new NotFoundError('Review', reviewId)

    let level = 0
    if (parentCommentId) {
      if (!this.isValidObjectId(parentCommentId))
        throw new ValidationError('Invalid parent comment ID format')
      const parentComment = await this.reviewRepository.findCommentById(parentCommentId)
      if (!parentComment) throw new NotFoundError('Parent comment', parentCommentId)
      level = parentComment.level + 1
      if (level > 3) throw new BusinessError('Không thể trả lời comment này (quá nhiều cấp)')
    }

    const comment = await this.reviewRepository.createComment({
      user: new Types.ObjectId(userId),
      review: new Types.ObjectId(reviewId),
      content,
      parent_comment: parentCommentId ? new Types.ObjectId(parentCommentId) : null,
      level,
    })

    const productId = (review.product as any)._id?.toString() || review.product.toString()
    return { comment, productId }
  }

  async getReviewComments(
    reviewId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IReviewCommentItem>> {
    if (!this.isValidObjectId(reviewId)) throw new ValidationError('Invalid review ID format')
    return this.reviewRepository.findCommentsByReview(
      reviewId,
      this.normalizePagination(pagination),
    )
  }

  async canReviewPurchase(
    userId: string,
    purchaseId: string,
  ): Promise<{ can_review: boolean; reason?: string; review_id?: string }> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(purchaseId)) throw new ValidationError('Invalid purchase ID format')

    const purchase = await this.purchaseRepository.findByIdAndUser(purchaseId, userId)
    if (!purchase || purchase.status !== STATUS_PURCHASE.DELIVERED) {
      return { can_review: false, reason: 'Đơn hàng chưa hoàn thành' }
    }

    const existingReview = await this.reviewRepository.findByPurchase(purchaseId)
    if (existingReview) {
      return {
        can_review: false,
        reason: 'Sản phẩm đã được đánh giá',
        review_id: existingReview._id?.toString(),
      }
    }

    return { can_review: true }
  }

  private async updateProductRating(productId: string): Promise<void> {
    const stats = await this.reviewRepository.getProductStats(productId)
    await this.productRepository.updateRating(productId, stats.average_rating)
  }

  async updateReview(
    userId: string,
    reviewId: string,
    data: { rating?: number; comment?: string; images?: string[] },
  ): Promise<IReviewItem> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(reviewId)) throw new ValidationError('Invalid review ID format')

    const review = await this.reviewRepository.findById(reviewId)
    if (!review) throw new NotFoundError('Không tìm thấy đánh giá')

    const reviewUserId = (review.user as any)?._id?.toString() || review.user.toString()
    if (reviewUserId !== userId) {
      throw new ForbiddenError('Bạn không có quyền chỉnh sửa đánh giá này')
    }

    const updateFields: Record<string, any> = {}
    if (data.rating !== undefined) updateFields.rating = data.rating
    if (data.comment !== undefined) updateFields.comment = data.comment
    if (data.images !== undefined) updateFields.images = data.images

    const updated = await (this.reviewRepository as any).updateById(reviewId, updateFields)
    if (!updated) throw new NotFoundError('Không tìm thấy đánh giá')

    // Recalculate product rating if rating changed
    if (data.rating !== undefined) {
      const productId = (review.product as any)?._id?.toString() || review.product.toString()
      await this.updateProductRating(productId)
    }

    return updated
  }

  async deleteReview(
    userId: string,
    reviewId: string,
  ): Promise<{ deleted: boolean; product_id: string }> {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID format')
    if (!this.isValidObjectId(reviewId)) throw new ValidationError('Invalid review ID format')

    const review = await this.reviewRepository.findById(reviewId)
    if (!review) throw new NotFoundError('Không tìm thấy đánh giá')

    const reviewUserId = (review.user as any)?._id?.toString() || review.user.toString()
    if (reviewUserId !== userId) {
      throw new ForbiddenError('Bạn không có quyền xóa đánh giá này')
    }

    const productId = (review.product as any)?._id?.toString() || review.product.toString()

    // Delete review + comments + likes (handled by repository)
    await (this.reviewRepository as any).deleteById(reviewId)

    // Recalculate product rating
    await this.updateProductRating(productId)

    return { deleted: true, product_id: productId }
  }

  // ─── Admin Methods ─────────────────────────────────────────────

  async adminGetReviews(
    filters: { rating?: number; product_id?: string; user_id?: string; search?: string },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' },
  ) {
    return (this.reviewRepository as any).findAllWithFilters(filters, pagination)
  }

  async adminGetReviewById(id: string) {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid review ID')
    const review = await this.reviewRepository.findById(id)
    if (!review) throw new NotFoundError('Review', id)
    return review
  }

  async adminDeleteReview(id: string) {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid review ID')
    const review = await this.reviewRepository.findById(id)
    if (!review) throw new NotFoundError('Review', id)

    await (this.reviewRepository as any).deleteById(id)

    // Recalculate product rating
    const productId = (review.product as any)?._id?.toString() || review.product.toString()
    await this.updateProductRating(productId)

    return { deleted: true, product_id: productId }
  }

  async adminDeleteComment(id: string) {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid comment ID')
    const comment = await this.reviewRepository.findCommentById(id)
    if (!comment) throw new NotFoundError('Comment', id)
    await (this.reviewRepository as any).deleteCommentById(id)
    return { deleted: true }
  }

  async adminGetStats() {
    return (this.reviewRepository as any).getReviewStats()
  }
}
