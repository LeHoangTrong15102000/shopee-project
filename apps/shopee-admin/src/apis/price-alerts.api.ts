import http from 'src/utils/http'
import type { SuccessResponse } from 'src/types'

export interface PriceAlert {
  _id: string
  user: string | { _id: string; name: string; email: string }
  product: string | { _id: string; name: string }
  target_price: number
  current_price: number
  is_triggered: boolean
  createdAt: string
}

export interface PriceAlertListResponse {
  alerts: PriceAlert[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const priceAlertsApi = {
  getPriceAlerts: (page = 1) =>
    http.get<SuccessResponse<PriceAlertListResponse>>('admin/price-alerts', {
      params: { page, limit: 10 },
    }),
}

export default priceAlertsApi
