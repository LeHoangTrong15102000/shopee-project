import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as reviewController from '@controllers/review.controller'
import { asyncHandler } from '@utils/async-handler'
import {
  validate,
  createReviewSchema,
  getProductReviewsSchema,
  toggleReviewLikeSchema,
  createReviewCommentSchema,
  getReviewCommentsSchema,
  canReviewPurchaseSchema,
  updateReviewSchema,
  deleteReviewSchema,
} from '@schemas/index'

export const userReviewRouter = Router()

// Tạo review mới
userReviewRouter.post(
  '',
  validate(createReviewSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(reviewController.createReview),
)

// Lấy reviews của sản phẩm (có thể không cần auth)
userReviewRouter.get(
  '/product/:product_id',
  validate(getProductReviewsSchema),
  authMiddleware.verifyAccessTokenOptional, // Optional auth để check likes
  asyncHandler(reviewController.getProductReviews),
)

// Like/Unlike review
userReviewRouter.post(
  '/like/:review_id',
  validate(toggleReviewLikeSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(reviewController.toggleReviewLike),
)

// Tạo comment cho review
userReviewRouter.post(
  '/comment',
  validate(createReviewCommentSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(reviewController.createReviewComment),
)

// Lấy comments của review
userReviewRouter.get(
  '/comments/:review_id',
  validate(getReviewCommentsSchema),
  asyncHandler(reviewController.getReviewComments),
)

// Kiểm tra có thể đánh giá purchase không
userReviewRouter.get(
  '/can-review/:purchase_id',
  validate(canReviewPurchaseSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(reviewController.canReviewPurchase),
)

// Cập nhật review (chỉ chủ sở hữu)
userReviewRouter.put(
  '/:review_id',
  validate(updateReviewSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(reviewController.updateReview),
)

// Xóa review (chỉ chủ sở hữu)
userReviewRouter.delete(
  '/:review_id',
  validate(deleteReviewSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(reviewController.deleteReview),
)
