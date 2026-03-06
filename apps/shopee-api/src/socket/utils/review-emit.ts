import { SOCKET_CONFIG } from '@constants/socket'
import { SocketEvent, NewReviewPayload, NewReviewCommentPayload, ReviewLikedPayload } from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'

/**
 * Emit a new review event to all users viewing a product (exclude creator)
 * @param productId - The product ID
 * @param review - The review data
 * @param excludeSocketId - Socket ID of the review creator to exclude
 */
export const emitNewReview = (
  productId: string,
  review: NewReviewPayload['review'],
  excludeSocketId?: string
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}${productId}`

    const payload: NewReviewPayload = {
      product_id: productId,
      review,
    }

    if (excludeSocketId) {
      io.to(room).except(excludeSocketId).emit(SocketEvent.NEW_REVIEW, payload)
    } else {
      io.to(room).emit(SocketEvent.NEW_REVIEW, payload)
    }

    Logger.apiInfo('New review emitted to product room', {
      productId,
      room,
      reviewId: review._id,
    })
  } catch (error) {
    Logger.apiError('Failed to emit new review', {
      productId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Emit a new review comment event to all users viewing a product
 * @param productId - The product ID
 * @param reviewId - The review ID
 * @param comment - The comment data
 */
export const emitNewReviewComment = (
  productId: string,
  reviewId: string,
  comment: NewReviewCommentPayload['comment']
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}${productId}`

    const payload: NewReviewCommentPayload = {
      product_id: productId,
      review_id: reviewId,
      comment,
    }

    io.to(room).emit(SocketEvent.NEW_REVIEW_COMMENT, payload)

    Logger.apiInfo('New review comment emitted to product room', {
      productId,
      room,
      reviewId,
      commentId: comment._id,
    })
  } catch (error) {
    Logger.apiError('Failed to emit new review comment', {
      productId,
      reviewId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Emit a review liked event to all users viewing a product
 * @param productId - The product ID
 * @param reviewId - The review ID
 * @param helpfulCount - Updated helpful count
 */
export const emitReviewLiked = (
  productId: string,
  reviewId: string,
  helpfulCount: number
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}${productId}`

    const payload: ReviewLikedPayload = {
      product_id: productId,
      review_id: reviewId,
      helpful_count: helpfulCount,
    }

    io.to(room).emit(SocketEvent.REVIEW_LIKED, payload)

    Logger.apiInfo('Review liked emitted to product room', {
      productId,
      room,
      reviewId,
      helpfulCount,
    })
  } catch (error) {
    Logger.apiError('Failed to emit review liked', {
      productId,
      reviewId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

