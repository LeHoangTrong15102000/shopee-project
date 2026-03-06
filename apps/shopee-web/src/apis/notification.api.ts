import { Notification, NotificationResponse } from 'src/types/notification.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

// Response types for notification API
interface NotificationListBackendResponse {
  message: string
  data: {
    notifications: Record<string, unknown>[]
    pagination?: { page: number; limit: number; total: number; total_pages: number }
    unread_count?: number
    unreadCount?: number
  }
}

interface MarkAsReadBackendResponse {
  message: string
  data: Record<string, unknown>
}

interface UnreadCountBackendResponse {
  message: string
  data: { count?: number; unread_count?: number; unreadCount?: number }
}

// Mock data để fallback khi API chưa available
const mockNotifications: NotificationResponse = {
  message: 'Lấy danh sách thông báo thành công',
  data: {
    notifications: [
      {
        _id: '1',
        title: 'Đơn hàng của bạn đã được xác nhận',
        content: 'Đơn hàng #SP123456 đã được xác nhận và đang được chuẩn bị. Dự kiến giao hàng trong 2-3 ngày.',
        type: 'order' as const,
        isRead: false,
        createdAt: new Date(Date.now() - 60000).toISOString(),
        updatedAt: new Date(Date.now() - 60000).toISOString()
      },
      {
        _id: '2',
        title: 'Flash Sale 12.12 - Giảm giá đến 50%',
        content: 'Sự kiện Flash Sale 12.12 đã bắt đầu! Hàng ngàn sản phẩm giảm giá đến 50%. Mua ngay kẻo lỡ!',
        type: 'promotion' as const,
        isRead: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        _id: '3',
        title: 'Cập nhật chính sách bảo mật',
        content: 'Chúng tôi đã cập nhật chính sách bảo mật để bảo vệ thông tin của bạn tốt hơn. Vui lòng xem chi tiết.',
        type: 'system' as const,
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: '4',
        title: 'Voucher miễn phí vận chuyển',
        content: 'Bạn có 1 voucher miễn phí vận chuyển cho đơn hàng từ 100k. Áp dụng đến hết ngày mai.',
        type: 'promotion' as const,
        isRead: true,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        _id: '5',
        title: 'Đánh giá sản phẩm và nhận xu',
        content: 'Đánh giá sản phẩm bạn đã mua để nhận xu Shopee. Xu có thể dùng để mua sắm tiếp theo.',
        type: 'other' as const,
        isRead: true,
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 259200000).toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 5,
      total_pages: 1
    },
    unreadCount: 2
  }
}

// Helper function để transform backend response (snake_case) sang frontend (camelCase)
const transformNotification = (backendNotification: Record<string, unknown>): Notification => ({
  _id: backendNotification._id as string,
  title: backendNotification.title as string,
  content: backendNotification.content as string,
  type: backendNotification.type as Notification['type'],
  isRead: (backendNotification.is_read ?? backendNotification.isRead ?? false) as boolean,
  link: backendNotification.link as string | undefined,
  createdAt: backendNotification.createdAt as string,
  updatedAt: backendNotification.updatedAt as string
})

const transformNotificationResponse = (backendResponse: NotificationListBackendResponse): NotificationResponse => {
  const data = backendResponse.data
  return {
    message: backendResponse.message,
    data: {
      notifications: data.notifications.map(transformNotification),
      pagination: {
        page: data.pagination?.page ?? 1,
        limit: data.pagination?.limit ?? 10,
        total: data.pagination?.total ?? 0,
        total_pages: data.pagination?.total_pages ?? 1
      },
      unreadCount: (data.unread_count as number) ?? (data.unreadCount as number) ?? 0
    }
  }
}

const notificationApi = {
  // Lấy danh sách thông báo với fallback mock data
  getNotifications: async () => {
    try {
      const response = await http.get<NotificationListBackendResponse>('/notifications')
      return { data: transformNotificationResponse(response.data) }
    } catch (_error) {
      // Fallback to mock data when API is not available
      console.warn('Notification API not available, using mock data')
      return new Promise<{ data: NotificationResponse }>((resolve) => {
        setTimeout(() => {
          resolve({ data: mockNotifications })
        }, 300)
      })
    }
  },

  // Đánh dấu thông báo đã đọc
  markAsRead: async (notificationId: string) => {
    const response = await http.put<MarkAsReadBackendResponse>(`/notifications/${notificationId}/read`)
    return { data: { message: response.data.message, data: transformNotification(response.data.data) } }
  },

  // Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: async () => {
    const response = await http.put<SuccessResponseApi<{ message: string }>>('/notifications/read-all')
    return { data: response.data }
  },

  // Xóa thông báo
  deleteNotification: async (notificationId: string) => {
    const response = await http.delete<SuccessResponseApi<{ message: string }>>(`/notifications/${notificationId}`)
    return { data: response.data }
  },

  // Lấy số thông báo chưa đọc
  getUnreadCount: async () => {
    const response =
      await http.get<SuccessResponseApi<UnreadCountBackendResponse['data']>>('/notifications/unread-count')
    return {
      data: {
        message: response.data.message,
        data: {
          unreadCount:
            response.data.data.count ?? response.data.data.unread_count ?? response.data.data.unreadCount ?? 0
        }
      }
    }
  }
}

export default notificationApi
