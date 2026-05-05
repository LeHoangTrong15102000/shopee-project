import { useQuery } from '@tanstack/react-query'
import shippingApi from 'src/apis/shipping.api'

export const SHIPPING_KEYS = {
  methods: ['admin-shipping-methods'] as const,
}

export function useShippingMethods() {
  return useQuery({
    queryKey: SHIPPING_KEYS.methods,
    queryFn: () => shippingApi.getShippingMethods().then((r) => r.data.data),
    retry: false,
  })
}
