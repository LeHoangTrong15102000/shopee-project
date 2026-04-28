import http from '@/utils/http'
import { TrackingUpdate } from '@/types/tracking.type'

interface ApiResponse<T> {
  message: string
  data: T
}

export async function getOrderTracking(orderId: string): Promise<TrackingUpdate> {
  const res = await http.get<ApiResponse<TrackingUpdate>>(`orders/${orderId}/tracking`)
  return res.data.data
}
