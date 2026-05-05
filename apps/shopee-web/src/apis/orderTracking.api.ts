import { OrderTracking, OrderTrackingConfig } from 'src/types/orderTracking.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const orderTrackingApi = {
  // Lấy thông tin tracking của đơn hàng
  getTracking: (params: OrderTrackingConfig) => {
    return http.get<SuccessResponseApi<OrderTracking>>('/orders/tracking', { params })
  },

  // Lấy tracking theo tracking number (public)
  getTrackingByNumber: (trackingNumber: string) => {
    return http.get<SuccessResponseApi<OrderTracking>>(`/tracking/${trackingNumber}`)
  },
}

export default orderTrackingApi
