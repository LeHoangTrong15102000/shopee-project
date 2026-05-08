import http from '@/utils/http'
import { type ApiResponse, type Pagination } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShopSummary {
  _id: string
  name: string
  avatar: string
  rating: number
}

export interface ProductDetail {
  _id: string
  name: string
  image: string
  images: string[]
  description: string
  category: { _id: string; name: string }
  price: number
  rating: number
  price_before_discount: number
  quantity: number
  sold: number
  view: number
  shopSummary?: ShopSummary
  createdAt: string
  updatedAt: string
}

export interface Review {
  _id: string
  user: { _id: string; name: string; email: string; avatar?: string }
  product: { _id: string; name: string; image: string }
  purchase: string
  rating: number
  comment: string
  images: string[]
  helpful_count: number
  is_liked?: boolean
  createdAt: string
  updatedAt: string
}

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_breakdown: Record<number, number>
}

export interface Question {
  _id: string
  product_id: string
  user_id: string
  user_name: string
  user_avatar?: string
  question: string
  answers: Answer[]
  likes_count: number
  is_liked: boolean
  createdAt: string
  updatedAt: string
}
export interface Answer {
  _id: string
  user_id: string
  user_name: string
  user_avatar?: string
  is_seller: boolean
  answer: string
  likes_count: number
  is_liked: boolean
  created_at: string
}

// ─── Product Detail API ──────────────────────────────────────────────────────

export async function getProductDetail(productId: string) {
  const res = await http.get<ApiResponse<ProductDetail>>(`products/${productId}`)
  return res.data
}

// ─── Reviews API ─────────────────────────────────────────────────────────────

export async function getProductReviews(productId: string, page: number) {
  const res = await http.get<
    ApiResponse<{ reviews: Review[]; pagination: Pagination; stats: ReviewStats }>
  >(`reviews/product/${productId}`, { params: { page, limit: 5 } })
  return res.data
}

export async function toggleReviewLike(reviewId: string) {
  const res = await http.post<ApiResponse<{ is_liked: boolean; helpful_count: number }>>(
    `reviews/like/${reviewId}`
  )
  return res.data
}

// ─── Q&A API ─────────────────────────────────────────────────────────────────
export async function getQuestions(productId: string, page: number) {
  const res = await http.get<ApiResponse<{ questions: Question[]; pagination: Pagination }>>(
    'qa/questions',
    { params: { product_id: productId, page, limit: 5 } }
  )
  return res.data
}

export async function askQuestion(body: { product_id: string; question: string }) {
  const res = await http.post<ApiResponse<Question>>('qa/questions', body)
  return res.data
}

export async function answerQuestion(questionId: string, body: { answer: string }) {
  const res = await http.post<ApiResponse<Answer>>(`qa/questions/${questionId}/answers`, body)
  return res.data
}

export async function likeQuestion(questionId: string) {
  const res = await http.post<ApiResponse<{ is_liked: boolean; likes_count: number }>>(
    `qa/questions/${questionId}/like`
  )
  return res.data
}

export async function likeAnswer(questionId: string, answerId: string) {
  const res = await http.post<ApiResponse<{ is_liked: boolean; likes_count: number }>>(
    `qa/questions/${questionId}/answers/${answerId}/like`
  )
  return res.data
}

// ─── Purchase API ────────────────────────────────────────────────────────────

export async function addToCart(body: { product_id: string; buy_count: number }) {
  const res = await http.post<ApiResponse<unknown>>('purchases/add-to-cart', body)
  return res.data
}

export async function buyNow(body: { product_id: string; buy_count: number }) {
  const res = await http.post<ApiResponse<unknown>>('purchases/buy-products', [body])
  return res.data
}

// ─── Related Products API ────────────────────────────────────────────────────

export async function getRelatedProducts(categoryId: string, excludeProductId: string) {
  const res = await http.get<ApiResponse<{ products: ProductDetail[]; pagination: Pagination }>>(
    'products',
    { params: { category: categoryId, limit: 10, exclude: excludeProductId } }
  )
  return res.data
}
