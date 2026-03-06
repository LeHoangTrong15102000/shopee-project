import { Types } from 'mongoose'
import { ReviewModel } from '@database/models/review.model'
import { ReviewLikeModel } from '@database/models/review-like.model'
import { ReviewCommentModel } from '@database/models/review-comment.model'
import {
  IReviewRepository,
  IReviewItem,
  IReviewCommentItem,
  CreateReviewDTO,
  CreateReviewCommentDTO,
  ReviewFilterOptions,
  IReviewStats,
} from './interfaces/review.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class ReviewRepository implements IReviewRepository {
  async findByProduct(
    filters: ReviewFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IReviewItem>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = { product: filters.product_id }
    if (filters.rating) filter.rating = filters.rating

    type SortOption = { [key: string]: 1 | -1 }
    let sortObj: SortOption = { createdAt: -1 }
    if (filters.sort === 'oldest') sortObj = { createdAt: 1 }
    if (filters.sort === 'highest_rating') sortObj = { rating: -1, createdAt: -1 }
    if (filters.sort === 'lowest_rating') sortObj = { rating: 1, createdAt: -1 }
    if (filters.sort === 'most_helpful') sortObj = { helpful_count: -1, createdAt: -1 }

    const [data, total] = await Promise.all([
      ReviewModel.find(filter)
        .populate('user', 'name email avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean<IReviewItem[]>(),
      ReviewModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async findById(reviewId: string | Types.ObjectId): Promise<IReviewItem | null> {
    return ReviewModel.findById(reviewId).populate('user', 'name email avatar').lean<IReviewItem | null>()
  }

  async findByPurchase(purchaseId: string | Types.ObjectId): Promise<IReviewItem | null> {
    return ReviewModel.findOne({ purchase: purchaseId }).lean<IReviewItem | null>()
  }

  async create(data: CreateReviewDTO): Promise<IReviewItem> {
    const review = new ReviewModel({
      user: data.user,
      product: data.product,
      purchase: data.purchase,
      rating: data.rating,
      comment: data.comment,
      images: data.images || [],
    })
    const saved = await review.save()
    return ReviewModel.findById(saved._id)
      .populate('user', 'name email avatar')
      .populate('product', 'name image')
      .lean<IReviewItem>() as Promise<IReviewItem>
  }

  async getProductStats(productId: string | Types.ObjectId): Promise<IReviewStats> {
    const [stats, total_reviews, average_rating] = await Promise.all([
      ReviewModel.aggregate([
        { $match: { product: new Types.ObjectId(productId.toString()) } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
      ReviewModel.countDocuments({ product: productId }),
      ReviewModel.aggregate([
        { $match: { product: new Types.ObjectId(productId.toString()) } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]),
    ])

    const rating_breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    stats.forEach((stat) => {
      rating_breakdown[stat._id as keyof typeof rating_breakdown] = stat.count
    })

    return {
      total_reviews,
      average_rating: average_rating.length > 0 ? Math.round(average_rating[0].avg * 10) / 10 : 0,
      rating_breakdown,
    }
  }

  async findUserLike(userId: string | Types.ObjectId, reviewId: string | Types.ObjectId): Promise<boolean> {
    const like = await ReviewLikeModel.findOne({ user: userId, review: reviewId })
    return !!like
  }

  async findUserLikes(userId: string | Types.ObjectId, reviewIds: (string | Types.ObjectId)[]): Promise<Set<string>> {
    const likes = await ReviewLikeModel.find({ user: userId, review: { $in: reviewIds } })
    return new Set(likes.map((l) => l.review.toString()))
  }

  async toggleLike(
    userId: string | Types.ObjectId,
    reviewId: string | Types.ObjectId
  ): Promise<{ is_liked: boolean; helpful_count: number }> {
    const existingLike = await ReviewLikeModel.findOne({ user: userId, review: reviewId })

    let isLiked = false
    if (existingLike) {
      await ReviewLikeModel.findByIdAndDelete(existingLike._id)
      await ReviewModel.findByIdAndUpdate(reviewId, { $inc: { helpful_count: -1 } })
    } else {
      await new ReviewLikeModel({ user: userId, review: reviewId }).save()
      await ReviewModel.findByIdAndUpdate(reviewId, { $inc: { helpful_count: 1 } })
      isLiked = true
    }

    const helpful_count = await ReviewLikeModel.countDocuments({ review: reviewId })
    return { is_liked: isLiked, helpful_count }
  }

  async findCommentsByReview(
    reviewId: string | Types.ObjectId,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IReviewCommentItem>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    // 1. Get paginated root comments
    const rootComments = await ReviewCommentModel.find({ review: reviewId, parent_comment: null })
      .populate('user', 'name email avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean<IReviewCommentItem[]>()

    // 2. Get all replies for these root comments
    const rootIds = rootComments.map((c) => c._id)
    const allReplies =
      rootIds.length > 0
        ? await ReviewCommentModel.find({ parent_comment: { $in: rootIds } })
            .populate('user', 'name email avatar')
            .sort({ createdAt: 1 })
            .lean<IReviewCommentItem[]>()
        : []

    // 3. Build flat array: root comment followed by its replies
    const flatComments: IReviewCommentItem[] = []
    for (const root of rootComments) {
      flatComments.push(root)
      const replies = allReplies.filter((r) => r.parent_comment?.toString() === root._id?.toString())
      flatComments.push(...replies)
    }

    const total = await ReviewCommentModel.countDocuments({ review: reviewId, parent_comment: null })
    return {
      data: flatComments,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async findCommentById(commentId: string | Types.ObjectId): Promise<IReviewCommentItem | null> {
    return ReviewCommentModel.findById(commentId).lean<IReviewCommentItem | null>()
  }

  async createComment(data: CreateReviewCommentDTO): Promise<IReviewCommentItem> {
    const comment = new ReviewCommentModel({
      user: data.user,
      review: data.review,
      content: data.content,
      parent_comment: data.parent_comment || null,
      level: data.level,
    })
    const saved = await comment.save()
    return ReviewCommentModel.findById(saved._id)
      .populate('user', 'name email avatar')
      .lean<IReviewCommentItem>() as Promise<IReviewCommentItem>
  }

  // ─── Admin Methods ─────────────────────────────────────────────

  async findAllWithFilters(
    filters: { rating?: number; product_id?: string; user_id?: string; search?: string },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' }
  ): Promise<PaginatedResult<IReviewItem>> {
    const { page, limit, sort_by = 'createdAt', order = 'desc' } = pagination
    const skip = (page - 1) * limit

    const query: Record<string, any> = {}
    if (filters.rating) query.rating = filters.rating
    if (filters.product_id) query.product = new Types.ObjectId(filters.product_id)
    if (filters.user_id) query.user = new Types.ObjectId(filters.user_id)

    const sortObj: Record<string, 1 | -1> = { [sort_by]: order === 'asc' ? 1 : -1 }

    const [data, total] = await Promise.all([
      ReviewModel.find(query)
        .populate('user', 'name email avatar')
        .populate('product', 'name image')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean<IReviewItem[]>(),
      ReviewModel.countDocuments(query),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async deleteById(reviewId: string): Promise<void> {
    await ReviewCommentModel.deleteMany({ review: new Types.ObjectId(reviewId) })
    await ReviewLikeModel.deleteMany({ review: new Types.ObjectId(reviewId) })
    await ReviewModel.findByIdAndDelete(reviewId)
  }

  async deleteCommentById(commentId: string): Promise<void> {
    // Delete child replies first
    await ReviewCommentModel.deleteMany({ parent_comment: new Types.ObjectId(commentId) })
    await ReviewCommentModel.findByIdAndDelete(commentId)
  }

  async getReviewStats() {
    const [total, ratingDist, avgRating, todayCount, weekCount] = await Promise.all([
      ReviewModel.countDocuments(),
      ReviewModel.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }]),
      ReviewModel.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
      ReviewModel.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      ReviewModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    ])

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const r of ratingDist) breakdown[r._id] = r.count

    return {
      total,
      average_rating: avgRating[0] ? Math.round(avgRating[0].avg * 10) / 10 : 0,
      rating_breakdown: breakdown,
      today: todayCount,
      this_week: weekCount,
    }
  }
}

