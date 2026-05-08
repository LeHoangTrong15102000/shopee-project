import { useEffect, useState } from 'react'
import { socketClient } from 'src/lib/socket'

interface SellerMetricsUpdatePayload {
  today_orders: number
  today_revenue: number
  pending_orders: number
  pending_qa: number
  active_users: number
  orders_per_hour: number
}

const SELLER_METRICS_EVENT = 'seller_metrics_update'

/**
 * Subscribes to seller_metrics_update socket events.
 * Returns the latest metrics payload, updated in real-time.
 */
export function useRealtimeMetrics(): SellerMetricsUpdatePayload | null {
  const [metrics, setMetrics] = useState<SellerMetricsUpdatePayload | null>(null)

  useEffect(() => {
    const unsubscribe = socketClient.subscribe<SellerMetricsUpdatePayload>(
      SELLER_METRICS_EVENT,
      (payload) => {
        setMetrics(payload)
      },
    )

    return unsubscribe
  }, [])

  return metrics
}
