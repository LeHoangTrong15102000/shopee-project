import http from 'src/utils/http'
import {
  Review,
  ReviewListResponse,
  CreateReviewData,
  CreateCommentData,
  CommentListResponse,
  CanReviewResponse,
  ReviewQuery,
  ReviewComment,
} from 'src/types/review.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import { buildCommentTree } from 'src/utils/commentTree'

const URL = 'reviews'

// API functions
const reviewApi = {
  // Tạo review mới
  createReview: (body: CreateReviewData) => {
    return http.post<SuccessResponseApi<Review>>(`${URL}`, body)
  },

  // Cập nhật review
  updateReview: (
    reviewId: string,
    body: { rating?: number; comment?: string; images?: string[] },
  ) => {
    return http.put<SuccessResponseApi<Review>>(`${URL}/${reviewId}`, body)
  },

  // Xóa review
  deleteReview: (reviewId: string) => {
    return http.delete<SuccessResponseApi<{ deleted: boolean }>>(`${URL}/${reviewId}`)
  },

  // Lấy reviews của sản phẩm
  getProductReviews: (productId: string, params?: ReviewQuery) => {
    return http.get<SuccessResponseApi<ReviewListResponse>>(`${URL}/product/${productId}`, {
      params,
    })
  },

  // Like/Unlike review
  toggleReviewLike: (reviewId: string) => {
    return http.post<SuccessResponseApi<{ is_liked: boolean; helpful_count: number }>>(
      `${URL}/like/${reviewId}`,
    )
  },

  // Tạo comment
  createComment: (body: CreateCommentData) => {
    return http.post<SuccessResponseApi<ReviewComment>>(`${URL}/comment`, body)
  },

  // Lấy comments của review
  getReviewComments: async (reviewId: string, params?: { page?: number; limit?: number }) => {
    const response = await http.get<SuccessResponseApi<CommentListResponse>>(
      `${URL}/comments/${reviewId}`,
      { params },
    )
    // Rebuild tree từ flat array response của API
    if (response.data?.data?.comments) {
      response.data.data.comments = buildCommentTree(response.data.data.comments)
    }
    return response
  },

  // Kiểm tra có thể đánh giá purchase không
  canReviewPurchase: (purchaseId: string) => {
    return http.get<SuccessResponseApi<CanReviewResponse>>(`${URL}/can-review/${purchaseId}`)
  },
}

export default reviewApi
