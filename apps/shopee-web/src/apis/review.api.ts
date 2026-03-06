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
  ReviewStats
} from 'src/types/review.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import { buildCommentTree } from 'src/utils/commentTree'

const URL = 'reviews'

// Mock data for fallback when API is not available
const mockReviews: Review[] = [
  {
    _id: 'review1',
    user: { _id: 'user1', name: 'Nguyễn Văn An', email: 'an@example.com', avatar: '' },
    product: { _id: 'product1', name: 'Sản phẩm mẫu', image: '' },
    purchase: 'purchase1',
    rating: 5,
    comment: 'Sản phẩm rất tốt, đóng gói cẩn thận, giao hàng nhanh. Rất hài lòng với chất lượng!',
    images: [],
    helpful_count: 12,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    is_liked: false,
    comments_count: 2
  },
  {
    _id: 'review2',
    user: { _id: 'user2', name: 'Trần Thị Bình', email: 'binh@example.com', avatar: '' },
    product: { _id: 'product1', name: 'Sản phẩm mẫu', image: '' },
    purchase: 'purchase2',
    rating: 4,
    comment: 'Chất lượng ổn so với giá tiền. Shop tư vấn nhiệt tình, sẽ ủng hộ lần sau.',
    images: [],
    helpful_count: 8,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    is_liked: false,
    comments_count: 1
  },
  {
    _id: 'review3',
    user: { _id: 'user3', name: 'Lê Minh Cường', email: 'cuong@example.com', avatar: '' },
    product: { _id: 'product1', name: 'Sản phẩm mẫu', image: '' },
    purchase: 'purchase3',
    rating: 3,
    comment: 'Sản phẩm tạm được, giao hàng hơi chậm nhưng đóng gói kỹ.',
    images: [],
    helpful_count: 3,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    is_liked: false,
    comments_count: 0
  },
  {
    _id: 'review4',
    user: { _id: 'user4', name: 'Phạm Thị Dung', email: 'dung@example.com', avatar: '' },
    product: { _id: 'product1', name: 'Sản phẩm mẫu', image: '' },
    purchase: 'purchase4',
    rating: 5,
    comment: 'Mua lần thứ 3 rồi, chất lượng luôn đảm bảo. Giá cả hợp lý, giao hàng nhanh chóng!',
    images: [],
    helpful_count: 15,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    is_liked: false,
    comments_count: 3
  }
]

const mockReviewStats: ReviewStats = {
  total_reviews: 4,
  average_rating: 4.25,
  rating_breakdown: {
    1: 0,
    2: 0,
    3: 1,
    4: 1,
    5: 2
  }
}

const mockComments: ReviewComment[] = [
  {
    _id: 'comment1',
    user: { _id: 'user5', name: 'Hoàng Văn Em', email: 'em@example.com', avatar: '' },
    review: 'review1',
    content: 'Bạn mua size nào vậy? Mình đang phân vân.',
    level: 0,
    replies_count: 1,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    replies: [
      {
        _id: 'comment2',
        user: { _id: 'user1', name: 'Nguyễn Văn An', email: 'an@example.com', avatar: '' },
        review: 'review1',
        content: 'Mình mua size M, vừa vặn lắm bạn ơi!',
        parent_comment: 'comment1',
        level: 1,
        replies_count: 0,
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString()
      }
    ]
  },
  {
    _id: 'comment3',
    user: { _id: 'user6', name: 'Vũ Thị Phương', email: 'phuong@example.com', avatar: '' },
    review: 'review1',
    content: 'Cảm ơn bạn đã chia sẻ, mình cũng định mua sản phẩm này.',
    level: 0,
    replies_count: 0,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  }
]

// API functions
const reviewApi = {
  // Tạo review mới
  createReview: async (body: CreateReviewData) => {
    try {
      return await http.post<SuccessResponseApi<Review>>(`${URL}`, body)
    } catch (error) {
      console.warn('⚠️ [createReview] API not available, using mock data')
      const newReview: Review = {
        _id: `review-${Date.now()}`,
        user: { _id: 'mock-user-id', name: 'Người dùng', email: 'user@example.com', avatar: '' },
        product: { _id: 'product1', name: 'Sản phẩm', image: '' },
        purchase: body.purchase_id,
        rating: body.rating,
        comment: body.comment,
        images: body.images || [],
        helpful_count: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        is_liked: false,
        comments_count: 0
      }
      return {
        data: {
          message: 'Tạo đánh giá thành công (mock)',
          data: newReview
        }
      }
    }
  },

  // Cập nhật review
  updateReview: async (reviewId: string, body: { rating?: number; comment?: string; images?: string[] }) => {
    try {
      return await http.put<SuccessResponseApi<Review>>(`${URL}/${reviewId}`, body)
    } catch (error) {
      console.warn('⚠️ [updateReview] API not available, using mock data')
      const updatedReview: Review = {
        ...mockReviews[0],
        _id: reviewId,
        rating: body.rating ?? mockReviews[0].rating,
        comment: body.comment ?? mockReviews[0].comment,
        images: body.images ?? mockReviews[0].images,
        updatedAt: new Date().toISOString()
      }
      return {
        data: {
          message: 'Cập nhật đánh giá thành công (mock)',
          data: updatedReview
        }
      }
    }
  },

  // Xóa review
  deleteReview: async (reviewId: string) => {
    try {
      return await http.delete<SuccessResponseApi<{ deleted: boolean }>>(`${URL}/${reviewId}`)
    } catch (error) {
      console.warn('⚠️ [deleteReview] API not available, using mock data')
      return {
        data: {
          message: 'Xóa đánh giá thành công (mock)',
          data: { deleted: true }
        }
      }
    }
  },

  // Lấy reviews của sản phẩm
  getProductReviews: async (productId: string, params?: ReviewQuery) => {
    try {
      const response = await http.get<SuccessResponseApi<ReviewListResponse>>(`${URL}/product/${productId}`, {
        params
      })
      return response
    } catch (error) {
      console.warn('Review API not available, using mock data')
      return {
        data: {
          message: 'Lấy danh sách đánh giá thành công',
          data: {
            reviews: mockReviews,
            pagination: {
              page: params?.page || 1,
              limit: params?.limit || 10,
              total: mockReviews.length,
              total_pages: 1
            },
            stats: mockReviewStats
          } as ReviewListResponse
        }
      }
    }
  },

  // Like/Unlike review
  toggleReviewLike: async (reviewId: string) => {
    try {
      const response = await http.post<SuccessResponseApi<{ is_liked: boolean; helpful_count: number }>>(
        `${URL}/like/${reviewId}`
      )
      return response
    } catch (error) {
      console.warn('Review like API not available, using mock data')
      return {
        data: {
          message: 'Thao tác thành công',
          data: { is_liked: true, helpful_count: 1 }
        }
      }
    }
  },

  // Tạo comment
  createComment: async (body: CreateCommentData) => {
    try {
      return await http.post<SuccessResponseApi<ReviewComment>>(`${URL}/comment`, body)
    } catch (error) {
      console.warn('⚠️ [createComment] API not available, using mock data')
      const newComment: ReviewComment = {
        _id: `comment-${Date.now()}`,
        user: { _id: 'mock-user-id', name: 'Người dùng', email: 'user@example.com', avatar: '' },
        review: body.review_id,
        content: body.content,
        parent_comment: body.parent_comment_id,
        level: body.parent_comment_id ? 1 : 0,
        replies_count: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return {
        data: {
          message: 'Tạo bình luận thành công (mock)',
          data: newComment
        }
      }
    }
  },

  // Lấy comments của review
  getReviewComments: async (reviewId: string, params?: { page?: number; limit?: number }) => {
    try {
      const response = await http.get<SuccessResponseApi<CommentListResponse>>(`${URL}/comments/${reviewId}`, {
        params
      })
      // Rebuild tree từ flat array response của API
      if (response.data?.data?.comments) {
        response.data.data.comments = buildCommentTree(response.data.data.comments)
      }
      return response
    } catch (error) {
      console.warn('Review comments API not available, using mock data')
      return {
        data: {
          message: 'Lấy danh sách bình luận thành công',
          data: {
            comments: mockComments,
            pagination: {
              page: params?.page || 1,
              limit: params?.limit || 10,
              total: mockComments.length,
              total_pages: 1
            }
          } as CommentListResponse
        }
      }
    }
  },

  // Kiểm tra có thể đánh giá purchase không
  canReviewPurchase: async (purchaseId: string) => {
    try {
      const response = await http.get<SuccessResponseApi<CanReviewResponse>>(`${URL}/can-review/${purchaseId}`)
      return response
    } catch (error) {
      console.warn('Can review API not available, using mock data')
      return {
        data: {
          message: 'Kiểm tra quyền đánh giá thành công',
          data: { can_review: false, reason: 'Bạn chưa mua sản phẩm này' } as CanReviewResponse
        }
      }
    }
  }
}

export default reviewApi
