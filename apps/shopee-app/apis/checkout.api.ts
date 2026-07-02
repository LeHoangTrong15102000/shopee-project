import http from '@/utils/http'
import { type ApiResponse } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShippingMethod {
  _id: string
  name: string
  estimated_days: number
  fee: number
}

export interface PaymentMethod {
  _id: string
  name: string
  type: 'cod' | 'bank_transfer' | 'credit_card' | 'momo' | 'vnpay'
}

export interface CheckoutSummaryBody {
  purchase_ids: string[]
  voucher_code?: string
  coins_used?: number
  shipping_method_id?: string
}

export interface CheckoutSummary {
  subtotal: number
  shipping_fee: number
  voucher_discount: number
  coins_discount: number
  coin_balance: number
  total: number
  items: Array<{
    product_id: string
    name: string
    image: string
    quantity: number
    price: number
  }>
}

export interface CreateOrderBody {
  purchase_ids: string[]
  address_id: string
  shipping_method_id: string
  payment_method: string
  voucher_code?: string
  coins_used?: number
}

export interface CreateCreditCardOrderBody {
  purchase_ids: string[]
  shipping_address_id: string
  shipping_method_id: string
  payment_method: 'credit_card'
  voucher_code?: string
  coins_used?: number
}

export interface CreditCardOrder {
  _id: string
  client_secret: string
  [key: string]: unknown
}

export interface InitiateEWalletPaymentBody {
  purchase_ids: string[]
  shipping_address_id: string
  shipping_method_id: string
  e_wallet_provider: 'momo' | 'vnpay'
  return_url: string
  voucher_code?: string
  coins_used?: number
}

export interface EWalletPaymentSession {
  sessionId: string
  payment_url: string
}

export interface OrderPaymentStatus {
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'NONE'
  failure_reason?: string
  paymentUrl: string | null
  canRetry: boolean
  provider: string | null
}

export interface SessionStatus {
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'
  orderId?: string
  failure_reason?: string
}

// ─── Checkout API ─────────────────────────────────────────────────────────────

export async function getCheckoutSummary(body: CheckoutSummaryBody) {
  const res = await http.post<ApiResponse<CheckoutSummary>>('checkout/summary', body)
  return res.data
}

export async function getShippingMethods() {
  const res = await http.get<ApiResponse<ShippingMethod[]>>('orders/shipping/methods')
  return res.data
}

export async function getPaymentMethods() {
  const res = await http.get<ApiResponse<PaymentMethod[]>>('orders/payment/methods')
  return res.data
}

export async function createOrder(body: CreateOrderBody) {
  const res = await http.post<ApiResponse<{ order_id: string }>>('orders', body)
  return res.data
}

/**
 * Create an order with credit_card payment method.
 * Returns the order object including _id and client_secret for Stripe PaymentIntent.
 */
export async function createCreditCardOrder(body: CreateCreditCardOrderBody) {
  const res = await http.post<ApiResponse<CreditCardOrder>>('checkout/create-order', body)
  return res.data
}

/**
 * Initiate an e-wallet payment session (MoMo or VNPay).
 * Returns { sessionId, payment_url } for redirect.
 * Pass return_url as the deep link the provider should redirect back to.
 */
export async function initiateEWalletPayment(body: InitiateEWalletPaymentBody) {
  const res = await http.post<ApiResponse<EWalletPaymentSession>>('checkout/initiate-payment', body)
  return res.data
}

/**
 * Poll the payment status for a credit card order.
 * Returns { status, paymentUrl, canRetry, provider }.
 */
export async function getOrderPaymentStatus(orderId: string) {
  const res = await http.get<ApiResponse<OrderPaymentStatus>>(`orders/${orderId}/payment-status`)
  return res.data
}

/**
 * Poll the status of an e-wallet payment session.
 * Returns { status, orderId? } — orderId is present once IPN creates the order.
 */
export async function getSessionStatus(sessionId: string) {
  const res = await http.get<ApiResponse<SessionStatus>>(`checkout/session-status/${sessionId}`)
  return res.data
}
