import { useQuery } from '@tanstack/react-query'
import vouchersApi from 'src/apis/vouchers.api'

export const VOUCHER_DETAIL_KEYS = {
  detail: (id: string) => ['admin-voucher', id] as const,
  usage: (id: string) => ['admin-voucher-usage', id] as const,
}

export function useVoucherDetail(id: string | undefined) {
  return useQuery({
    queryKey: VOUCHER_DETAIL_KEYS.detail(id!),
    queryFn: () => vouchersApi.getVoucher(id!).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useVoucherUsage(id: string | undefined) {
  return useQuery({
    queryKey: VOUCHER_DETAIL_KEYS.usage(id!),
    queryFn: () => vouchersApi.getVoucherUsage(id!).then((r) => r.data.data),
    enabled: !!id,
  })
}
