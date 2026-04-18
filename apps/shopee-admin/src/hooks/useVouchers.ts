import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import vouchersApi from 'src/apis/vouchers.api'
import { useActivityLogStore } from 'src/stores/activity-log.store'
import { useAuthStore } from 'src/stores/auth.store'
import type { DiscountType } from 'src/types'

export const VOUCHER_KEYS = {
  list: (page: number) => ['admin-vouchers', page] as const,
  all: ['admin-vouchers'] as const,
  stats: ['admin-voucher-stats'] as const,
}

export function useVouchers(page: number) {
  return useQuery({
    queryKey: VOUCHER_KEYS.list(page),
    queryFn: () => vouchersApi.getVouchers({ page: page + 1, limit: 10 }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useVoucherStats() {
  return useQuery({
    queryKey: VOUCHER_KEYS.stats,
    queryFn: () => vouchersApi.getVoucherStats().then((r) => r.data.data),
  })
}

export function useCreateVoucher(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (body: {
      code: string
      discount_type: DiscountType
      discount_value: number
      min_order_value?: number
      usage_limit?: number
      start_date: string
      end_date: string
    }) => vouchersApi.createVoucher(body),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.voucherCreated', { ns: 'vouchers' }))
      addLog({ action: 'create', entityType: 'voucher', entityName: vars.code, adminEmail: email })
      qc.invalidateQueries({ queryKey: VOUCHER_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.createFailed', { ns: 'vouchers' })),
  })
}

export function useDeleteVoucher(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: (id: string) => vouchersApi.deleteVoucher(id),
    onSuccess: (_, id) => {
      toast.success(i18n.t('toast.voucherDeleted', { ns: 'vouchers' }))
      addLog({ action: 'delete', entityType: 'voucher', entityName: id, adminEmail: email })
      qc.invalidateQueries({ queryKey: VOUCHER_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.deleteFailed', { ns: 'vouchers' })),
  })
}

export function useUpdateVoucher(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: Partial<{
        code: string
        discount_type: DiscountType
        discount_value: number
        min_order_value?: number
        usage_limit?: number
        start_date: string
        end_date: string
      }> & { is_active?: boolean }
    }) => vouchersApi.updateVoucher(id, body),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.voucherUpdated', { ns: 'vouchers' }))
      addLog({ action: 'update', entityType: 'voucher', entityName: vars.id, adminEmail: email })
      qc.invalidateQueries({ queryKey: VOUCHER_KEYS.all })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.updateFailed', { ns: 'vouchers' })),
  })
}

export function useToggleVoucher(onSuccess?: () => void) {
  const qc = useQueryClient()
  const addLog = useActivityLogStore((s) => s.addLog)
  const email = useAuthStore((s) => s.user?.email ?? 'admin')
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      vouchersApi.updateVoucher(id, { is_active }),
    onSuccess: (_, vars) => {
      toast.success(i18n.t('toast.statusUpdated', { ns: 'vouchers' }))
      addLog({
        action: 'update',
        entityType: 'voucher',
        entityName: `${vars.id} → ${vars.is_active ? 'active' : 'inactive'}`,
        adminEmail: email,
      })
      qc.invalidateQueries({ queryKey: VOUCHER_KEYS.all })
      qc.invalidateQueries({ queryKey: VOUCHER_KEYS.stats })
      onSuccess?.()
    },
    onError: () => toast.error(i18n.t('toast.updateStatusFailed', { ns: 'vouchers' })),
  })
}
