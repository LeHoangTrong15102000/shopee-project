import http from 'src/utils/http'
import type {
  SuccessResponse,
  ProductAnalytics,
  ChatbotAnalytics,
  ChatbotPerformanceData,
} from 'src/types'

interface AnalyticsParams {
  period?: string
  limit?: number
  min_reviews?: number
}

interface CategoryStats {
  _id: string
  category_name: string
  product_count: number
  total_stock: number
  total_sold: number
  average_price: number
  average_rating: number
}

const analyticsApi = {
  getTopSelling: (params?: AnalyticsParams) =>
    http.get<SuccessResponse<ProductAnalytics[]>>('admin/products/analytics/top-selling', {
      params,
    }),

  getTopViewed: (params?: { limit?: number }) =>
    http.get<SuccessResponse<ProductAnalytics[]>>('admin/products/analytics/top-viewed', {
      params,
    }),

  getTopRated: (params?: { limit?: number; min_reviews?: number }) =>
    http.get<SuccessResponse<ProductAnalytics[]>>('admin/products/analytics/top-rated', { params }),

  getStatsByCategory: () =>
    http.get<SuccessResponse<CategoryStats[]>>('admin/products/analytics/by-category'),

  getChatbotOverview: () =>
    http.get<SuccessResponse<ChatbotAnalytics>>('admin/analytics/chatbot-overview'),

  getChatbotPerformance: (params?: { period?: string }) =>
    http.get<SuccessResponse<ChatbotPerformanceData[]>>('admin/analytics/chatbot-performance', {
      params,
    }),
}

export default analyticsApi
