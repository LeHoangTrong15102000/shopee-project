import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVouchers, collectVoucher, getSavedVouchers } from '@/apis/voucher.api'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const voucherKeys = {
  available: () => ['vouchers-available'] as const,
  saved: () => ['vouchers-saved'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAvailableVouchers() {
  return useQuery({
    queryKey: voucherKeys.available(),
    queryFn: () => getVouchers(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCollectVoucher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (voucherId: string) => collectVoucher(voucherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.available() })
      queryClient.invalidateQueries({ queryKey: voucherKeys.saved() })
    },
  })
}

export function useSavedVouchers() {
  return useQuery({
    queryKey: voucherKeys.saved(),
    queryFn: () => getSavedVouchers(),
    staleTime: 1000 * 60 * 5,
  })
}
