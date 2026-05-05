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

// Helper function để transform backend response (snake_case) sang frontend (camelCase)
const transformNotification = (backendNotification: Record<string, unknown>): Notification => ({
  _id: backendNotification._id as string,
  title: backendNotification.title as string,
  content: backendNotification.content as string,
  type: backendNotification.type as Notification['type'],
  isRead: (backendNotification.is_read ?? backendNotification.isRead ?? false) as boolean,
  link: backendNotification.link as string | undefined,
  createdAt: backendNotification.createdAt as string,
  updatedAt: backendNotification.updatedAt as string,
})

const transformNotificationResponse = (
  backendResponse: NotificationListBackendResponse,
): NotificationResponse => {
  const data = backendResponse.data
  return {
    message: backendResponse.message,
    data: {
      notifications: data.notifications.map(transformNotification),
      pagination: {
        page: data.pagination?.page ?? 1,
        limit: data.pagination?.limit ?? 10,
        total: data.pagination?.total ?? 0,
        total_pages: data.pagination?.total_pages ?? 1,
      },
      unreadCount: (data.unread_count as number) ?? (data.unreadCount as number) ?? 0,
    },
  }
}

const notificationApi = {
  // Lấy danh sách thông báo
  getNotifications: async () => {
    const response = await http.get<NotificationListBackendResponse>('/notifications')
    return { data: transformNotificationResponse(response.data) }
  },

  // Đánh dấu thông báo đã đọc
  markAsRead: async (notificationId: string) => {
    const response = await http.put<MarkAsReadBackendResponse>(
      `/notifications/${notificationId}/read`,
    )
    return {
      data: { message: response.data.message, data: transformNotification(response.data.data) },
    }
  },

  // Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: async () => {
    const response =
      await http.put<SuccessResponseApi<{ message: string }>>('/notifications/read-all')
    return { data: response.data }
  },

  // Xóa thông báo
  deleteNotification: async (notificationId: string) => {
    const response = await http.delete<SuccessResponseApi<{ message: string }>>(
      `/notifications/${notificationId}`,
    )
    return { data: response.data }
  },

  // Lấy số thông báo chưa đọc
  getUnreadCount: async () => {
    const response = await http.get<SuccessResponseApi<UnreadCountBackendResponse['data']>>(
      '/notifications/unread-count',
    )
    return {
      data: {
        message: response.data.message,
        data: {
          unreadCount:
            response.data.data.count ??
            response.data.data.unread_count ??
            response.data.data.unreadCount ??
            0,
        },
      },
    }
  },
}

export default notificationApi
