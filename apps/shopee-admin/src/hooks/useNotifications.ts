import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import notificationsApi from 'src/apis/notifications.api';

export const NOTIFICATION_KEYS = {
  list: (page: number) => ['admin-notifications', page] as const,
  all: ['admin-notifications'] as const,
};

export function useNotifications(page: number) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(page),
    queryFn: () =>
      notificationsApi.getNotifications({ page: page + 1, limit: 10 }).then((r) => r.data.data),
  });
}

export function useCreateNotification(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      type: 'targeted' | 'broadcast';
      form: { user_id: string; title: string; message: string };
    }) =>
      params.type === 'broadcast'
        ? notificationsApi.broadcastNotification({
            title: params.form.title,
            message: params.form.message,
          })
        : notificationsApi.createNotification(params.form),
    onSuccess: () => {
      toast.success('Notification sent');
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to send notification'),
  });
}

export function useDeleteNotification(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      toast.success('Notification deleted');
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      onSuccess?.();
    },
    onError: () => toast.error('Failed to delete notification'),
  });
}
