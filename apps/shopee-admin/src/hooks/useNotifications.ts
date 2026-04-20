import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import notificationsApi from 'src/apis/notifications.api'
import { useActivityLogStore } from 'src/stores/activity-log.store'
import { useAuthStore } from 'src/stores/auth.store'

export const NOTIFICATION_KEYS = {
  list: (page: number) => ['admin-notifications', page] as const,
  all: ['admin-notifications'] as const,
  unreadCount: ['admin-notifications-unread-count'] as const,
}

export function useNotificationUnreadCount() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount,
    queryFn: () =>
      notificationsApi
        .getNotifications({ page: 1, limit: 1 })
        .then((r) => r.data.data.pagination.total),
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  })
}

export function useNotifications(page: number) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(page),
    queryFn: () =>
      notificationsApi.getNotifications({ page: page + 1, limit: 10 }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useCreateNotification(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (params: {
      type: 'targeted' | 'broadcast'
      form: { user_id: string; title: string; message: string }
    }) =>
      params.type === 'broadcast'
        ? notificationsApi.broadcastNotification({
            title: params.form.title,
            message: params.form.message,
          })
        : notificationsApi.createNotification(params.form),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.notificationSent', { ns: 'notifications' }))
      addLog({
        action: 'create',
        entityType: 'notification',
        entityName: vars.form.title,
        adminEmail: email,
      })
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.sendFailed', { ns: 'notifications' })),
  })
}

export function useDeleteNotification(onSuccess?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      toast.success(i18n.t('toast.notificationDeleted', { ns: 'notifications' }))
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.deleteFailed', { ns: 'notifications' })),
  })
}

export function useMarkNotificationAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      toast.success(i18n.t('toast.markedAsRead', { ns: 'notifications' }))
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount })
    },
    onError: () => toast.error(i18n.t('toast.markReadFailed', { ns: 'notifications' })),
  })
}
