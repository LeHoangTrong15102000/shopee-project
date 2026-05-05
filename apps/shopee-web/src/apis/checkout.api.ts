import { SuccessResponseApi } from 'src/types/utils.type'
import {
  ShippingMethod,
  PaymentMethod,
  Order,
  CreateOrderBody,
  CheckoutSummary,
} from 'src/types/checkout.type'
import http from 'src/utils/http'

const checkoutApi = {
  getShippingMethods: () => {
    return http.get<SuccessResponseApi<ShippingMethod[]>>('/orders/shipping/methods')
  },

  getPaymentMethods: () => {
    return http.get<SuccessResponseApi<PaymentMethod[]>>('/orders/payment/methods')
  },

  calculateSummary: (body: {
    purchaseIds: string[]
    shippingMethodId?: string
    voucherCode?: string
    coinsUsed?: number
  }) => {
    return http.post<SuccessResponseApi<CheckoutSummary>>('/checkout/summary', {
      purchase_ids: body.purchaseIds,
      shipping_method_id: body.shippingMethodId,
      voucher_code: body.voucherCode,
      coins_used: body.coinsUsed,
    })
  },

  createOrder: (body: CreateOrderBody) => {
    return http.post<SuccessResponseApi<Order>>('/checkout/create-order', {
      purchase_ids: body.purchaseIds,
      shipping_address_id: body.shippingAddressId,
      shipping_method_id: body.shippingMethodId,
      payment_method: body.paymentMethod,
      voucher_code: body.voucherCode,
      coins_used: body.coinsUsed,
      note: body.note,
    })
  },
}

export default checkoutApi
