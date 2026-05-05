import http from 'src/utils/http'
import type { SuccessResponse } from 'src/types'

export interface PaymentMethod {
  _id: string
  name: string
  code: string
  description?: string
  is_enabled: boolean
  createdAt: string
}

const paymentsApi = {
  getPaymentMethods: () =>
    http.get<SuccessResponse<PaymentMethod[]>>('orders/payment/methods'),
}

export default paymentsApi
