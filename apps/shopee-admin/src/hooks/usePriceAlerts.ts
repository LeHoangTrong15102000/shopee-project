import { useQuery, keepPreviousData } from '@tanstack/react-query'
import priceAlertsApi from 'src/apis/price-alerts.api'

export const PRICE_ALERT_KEYS = {
  list: (page: number) => ['admin-price-alerts', page] as const,
}

export function usePriceAlerts(page = 1) {
  return useQuery({
    queryKey: PRICE_ALERT_KEYS.list(page),
    queryFn: () => priceAlertsApi.getPriceAlerts(page).then((r) => r.data.data),
    placeholderData: keepPreviousData,
    retry: false,
  })
}
