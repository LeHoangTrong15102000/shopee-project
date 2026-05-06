import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import ordersApi from 'src/apis/orders.api'
import type { OrderStatus } from 'src/types'
import { ORDER_KEYS } from './useOrders'
import { useAdminMutationContext } from './useAdminMutationContext'

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
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateOrderStatus(id!, { status }),
    onSuccess: () => {
      toast.success(i18n.t('toast.statusUpdated', { ns: 'orders' }))
      qc.invalidateQueries({ queryKey: ORDER_DETAIL_KEYS.detail(id!) })
      qc.invalidateQueries({ queryKey: ORDER_KEYS.all })
      qc.invalidateQueries({ queryKey: ORDER_KEYS.countByStatus })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.updateStatusFailed', { ns: 'orders' }))
    },
  })
}
