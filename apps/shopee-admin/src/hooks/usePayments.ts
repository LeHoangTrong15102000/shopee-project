import { useQuery } from '@tanstack/react-query'
import paymentsApi from 'src/apis/payments.api'

export const PAYMENT_KEYS = {
  methods: ['admin-payment-methods'] as const,
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: PAYMENT_KEYS.methods,
    queryFn: () => paymentsApi.getPaymentMethods().then((r) => r.data.data),
    retry: false,
  })
}
