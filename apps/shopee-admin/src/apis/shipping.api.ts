import http from 'src/utils/http'
import type { SuccessResponse } from 'src/types'

export interface ShippingMethod {
  _id: string
  name: string
  code: string
  description?: string
  base_cost: number
  estimated_days: number
  is_active: boolean
  createdAt: string
}

const shippingApi = {
  getShippingMethods: () =>
    http.get<SuccessResponse<ShippingMethod[]>>('orders/shipping/methods'),
}

export default shippingApi
