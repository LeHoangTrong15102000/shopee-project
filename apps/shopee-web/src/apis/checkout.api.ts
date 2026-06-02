import { SuccessResponseApi } from 'src/types/utils.type'
import {
  ShippingMethod,
  PaymentMethod,
  Order,
  CreateOrderBody,
  CreateOrderResponse,
  CheckoutSummary,
  InitiatePaymentBody,
  InitiatePaymentResponse,
  PaymentSessionStatusResponse,
} from 'src/types/checkout.type'
import http from 'src/utils/http'
import { mockShippingMethods, mockPaymentMethods } from 'src/mocks/checkout.mock'

const checkoutApi = {
  getShippingMethods: async () => {
    try {
      return await http.get<SuccessResponseApi<ShippingMethod[]>>('/orders/shipping/methods')
    } catch (_error) {
      console.warn('Shipping methods API not available, using mock data')
      return {
        data: { message: 'Mock shipping methods', data: mockShippingMethods },
      } as SuccessResponseApi<ShippingMethod[]> & {
        data: { message: string; data: ShippingMethod[] }
      }
    }
  },

  getPaymentMethods: async () => {
    try {
      return await http.get<SuccessResponseApi<PaymentMethod[]>>('/orders/payment/methods')
    } catch (_error) {
      console.warn('Payment methods API not available, using mock data')
      return {
        data: { message: 'Mock payment methods', data: mockPaymentMethods },
      } as SuccessResponseApi<PaymentMethod[]> & {
        data: { message: string; data: PaymentMethod[] }
      }
    }
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
    return http.post<SuccessResponseApi<CreateOrderResponse>>('/checkout/create-order', {
      purchase_ids: body.purchaseIds,
      shipping_address_id: body.shippingAddressId,
      shipping_method_id: body.shippingMethodId,
      payment_method: body.paymentMethod,
      voucher_code: body.voucherCode,
      coins_used: body.coinsUsed,
      note: body.note,
    })
  },

  initiatePayment: (body: InitiatePaymentBody) => {
    return http.post<SuccessResponseApi<InitiatePaymentResponse>>('/checkout/initiate-payment', {
      purchase_ids: body.purchaseIds,
      shipping_address_id: body.shippingAddressId,
      shipping_method_id: body.shippingMethodId,
      payment_method: body.paymentMethod,
      e_wallet_provider: body.eWalletProvider,
      voucher_code: body.voucherCode,
      coins_used: body.coinsUsed,
      note: body.note,
    })
  },

  getSessionStatus: (sessionId: string) => {
    return http.get<SuccessResponseApi<PaymentSessionStatusResponse>>(
      `/checkout/session-status/${sessionId}`,
    )
  },
}

export default checkoutApi
