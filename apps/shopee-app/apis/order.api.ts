import http from '@/utils/http'
import { type OrderStatusType } from '@/constants/order'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  message: string
  data: T
}

export interface OrderProduct {
  _id: string
  name: string
  image: string
  price: number
  price_before_discount: number
  quantity: number
}

export interface OrderItem {
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
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface TrackingStep {
  status: string
  label: string
  timestamp?: string
  completed: boolean
}

// ─── Order API ────────────────────────────────────────────────────────────────

export async function getOrders(params: { status?: OrderStatusType; page?: number; limit?: number } = {}) {
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
  const res = await http.put<ApiResponse<Order>>(`orders/${orderId}/confirm`)
  return res.data
}

export async function returnOrder(orderId: string) {
  const res = await http.put<ApiResponse<Order>>(`orders/${orderId}/return`)
  return res.data
}

export async function getOrderTracking(orderId: string) {
  const res = await http.get<ApiResponse<TrackingStep[]>>(`orders/${orderId}/tracking`)
  return res.data
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export interface ReorderResult {
  addedCount: number
  skippedItems: string[]
}

interface AddMultipleResponse {
  addedCount: number
  skippedItems: string[]
}

export async function reorderItems(orderId: string): Promise<ReorderResult> {
  const orderRes = await http.get<ApiResponse<Order>>(`orders/${orderId}`)
  const order = orderRes.data.data

  const items = order.items.map((item) => ({
    product_id: item.product._id,
    buy_count: item.buy_count,
  }))

  const res = await http.post<ApiResponse<AddMultipleResponse>>('cart/add-multiple', { items })
  return {
    addedCount: res.data.data.addedCount,
    skippedItems: res.data.data.skippedItems,
  }
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
