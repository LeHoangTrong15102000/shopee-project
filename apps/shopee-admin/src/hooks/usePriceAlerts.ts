import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import priceAlertsApi, { type PriceAlertListParams } from 'src/apis/price-alerts.api'
import { useAdminMutationContext } from './useAdminMutationContext'

export const PRICE_ALERT_KEYS = {
  all: ['admin-price-alerts'] as const,
  list: (params: PriceAlertListParams) => ['admin-price-alerts', 'list', params] as const,
  stats: ['admin-price-alerts-stats'] as const,
}

export function usePriceAlerts(params?: PriceAlertListParams) {
  return useQuery({
    queryKey: PRICE_ALERT_KEYS.list(params ?? {}),
    queryFn: () => priceAlertsApi.getPriceAlerts(params).then((r) => r.data.data),
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function usePriceAlertStats() {
  return useQuery({
    queryKey: PRICE_ALERT_KEYS.stats,
    queryFn: () => priceAlertsApi.getAlertStats().then((r) => r.data.data),
    retry: false,
  })
}

export function useDeleteAlert(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (id: string) => priceAlertsApi.deleteAlert(id),
    onSuccess: () => {
      toast.success(i18n.t('toast.deleted', { ns: 'price-alerts' }))
      qc.invalidateQueries({ queryKey: PRICE_ALERT_KEYS.all })
      onSuccess?.()
    },
    onError: () => {
      toast.error(i18n.t('toast.deleteFailed', { ns: 'price-alerts' }))
    },
  })
}
