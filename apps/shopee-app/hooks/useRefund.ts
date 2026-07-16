import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  submitRefundRequest,
  getRefundStatus,
  cancelRefundRequest,
  listMyRefunds,
  type SubmitRefundPayload,
} from '@/apis/refund.api'
import { toast } from '@/utils/toast'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const refundKeys = {
  status: (orderId: string) => ['refund-status', orderId] as const,
  list: () => ['refunds'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Submit a refund request for an order.
 * Invalidates refund-status and list on success.
 * User-facing feedback (success toast, inline error) is owned by the call site
 * (RefundRequestForm) to avoid double-reporting in TanStack Query v5.
 */
export function useSubmitRefund(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SubmitRefundPayload) => submitRefundRequest(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.status(orderId) })
      queryClient.invalidateQueries({ queryKey: refundKeys.list() })
    },
  })
}

/**
 * Get refund status for a specific order.
 * Returns null when no refund has been requested for the order.
 */
export function useRefundStatus(orderId: string) {
  return useQuery({
    queryKey: refundKeys.status(orderId),
    queryFn: () => getRefundStatus(orderId),
    enabled: !!orderId,
    // A 404 from the server means no refund exists — treat as null, not error
    throwOnError: false,
  })
}

/**
 * Cancel a pending refund request.
 * Invalidates refund-status and list on success.
 */
export function useCancelRefund(orderId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => cancelRefundRequest(orderId),
    onSuccess: () => {
      toast.success(t('refund.toast.cancelSuccess'))
      queryClient.invalidateQueries({ queryKey: refundKeys.status(orderId) })
      queryClient.invalidateQueries({ queryKey: refundKeys.list() })
    },
    onError: handleMutationError,
  })
}

/**
 * List all refund requests for the authenticated user, with infinite scrolling.
 */
export function useMyRefunds(params: { limit?: number } = {}) {
  const limit = params.limit ?? 20

  return useInfiniteQuery({
    queryKey: [...refundKeys.list(), { limit }],
    queryFn: ({ pageParam }) => listMyRefunds({ page: pageParam as number, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, page_size } = lastPage.pagination
      return page < page_size ? page + 1 : undefined
    },
  })
}
