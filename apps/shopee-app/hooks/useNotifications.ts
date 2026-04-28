import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification,
  type Notification,
} from '@/apis/notification.api'
import type { InfiniteData } from '@tanstack/react-query'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationsResponse = {
  message: string
  data: {
    notifications: Notification[]
    pagination: { page: number; limit: number; total: number; total_pages: number }
  }
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: () => ['notifications'] as const,
  unread: () => ['notifications-unread'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.all(),
    queryFn: ({ pageParam }) => getNotifications(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.data.pagination
      return page < total_pages ? page + 1 : undefined
    },
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: getUnreadCount,
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all() })
      const previous = queryClient.getQueryData(notificationKeys.all())
      queryClient.setQueryData(
        notificationKeys.all(),
        (old: InfiniteData<NotificationsResponse> | undefined) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                notifications: page.data.notifications.map((n: Notification) =>
                  n._id === notificationId ? { ...n, is_read: true } : n
                ),
              },
            })),
          }
        }
      )
      return { previous }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() })
    },
    onError: handleMutationError,
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all() })
      const previous = queryClient.getQueryData(notificationKeys.all())
      queryClient.setQueryData(
        notificationKeys.all(),
        (old: InfiniteData<NotificationsResponse> | undefined) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: {
                ...page.data,
                notifications: page.data.notifications.map((n: Notification) => ({
                  ...n,
                  is_read: true,
                })),
              },
            })),
          }
        }
      )
      return { previous }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() })
    },
    onError: handleMutationError,
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() })
    },
    onError: handleMutationError,
  })
}
