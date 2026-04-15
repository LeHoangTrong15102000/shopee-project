export type NotificationType = 'order' | 'promotion' | 'system' | 'other'

export interface Notification {
  _id: string
  title: string
  content: string
  type: NotificationType
  isRead: boolean
  link?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationResponse {
  message: string
  data: {
    notifications: Notification[]
    pagination: {
      page: number
      limit: number
      total: number
      total_pages: number
    }
    unreadCount: number
  }
}
