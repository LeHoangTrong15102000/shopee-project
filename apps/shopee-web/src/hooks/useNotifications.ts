import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useSocket from './useSocket'
import { SocketEvent, NotificationPayload } from 'src/types/socket.types'
import { Notification } from 'src/types/notification.type'
import notificationApi from 'src/apis/notification.api'
import { toast } from 'react-toastify'

// Convert socket notification payload to Notification type
const convertSocketToNotification = (payload: NotificationPayload): Notification => ({
  _id: payload._id,
  title: payload.title,
  content: payload.content,
  type: payload.type,
  isRead: false,
  link: payload.link,
  createdAt: payload.created_at,
  updatedAt: payload.created_at
})

const useNotifications = () => {
  const { socket, isConnected } = useSocket()
  const queryClient = useQueryClient()

  // Real-time notifications received via socket (not yet in REST data)
  const [realtimeNotifications, setRealtimeNotifications] = useState<NotificationPayload[]>([])

  // REST API: initial load
  const {
    data: notificationsData,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    staleTime: 5 * 60 * 1000
  })

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 5 * 60 * 1000
  })

  const apiNotifications = notificationsData?.data.data.notifications || []
  const apiUnreadCount = unreadCountData?.data.data.unreadCount ?? notificationsData?.data.data.unreadCount ?? 0

  // Listen for socket real-time updates
  useEffect(() => {
    if (!socket) return

    const handleNotification = (data: NotificationPayload) => {
      setRealtimeNotifications((prev) => [data, ...prev])
      toast.info(data.title, { autoClose: 3000 })

      // Invalidate REST queries to sync
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }

    socket.on(SocketEvent.NOTIFICATION, handleNotification)

    return () => {
      socket.off(SocketEvent.NOTIFICATION, handleNotification)
    }
  }, [socket, queryClient])

  // Merge REST + socket notifications (deduplicated)
  const notifications: Notification[] = useMemo(() => {
    const apiIds = new Set(apiNotifications.map((n) => n._id))
    const newRealtime = realtimeNotifications.filter((n) => !apiIds.has(n._id)).map(convertSocketToNotification)
    return [...newRealtime, ...apiNotifications]
  }, [apiNotifications, realtimeNotifications])

  // Calculate total unread count
  const unreadCount = useMemo(() => {
    const realtimeUnread = realtimeNotifications.filter(
      (n) => !apiNotifications.some((api) => api._id === n._id)
    ).length
    return apiUnreadCount + realtimeUnread
  }, [apiUnreadCount, realtimeNotifications, apiNotifications])

  const markAsRead = useCallback(
    (notificationId: string) => {
      if (!socket || !isConnected) return
      socket.emit(SocketEvent.NOTIFICATION_READ, { notification_id: notificationId })
      setRealtimeNotifications((prev) => prev.filter((n) => n._id !== notificationId))
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    [socket, isConnected, queryClient]
  )

  const clearAll = useCallback(() => {
    setRealtimeNotifications([])
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }, [queryClient])

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    isError,
    markAsRead,
    clearAll
  }
}

export default useNotifications
