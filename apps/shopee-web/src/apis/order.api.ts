import { Order, OrderListResponse } from 'src/types/checkout.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const URL = '/orders'

export interface OrderQueryParams {
  status?: string
  page?: number
  limit?: number
}

const orderApi = {
  getOrders: (params: OrderQueryParams) => {
    return http.get<SuccessResponseApi<OrderListResponse>>(URL, { params })
  },

  getOrderById: (id: string) => {
    return http.get<SuccessResponseApi<Order>>(`${URL}/${id}`)
  },

  cancelOrder: (id: string, reason?: string) => {
    return http.put<SuccessResponseApi<Order>>(`${URL}/${id}/cancel`, { reason })
  },

  returnOrder: (id: string, reason: string) => {
    return http.put<SuccessResponseApi<Order>>(`${URL}/${id}/return`, { reason })
  },

  confirmReceived: (id: string) => {
    return http.put<SuccessResponseApi<Order>>(`${URL}/${id}/confirm-received`)
  },
}

export default orderApi
