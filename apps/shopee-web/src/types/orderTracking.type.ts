// OrderStatus - aligned with backend TRACKING_STATUS + ORDER_STATUS
// Backend TRACKING_STATUS: pending, confirmed, processing, shipping, delivered, cancelled
// Backend ORDER_STATUS also has: returned
export type OrderStatus =
  | 'pending' // Chờ xác nhận
  | 'confirmed' // Đã xác nhận
  | 'processing' // Đang xử lý
  | 'shipping' // Đang giao
  | 'delivered' // Đã giao
  | 'cancelled' // Đã hủy
  | 'returned' // Đã trả hàng

// Matches backend ITrackingEvent (schema has _id: false, so NO _id field)
export interface TrackingEvent {
  status: string
  description: string
  location?: string
  timestamp: string // Date serialized to string from backend
}

// Matches backend IShippingAddress
export interface ShippingAddress {
  name: string
  phone: string
  address: string
  province: string
  district: string
  ward: string
}

// Matches backend IOrderTracking response shape exactly
export interface OrderTracking {
  _id: string
  order_id: string
  user_id: string
  tracking_number: string
  carrier: string
  status: OrderStatus
  estimated_delivery: string
  actual_delivery?: string
  timeline: TrackingEvent[]
  shipping_address: ShippingAddress
  createdAt: string
  updatedAt: string
}

// Query params for API calls
export interface OrderTrackingConfig {
  order_id?: string
  tracking_number?: string
  status?: string
}

// Re-export carrier utilities from centralized config
export { CARRIER_DISPLAY_NAMES, getCarrierDisplayName } from 'src/config/orderStatus'
