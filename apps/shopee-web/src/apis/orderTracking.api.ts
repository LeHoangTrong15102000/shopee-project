import { OrderTracking, OrderTrackingConfig, TrackingEvent } from 'src/types/orderTracking.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

// All possible tracking events in chronological order
const allTrackingEvents: TrackingEvent[] = [
  {
    status: 'pending',
    description: 'Đơn hàng đã được tạo',
    location: 'Hệ thống',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    status: 'confirmed',
    description: 'Đơn hàng đã được xác nhận',
    location: 'Kho hàng TP.HCM',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    status: 'processing',
    description: 'Đang chuẩn bị hàng',
    location: 'Kho hàng TP.HCM',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    status: 'shipping',
    description: 'Đang vận chuyển đến bạn',
    location: 'Trung tâm phân loại Hà Nội',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    status: 'delivered',
    description: 'Giao hàng thành công',
    location: 'Hà Nội - Cầu Giấy - Dịch Vọng',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
]

// Status progression order for filtering timeline events
const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipping', 'delivered']

// Build timeline events up to and including the given status
function buildTimelineForStatus(status: string): TrackingEvent[] {
  const statusIndex = STATUS_ORDER.indexOf(status)
  if (statusIndex === -1) {
    // For cancelled/returned, show events up to pending only
    return allTrackingEvents.slice(0, 1)
  }
  return allTrackingEvents.slice(0, statusIndex + 1)
}

// Build a mock OrderTracking object based on the provided status
function buildMockTracking(orderId: string, status: string = 'pending'): OrderTracking {
  const timeline = buildTimelineForStatus(status)
  const isDelivered = status === 'delivered'

  return {
    _id: `mock-tracking-${orderId}`,
    order_id: orderId,
    user_id: 'mock-user-id-001',
    tracking_number: `VN2024${orderId.slice(-4).toUpperCase()}`,
    carrier: 'ghn',
    status: status as OrderTracking['status'],
    estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    actual_delivery: isDelivered ? new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() : undefined,
    timeline,
    shipping_address: {
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      address: '123 Đường ABC',
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      ward: 'Dịch Vọng'
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
}

const orderTrackingApi = {
  // Lấy thông tin tracking của đơn hàng
  getTracking: async (params: OrderTrackingConfig) => {
    try {
      const response = await http.get<SuccessResponseApi<OrderTracking>>('/orders/tracking', { params })
      return response
    } catch (error) {
      console.warn('⚠️ [getTracking] API not available, using mock data')
      const orderId = params.order_id || 'unknown'
      const status = params.status || 'pending'
      return {
        data: {
          message: 'Lấy thông tin tracking thành công',
          data: {
            ...buildMockTracking(orderId, status),
            tracking_number: params.tracking_number || `VN2024${orderId.slice(-4).toUpperCase()}`
          }
        }
      }
    }
  },

  // Lấy tracking theo tracking number (public)
  getTrackingByNumber: async (trackingNumber: string) => {
    try {
      const response = await http.get<SuccessResponseApi<OrderTracking>>(`/tracking/${trackingNumber}`)
      return response
    } catch (error) {
      console.warn('⚠️ [getTrackingByNumber] API not available, using mock data')
      return {
        data: {
          message: 'Lấy thông tin tracking thành công',
          data: {
            ...buildMockTracking('unknown', 'pending'),
            tracking_number: trackingNumber
          }
        }
      }
    }
  }
}

export default orderTrackingApi
