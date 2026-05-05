import http from 'src/utils/http'
import type { SuccessResponse } from 'src/types'

export interface TrackingEvent {
  status: string
  description: string
  timestamp: string
  location?: string
}

export interface OrderTracking {
  orderId: string
  carrier?: string
  trackingNumber?: string
  estimatedDelivery?: string
  currentStatus?: string
  events: TrackingEvent[]
}

const trackingApi = {
  getOrderTracking: (orderId: string) =>
    http.get<SuccessResponse<OrderTracking>>(`orders/${orderId}/tracking`),
}

export default trackingApi
