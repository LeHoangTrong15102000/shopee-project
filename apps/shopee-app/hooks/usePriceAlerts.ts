import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPriceHistory,
  getPriceAlerts,
  createPriceAlert,
  deletePriceAlert,
} from '@/apis/price-alerts.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const priceAlertKeys = {
  all: ['price-alerts'] as const,
  history: (productId: string, days?: number) => ['price-history', productId, days] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePriceHistory(productId: string | undefined, days?: number) {
  return useQuery({
    queryKey: priceAlertKeys.history(productId ?? '', days),
    queryFn: () => getPriceHistory(productId!, days),
    enabled: !!productId,
  })
}

export function usePriceAlerts() {
  return useQuery({
    queryKey: priceAlertKeys.all,
    queryFn: getPriceAlerts,
  })
}

export function useCreatePriceAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, targetPrice }: { productId: string; targetPrice: number }) =>
      createPriceAlert(productId, targetPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceAlertKeys.all })
    },
    onError: handleMutationError,
  })
}

export function useDeletePriceAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) => deletePriceAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceAlertKeys.all })
    },
    onError: handleMutationError,
  })
}
