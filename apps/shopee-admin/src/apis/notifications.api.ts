import http from 'src/utils/http'
import type { SuccessResponse, Notification } from 'src/types'

interface NotificationListParams {
  page?: number
  limit?: number
  type?: 'targeted' | 'broadcast'
}

interface NotificationListResponse {
  notifications: Notification[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface CreateNotificationBody {
  user_id: string
  title: string
  message: string
}

interface BroadcastNotificationBody {
  title: string
  message: string
}

const notificationsApi = {
  getNotifications: (params?: NotificationListParams) =>
    http.get<SuccessResponse<NotificationListResponse>>('admin/notifications', { params }),

  createNotification: (body: CreateNotificationBody) =>
    http.post<SuccessResponse<Notification>>('admin/notifications', body),

  broadcastNotification: (body: BroadcastNotificationBody) =>
    http.post<SuccessResponse<Notification>>('admin/notifications/broadcast', body),

  deleteNotification: (id: string) =>
    http.delete<SuccessResponse<null>>(`admin/notifications/${id}`),

  markAsRead: (id: string) =>
    http.put<SuccessResponse<Notification>>(`admin/notifications/${id}/read`),
}

export default notificationsApi
