import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

export interface PriceAlert {
  _id: string
  productId: string
  productName: string
  productImage?: string
  targetPrice: number
  currentPrice: number
  createdAt: string
}

export interface PriceAlertsResponse {
  alerts: PriceAlert[]
}

const priceAlertApi = {
  getAlerts: () => {
    return http.get<SuccessResponseApi<PriceAlertsResponse>>('/price-alerts')
  },

  deleteAlert: (id: string) => {
    return http.delete<SuccessResponseApi<{ message: string }>>(`/price-alerts/${id}`)
  },
}

export default priceAlertApi
