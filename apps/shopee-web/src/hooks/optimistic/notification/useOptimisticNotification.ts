import { useMutation, useQueryClient } from '@tanstack/react-query'

import notificationApi from 'src/apis/notification.api'
import { Notification, NotificationResponse } from 'src/types/notification.type'
import { NotificationContext, MarkAllAsReadContext, QUERY_KEYS } from '../shared/types'
import { showSuccessToast, showErrorToast, logOptimisticError } from '../shared/utils'
import { TOAST_MESSAGES } from '../shared/constants'
import { useQueryInvalidation } from '../../useQueryInvalidation'

interface NotificationsQueryData {
  data: NotificationResponse
}

export const useOptimisticNotification = () => {
  const queryClient = useQueryClient()
  const { invalidateNotifications } = useQueryInvalidation()

  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onMutate: async (notificationId: string): Promise<NotificationContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS })

      const previousNotifications = queryClient.getQueryData<NotificationsQueryData>(QUERY_KEYS.NOTIFICATIONS)

      queryClient.setQueryData<NotificationsQueryData>(QUERY_KEYS.NOTIFICATIONS, (old) => {
        if (!old) return old

        const notification = old.data.data.notifications.find((n) => n._id === notificationId)
        const wasUnread = notification && !notification.isRead

        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              notifications: old.data.data.notifications.map((n: Notification) =>
                n._id === notificationId ? { ...n, isRead: true } : n
              ),
              unreadCount: wasUnread ? Math.max(0, old.data.data.unreadCount - 1) : old.data.data.unreadCount
            }
          }
        }
      })

      return { previousNotifications, notificationId }
    },

    onError: (err, _notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, context.previousNotifications)
      }

      showErrorToast(TOAST_MESSAGES.MARK_AS_READ_ERROR)
      logOptimisticError('Mark as read', err, context)
    },

    onSettled: () => {
      invalidateNotifications()
    }
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onMutate: async (): Promise<MarkAllAsReadContext> => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS })

      const previousNotifications = queryClient.getQueryData<NotificationsQueryData>(QUERY_KEYS.NOTIFICATIONS)
      const previousUnreadCount = previousNotifications?.data.data.unreadCount || 0

      queryClient.setQueryData<NotificationsQueryData>(QUERY_KEYS.NOTIFICATIONS, (old) => {
        if (!old) return old

        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              notifications: old.data.data.notifications.map((n: Notification) => ({
                ...n,
                isRead: true
              })),
              unreadCount: 0
            }
          }
        }
      })

      return { previousNotifications, previousUnreadCount }
    },

    onError: (err, _, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, context.previousNotifications)
      }

      showErrorToast(TOAST_MESSAGES.MARK_ALL_AS_READ_ERROR)
      logOptimisticError('Mark all as read', err, context)
    },

    onSuccess: () => {
      showSuccessToast(TOAST_MESSAGES.MARK_ALL_AS_READ_SUCCESS)
    },

    onSettled: () => {
      invalidateNotifications()
    }
  })

  return {
    markAsReadMutation,
    markAllAsReadMutation
  }
}
