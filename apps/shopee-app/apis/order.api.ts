import http from '@/utils/http'

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
  status: number
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

export async function getOrders(params: { status?: number; page?: number; limit?: number } = {}) {
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
