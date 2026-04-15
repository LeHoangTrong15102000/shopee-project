import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import ordersApi from 'src/apis/orders.api'
import { useActivityLogStore } from 'src/stores/activity-log.store'
import { useAuthStore } from 'src/stores/auth.store'
import type { OrderStatus } from 'src/types'

export const ORDER_DETAIL_KEYS = {
  detail: (id: string) => ['admin-order', id] as const,
}

export function useOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: ORDER_DETAIL_KEYS.detail(id!),
    queryFn: () => ordersApi.getOrder(id!).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus(id: string | undefined, onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateOrderStatus(id!, { status }),
    onSuccess: (_, status) => {
      toast.success(i18n.t('toast.statusUpdated', { ns: 'orders' }))
      addLog({
        action: 'update',
        entityType: 'order',
        entityName: `${id!.slice(-8)} → ${status}`,
        adminEmail: email,
      })
      qc.invalidateQueries({ queryKey: ORDER_DETAIL_KEYS.detail(id!) })
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['admin-orders-count-by-status'] })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.updateStatusFailed', { ns: 'orders' })),
  })
}
