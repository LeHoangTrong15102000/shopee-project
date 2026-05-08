import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVouchers,
  getAvailableVouchers,
  getMyVouchers,
  applyVoucher,
  saveVoucher,
  getVoucherByCode,
  collectVoucher,
  getSavedVouchers,
} from '@/apis/voucher.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const voucherKeys = {
  available: () => ['vouchers-available'] as const,
  personalized: () => ['vouchers-personalized'] as const,
  saved: () => ['vouchers-saved'] as const,
  my: (status: string) => ['vouchers-my', status] as const,
  byCode: (code: string) => ['voucher-code', code] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAvailableVouchers() {
  return useQuery({
    queryKey: voucherKeys.available(),
    queryFn: () => getVouchers(),
    staleTime: 1000 * 60 * 5,
  })
}

export function usePersonalizedVouchers() {
  return useQuery({
    queryKey: voucherKeys.personalized(),
    queryFn: () => getAvailableVouchers(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useMyVouchers(status: 'available' | 'used' | 'expired') {
  return useQuery({
    queryKey: voucherKeys.my(status),
    queryFn: () => getMyVouchers(status),
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
    onError: handleMutationError,
  })
}

export function useSavedVouchers() {
  return useQuery({
    queryKey: voucherKeys.saved(),
    queryFn: () => getSavedVouchers(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveVoucher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (voucherId: string) => saveVoucher(voucherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voucherKeys.saved() })
      queryClient.invalidateQueries({ queryKey: voucherKeys.available() })
    },
    onError: handleMutationError,
  })
}

export function useVoucherByCode() {
  return useMutation({
    mutationFn: (code: string) => getVoucherByCode(code),
    onError: handleMutationError,
  })
}

export function useApplyVoucher() {
  return useMutation({
    mutationFn: ({ code, orderValue }: { code: string; orderValue: number }) =>
      applyVoucher(code, orderValue),
    onError: handleMutationError,
  })
}

