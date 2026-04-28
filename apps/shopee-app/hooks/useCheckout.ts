import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getCheckoutSummary,
  getShippingMethods,
  getPaymentMethods,
  createOrder,
  type CheckoutSummaryBody,
  type CreateOrderBody,
} from '@/apis/checkout.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCheckoutSummary() {
  return useMutation({
    mutationFn: (body: CheckoutSummaryBody) => getCheckoutSummary(body),
    onError: handleMutationError,
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
