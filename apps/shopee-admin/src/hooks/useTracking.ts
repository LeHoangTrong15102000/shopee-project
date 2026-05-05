import { useQuery } from '@tanstack/react-query'
import trackingApi from 'src/apis/tracking.api'

export const TRACKING_KEYS = {
  order: (orderId: string) => ['admin-tracking', orderId] as const,
}

export function useOrderTracking(orderId: string | undefined) {
  return useQuery({
    queryKey: TRACKING_KEYS.order(orderId ?? ''),
    queryFn: () => trackingApi.getOrderTracking(orderId!).then((r) => r.data.data),
    enabled: !!orderId,
    retry: false,
  })
}
