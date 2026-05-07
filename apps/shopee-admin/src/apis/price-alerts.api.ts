import http from 'src/utils/http'
import type { SuccessResponse } from 'src/types'

export interface PriceAlert {
  _id: string
  user: string | { _id: string; name: string; email: string }
  product: string | { _id: string; name: string }
  target_price: number
  current_price: number
  is_triggered: boolean
  is_active: boolean
  triggered_at?: string
  createdAt: string
}

export interface PriceAlertListResponse {
  alerts: PriceAlert[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface PriceAlertStats {
  total_active: number
  triggered_today: number
  expired: number
  most_watched_products: Array<{
    product_id: string
    product_name: string
    product_image?: string
    alert_count: number
  }>
}

export interface PriceAlertListParams {
  page?: number
  limit?: number
  user_id?: string
  product_id?: string
  status?: 'active' | 'triggered' | 'expired' | ''
}

const priceAlertsApi = {
  getPriceAlerts: (params?: PriceAlertListParams) =>
    http.get<SuccessResponse<PriceAlertListResponse>>('admin/price-alerts', {
      params: { page: 1, limit: 20, ...params },
    }),

  getAlertStats: () =>
    http.get<SuccessResponse<PriceAlertStats>>('admin/price-alerts/stats'),

  deleteAlert: (id: string) =>
    http.delete<SuccessResponse<null>>(`admin/price-alerts/${id}`),
}

export default priceAlertsApi
