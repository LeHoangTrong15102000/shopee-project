import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import paymentsApi from 'src/apis/payments.api'
import { useAdminMutationContext } from './useAdminMutationContext'
import type {
  CreatePaymentMethodBody,
  UpdatePaymentMethodBody,
  ReorderPaymentItem,
} from 'src/types/payment.types'

export const PAYMENT_KEYS = {
  all: ['admin-payment-methods'] as const,
  detail: (id: string) => ['admin-payment-methods', id] as const,
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: PAYMENT_KEYS.all,
    queryFn: () => paymentsApi.getAdminPaymentMethods().then((r) => r.data.data),
  })
}

export function useCreatePaymentMethod(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (body: CreatePaymentMethodBody) => paymentsApi.createPaymentMethod(body),
    onSuccess: () => {
      toast.success(i18n.t('toast.created', { ns: 'payments' }))
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all })
      onSuccess?.()
    },
    onError: () => {
      toast.error(i18n.t('toast.createFailed', { ns: 'payments' }))
    },
  })
}

export function useUpdatePaymentMethod(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePaymentMethodBody }) =>
      paymentsApi.updatePaymentMethod(id, body),
    onSuccess: () => {
      toast.success(i18n.t('toast.updated', { ns: 'payments' }))
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all })
      onSuccess?.()
    },
    onError: () => {
      toast.error(i18n.t('toast.updateFailed', { ns: 'payments' }))
    },
  })
}

export function useDeletePaymentMethod(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (id: string) => paymentsApi.deletePaymentMethod(id),
    onSuccess: () => {
      toast.success(i18n.t('toast.deleted', { ns: 'payments' }))
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all })
      onSuccess?.()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? i18n.t('toast.deleteFailed', { ns: 'payments' })
      toast.error(msg)
    },
  })
}

export function useTogglePaymentMethod(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (id: string) => paymentsApi.togglePaymentMethod(id),
    onSuccess: () => {
      toast.success(i18n.t('toast.statusUpdated', { ns: 'payments' }))
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all })
      onSuccess?.()
    },
    onError: () => {
      toast.error(i18n.t('toast.updateFailed', { ns: 'payments' }))
    },
  })
}

export function useReorderPaymentMethods(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (items: ReorderPaymentItem[]) => paymentsApi.reorderPaymentMethods(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all })
      onSuccess?.()
    },
    onError: () => {
      toast.error(i18n.t('toast.updateFailed', { ns: 'payments' }))
    },
  })
}
