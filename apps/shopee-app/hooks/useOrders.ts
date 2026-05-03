import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getOrders,
  getOrderDetail,
  cancelOrder,
  confirmReceived,
  requestReturn,
  getOrderTracking,
  type ReturnReason,
} from '@/apis/order.api'
import { type OrderStatusType } from '@/constants/order'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const orderKeys = {
  all: (status?: OrderStatusType) => ['orders', status] as const,
  detail: (id: string) => ['order', id] as const,
  tracking: (id: string) => ['order-tracking', id] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useOrders(status?: OrderStatusType) {
  return useInfiniteQuery({
    queryKey: orderKeys.all(status),
    queryFn: ({ pageParam }) =>
      getOrders({ status, page: pageParam as number, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.data.pagination
      return page < total_pages ? page + 1 : undefined
    },
  })
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrderDetail(orderId),
    enabled: !!orderId,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all() })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
    },
    onError: handleMutationError,
  })
}

export function useConfirmReceived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => confirmReceived(orderId),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all() })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
    },
    onError: handleMutationError,
  })
}

export function useReturnOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { orderId: string; reason: ReturnReason; description?: string }) =>
      requestReturn(params.orderId, { reason: params.reason, description: params.description }),
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all() })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(params.orderId) })
    },
    onError: handleMutationError,
  })
}

export function useOrderTracking(orderId: string) {
  return useQuery({
    queryKey: orderKeys.tracking(orderId),
    queryFn: () => getOrderTracking(orderId),
    enabled: !!orderId,
  })
}
