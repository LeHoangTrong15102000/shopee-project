import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import ordersApi from 'src/apis/orders.api'
import type { OrderStatus } from 'src/types'
import { useAdminMutationContext } from './useAdminMutationContext'

export const ORDER_KEYS = {
  list: (page: number, status: string, start_date?: string, end_date?: string, payment_method?: string) =>
    ['admin-orders', page, status, start_date, end_date, payment_method] as const,
  all: ['admin-orders'] as const,
  countByStatus: ['admin-orders-count-by-status'] as const,
}

export function useOrders(
  page: number,
  status: OrderStatus | 'all',
  start_date?: string,
  end_date?: string,
  payment_method?: string,
) {
  return useQuery({
    queryKey: ORDER_KEYS.list(page, status, start_date, end_date, payment_method),
    queryFn: () =>
      ordersApi
        .getOrders({
          page: page + 1,
          limit: 10,
          ...(status !== 'all' && { status }),
          ...(start_date && { start_date }),
          ...(end_date && { end_date }),
          ...(payment_method && { payment_method }),
        })
        .then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useOrderCountByStatus() {
  return useQuery({
    queryKey: ORDER_KEYS.countByStatus,
    queryFn: () => ordersApi.getOrderCountByStatus().then((r) => r.data.data),
  })
}

export function useBulkUpdateOrderStatus(onSuccess?: () => void) {
  const { qc, addLog, email } = useAdminMutationContext()
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
      qc.invalidateQueries({ queryKey: ORDER_KEYS.countByStatus })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.updateOrdersFailed', { ns: 'orders' }))
    },
  })
}
