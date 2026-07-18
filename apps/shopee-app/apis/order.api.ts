import http from '@/utils/http'
import { type OrderStatusType } from '@/constants/order'
import { type ApiResponse, type Pagination } from '@/types/api.type'
import { type TrackingUpdate } from '@/types/tracking.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderProduct {
  _id: string
  name: string
  image: string
  price: number
  price_before_discount: number
  quantity: number
}

export interface OrderItem {
  _id: string
  product: OrderProduct
  buy_count: number
  price: number
  price_before_discount: number
}

export interface Order {
  _id: string
  status: OrderStatusType
  items: OrderItem[]
  total_price: number
  address: string
  payment_method: string
  createdAt: string
  updatedAt: string
}

export interface OrdersPage {
  orders: Order[]
  pagination: Pagination
}

// ─── Order API ────────────────────────────────────────────────────────────────

export async function getOrders(
  params: { status?: OrderStatusType; page?: number; limit?: number } = {}
) {
  const res = await http.get<ApiResponse<OrdersPage>>('orders', { params })
  return res.data
}

export async function getOrderDetail(orderId: string) {
  const res = await http.get<ApiResponse<Order>>(`orders/${orderId}`)
  return res.data
}

export async function cancelOrder(orderId: string) {
  const res = await http.put<ApiResponse<Order>>(`orders/${orderId}/cancel`)
  return res.data
}

export async function confirmReceived(orderId: string) {
  const res = await http.put<ApiResponse<Order>>(`orders/${orderId}/confirm-received`)
  return res.data
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

import { type CartItemInput } from '@/apis/cart.api'

export async function getOrderItems(orderId: string): Promise<CartItemInput[]> {
  const orderRes = await http.get<ApiResponse<Order>>(`orders/${orderId}`)
  const order = orderRes.data.data
  return order.items.map((item) => ({
    product_id: item.product._id,
    buy_count: item.buy_count,
  }))
}

// ─── Return Request ───────────────────────────────────────────────────────────

export type ReturnReason = 'damaged' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'other'

export interface ReturnPayload {
  reason: ReturnReason
  description?: string
}

export async function requestReturn(orderId: string, payload: ReturnPayload): Promise<void> {
  await http.put<ApiResponse<unknown>>(`orders/${orderId}/return`, payload)
}

// ─── Payment Retry / Status ───────────────────────────────────────────────────

export interface RetryPaymentResult {
  paymentUrl: string
  paymentId: string
}

export type OrderPaymentStatusValue = 'PENDING' | 'SUCCESS' | 'FAILED' | 'NONE'

export interface OrderPaymentStatus {
  status: OrderPaymentStatusValue
  paymentUrl: string | null
  canRetry: boolean
  provider: string | null
}

/**
 * POST orders/:id/retry-payment — generate a new payment URL for a failed/expired payment.
 * Returns { paymentUrl, paymentId }.
 */
export async function retryOrderPayment(orderId: string): Promise<RetryPaymentResult> {
  const res = await http.post<ApiResponse<RetryPaymentResult>>(`orders/${orderId}/retry-payment`)
  return res.data.data
}

/**
 * GET orders/:id/payment-status — get current payment status.
 * Rate-limited to 20 req/min server-side — callers must poll conservatively.
 */
export async function getOrderPaymentStatus(orderId: string): Promise<OrderPaymentStatus> {
  const res = await http.get<ApiResponse<OrderPaymentStatus>>(`orders/${orderId}/payment-status`)
  return res.data.data
}

// ─── Order Tracking ───────────────────────────────────────────────────────────

/**
 * GET orders/:id/tracking — get GPS realtime tracking data.
 * Already provided by tracking.api.ts; re-exported here for module cohesion.
 */
export async function getOrderTracking(orderId: string): Promise<TrackingUpdate> {
  const res = await http.get<ApiResponse<TrackingUpdate>>(`orders/${orderId}/tracking`)
  return res.data.data
}
