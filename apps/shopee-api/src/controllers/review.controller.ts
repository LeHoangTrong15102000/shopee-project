import { Request, Response } from 'express'
type Req = Request<Record<string, string>>
import { STATUS } from '@constants/status'
import { reviewService } from '../container'
import { emitNewReview, emitNewReviewComment, emitReviewLiked } from '../socket/utils/review-emit'
import { emitActivityEvent } from '../socket/utils/activity-emit'
import {
  ValidationError,
  NotFoundError,
  BusinessError,
  ForbiddenError,
} from '@services/base.service'

// Tạo review mới
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.jwtDecoded?.id
    const { purchase_id, rating, comment, images = [] } = req.body

    const { review, productId } = await reviewService.createReview(
      user_id!,
      purchase_id,
      rating,
      comment,
      images,
    )

    // WebSocket: Emit new review to product room (fire-and-forget)
    void (() => {
      try {
        if (review) {
          const reviewUser = review.user as any
          emitNewReview(productId, {
            _id: review._id?.toString() || '',
            user: { name: reviewUser?.name || 'Người dùng', avatar: reviewUser?.avatar },
            rating,
            comment,
            images,
            createdAt: review.createdAt?.toISOString?.() || new Date().toISOString(),
          })
          emitActivityEvent(productId, 'review', `Ai đó vừa đánh giá ${rating} sao`)
        }
      } catch (_) {
        /* non-critical */
      }
    })()

    res.status(STATUS.OK).json({
      message: 'Đánh giá sản phẩm thành công',
      data: review,
    })
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BusinessError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi tạo đánh giá',
    })
  }
}

// Lấy reviews của sản phẩm
export const getProductReviews = async (req: Req, res: Response): Promise<void> => {
  try {
    const product_id = req.params.product_id
    const user_id = req.jwtDecoded?.id
    const { page = 1, limit = 10, rating, sort = 'newest' } = req.query

    const result = await reviewService.getProductReviews(
      product_id,
      user_id,
      { rating: rating ? Number(rating) : undefined, sort: sort as any },
      { page: Number(page), limit: Number(limit) },
    )

    res.status(STATUS.OK).json({
      message: 'Lấy danh sách đánh giá thành công',
      data: {
        reviews: result.reviews,
        pagination: result.pagination,
        stats: result.stats,
      },
    })
  } catch (error) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi lấy danh sách đánh giá',
    })
  }
}

// Like/Unlike review
export const toggleReviewLike = async (req: Req, res: Response): Promise<void> => {
  try {
    const user_id = req.jwtDecoded?.id
    const review_id = req.params.review_id

    const { is_liked, helpful_count, productId } = await reviewService.toggleReviewLike(
      user_id!,
      review_id,
    )

    // WebSocket: Emit review liked to product room (fire-and-forget)
    void (() => {
      try {
        emitReviewLiked(productId, review_id, helpful_count)
      } catch (_) {
        /* non-critical */
      }
    })()

    res.status(STATUS.OK).json({
      message: is_liked ? 'Thích đánh giá thành công' : 'Bỏ thích đánh giá thành công',
      data: { is_liked, helpful_count },
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: error.message })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi thích/bỏ thích đánh giá',
    })
  }
}

// Tạo comment
export const createReviewComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.jwtDecoded?.id
    const { review_id, content, parent_comment_id } = req.body

    const { comment, productId } = await reviewService.createReviewComment(
      user_id!,
      review_id,
      content,
      parent_comment_id,
    )

    // WebSocket: Emit new review comment to product room (fire-and-forget)
    void (() => {
      try {
        if (comment) {
          const commentUser = comment.user as any
          emitNewReviewComment(productId, review_id, {
            _id: comment._id?.toString() || '',
            user: { name: commentUser?.name || 'Người dùng', avatar: commentUser?.avatar },
            content,
            parent_comment: parent_comment_id || undefined,
            level: comment.level,
            createdAt: comment.createdAt?.toISOString?.() || new Date().toISOString(),
          })
        }
      } catch (_) {
        /* non-critical */
      }
    })()

    res.status(STATUS.OK).json({
      message: 'Tạo bình luận thành công',
      data: comment,
    })
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BusinessError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: error.message })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi tạo bình luận',
    })
  }
}

// Lấy comments của review
export const getReviewComments = async (req: Req, res: Response): Promise<void> => {
  try {
    const review_id = req.params.review_id
    const { page = 1, limit = 10 } = req.query

    const result = await reviewService.getReviewComments(review_id, {
      page: Number(page),
      limit: Number(limit),
    })

    res.status(STATUS.OK).json({
      message: 'Lấy danh sách bình luận thành công',
      data: {
        comments: result.data,
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
          total_pages: result.pagination.page_size,
        },
      },
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi lấy danh sách bình luận',
    })
  }
}

// Kiểm tra có thể review không
export const canReviewPurchase = async (req: Req, res: Response): Promise<void> => {
  try {
    const user_id = req.jwtDecoded?.id
    const purchase_id = req.params.purchase_id

    const result = await reviewService.canReviewPurchase(user_id!, purchase_id)

    res.status(STATUS.OK).json({
      message: 'Kiểm tra quyền đánh giá thành công',
      data: result,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: error.message })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi kiểm tra quyền đánh giá',
    })
  }
}

// Cập nhật review
export const updateReview = async (req: Req, res: Response): Promise<void> => {
  try {
    const user_id = req.jwtDecoded?.id
    const review_id = req.params.review_id
    const { rating, comment, images } = req.body

    const updated = await reviewService.updateReview(user_id!, review_id, {
      rating,
      comment,
      images,
    })

    res.status(STATUS.OK).json({
      message: 'Cập nhật đánh giá thành công',
      data: updated,
    })
  } catch (error) {
    if (error instanceof ValidationError || error instanceof BusinessError) {
      res.status(STATUS.BAD_REQUEST).json({ message: (error as Error).message })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: (error as Error).message })
      return
    }
    if (error instanceof ForbiddenError) {
      res.status(STATUS.FORBIDDEN).json({ message: (error as Error).message })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi cập nhật đánh giá',
    })
  }
}

// Xóa review
export const deleteReview = async (req: Req, res: Response): Promise<void> => {
  try {
    const user_id = req.jwtDecoded?.id
    const review_id = req.params.review_id

    await reviewService.deleteReview(user_id!, review_id)

    res.status(STATUS.OK).json({
      message: 'Xóa đánh giá thành công',
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(STATUS.BAD_REQUEST).json({ message: (error as Error).message })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(STATUS.NOT_FOUND).json({ message: (error as Error).message })
      return
    }
    if (error instanceof ForbiddenError) {
      res.status(STATUS.FORBIDDEN).json({ message: (error as Error).message })
      return
    }
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi server khi xóa đánh giá',
    })
  }
}
