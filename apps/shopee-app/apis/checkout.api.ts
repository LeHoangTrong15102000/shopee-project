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
  type: 'cod' | 'bank_transfer'
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

// ─── Checkout API ─────────────────────────────────────────────────────────────

export async function getCheckoutSummary(body: CheckoutSummaryBody) {
  const res = await http.post<ApiResponse<CheckoutSummary>>('checkout/summary', body)
  return res.data
}

export async function getShippingMethods() {
  const res = await http.get<ApiResponse<ShippingMethod[]>>('shipping-methods')
  return res.data
}

export async function getPaymentMethods() {
  const res = await http.get<ApiResponse<PaymentMethod[]>>('payment-methods')
  return res.data
}

export async function createOrder(body: CreateOrderBody) {
  const res = await http.post<ApiResponse<{ order_id: string }>>('orders', body)
  return res.data
}
