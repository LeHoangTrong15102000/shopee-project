import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import ordersApi from 'src/apis/orders.api'
import { useActivityLogStore } from 'src/stores/activity-log.store'
import { useAuthStore } from 'src/stores/auth.store'
import type { OrderStatus } from 'src/types'

export const ORDER_KEYS = {
  list: (page: number, status: string) => ['admin-orders', page, status] as const,
  all: ['admin-orders'] as const,
}

export function useOrders(page: number, status: OrderStatus | 'all') {
  return useQuery({
    queryKey: ORDER_KEYS.list(page, status),
    queryFn: () =>
      ordersApi
        .getOrders({ page: page + 1, limit: 10, ...(status !== 'all' && { status }) })
        .then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useOrderCountByStatus() {
  return useQuery({
    queryKey: ['admin-orders-count-by-status'],
    queryFn: () => ordersApi.getOrderCountByStatus().then((r) => r.data.data),
  })
}

export function useBulkUpdateOrderStatus(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (body: { order_ids: string[]; status: OrderStatus }) =>
      ordersApi.bulkUpdateStatus(body),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.ordersUpdated', { ns: 'orders' }))
      addLog({
        action: 'update',
        entityType: 'order',
        entityName: `${vars.order_ids.length} orders → ${vars.status}`,
        adminEmail: email,
      })
      qc.invalidateQueries({ queryKey: ORDER_KEYS.all })
      qc.invalidateQueries({ queryKey: ['admin-orders-count-by-status'] })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.updateOrdersFailed', { ns: 'orders' })),
  })
}
