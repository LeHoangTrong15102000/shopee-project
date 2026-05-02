import http from '@/utils/http'
import { type ApiResponse, type Pagination } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Notification {
  _id: string
  title: string
  content: string
  is_read: boolean
  type?: string
  referenceId?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationsPage {
  notifications: Notification[]
  pagination: Pagination
}

// ─── Notification API ─────────────────────────────────────────────────────────

export async function getNotifications(page: number, limit = 20) {
  const res = await http.get<ApiResponse<NotificationsPage>>('notifications', {
    params: { page, limit },
  })
  return res.data
}

export async function getUnreadCount() {
  const res = await http.get<ApiResponse<{ count: number }>>('notifications/unread-count')
  return res.data
}

export async function markAsRead(notificationId: string) {
  const res = await http.put<ApiResponse<unknown>>(`notifications/${notificationId}/read`)
  return res.data
}

export async function markAllRead() {
  const res = await http.put<ApiResponse<unknown>>('notifications/read-all')
  return res.data
}

export async function deleteNotification(notificationId: string) {
  const res = await http.delete<ApiResponse<unknown>>(`notifications/${notificationId}`)
  return res.data
}
