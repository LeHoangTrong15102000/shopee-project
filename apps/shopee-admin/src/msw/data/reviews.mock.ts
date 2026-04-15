import { createMockReview } from 'src/test-utils/factories'
import type { Review } from 'src/types'

export const mockReviews: Review[] = [
  createMockReview({ _id: 'review-1', rating: 5, comment: 'Sản phẩm rất tốt, giao hàng nhanh' }),
  createMockReview({ _id: 'review-2', rating: 4, comment: 'Chất lượng ổn, giá hợp lý' }),
  createMockReview({ _id: 'review-3', rating: 3, comment: 'Bình thường, không có gì đặc biệt' }),
  createMockReview({ _id: 'review-4', rating: 2, comment: 'Hàng không đúng mô tả' }),
  createMockReview({ _id: 'review-5', rating: 1, comment: 'Rất tệ, không nên mua' }),
]
