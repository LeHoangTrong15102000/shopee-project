import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getCheckoutSummary,
  getShippingMethods,
  getPaymentMethods,
  createOrder,
  type CreateOrderBody,
} from '@/apis/checkout.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Hooks ────────────────────────────────────────────────────────────────────

export interface CheckoutSummaryParams {
  addressId: string
  voucherId?: string
  useCoins: boolean
  cartItemIds: string[]
  shippingMethodId?: string
}

export function useCheckoutSummary(params: CheckoutSummaryParams) {
  const { addressId, voucherId, useCoins, cartItemIds, shippingMethodId } = params
  return useQuery({
    queryKey: ['checkout', 'summary', { addressId, voucherId, useCoins, cartItemIds, shippingMethodId }],
    queryFn: () =>
      getCheckoutSummary({
        purchase_ids: cartItemIds,
        shipping_method_id: shippingMethodId,
        voucher_code: voucherId || undefined,
        coins_used: useCoins ? 1 : 0,
      }),
    enabled: !!addressId && cartItemIds.length > 0,
  })
}

export function useShippingMethods() {
  return useQuery({
    queryKey: ['shipping-methods'],
    queryFn: getShippingMethods,
    staleTime: 1000 * 60 * 10,
  })
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: getPaymentMethods,
    staleTime: 1000 * 60 * 10,
  })
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (body: CreateOrderBody) => createOrder(body),
    onError: handleMutationError,
  })
}
