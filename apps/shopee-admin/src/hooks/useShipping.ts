import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import shippingApi from 'src/apis/shipping.api'
import { useAdminMutationContext } from './useAdminMutationContext'
import type { CreateShippingMethodBody, UpdateShippingMethodBody, ReorderShippingItem } from 'src/types/shipping.types'

export const SHIPPING_KEYS = {
  all: ['admin-shipping-methods'] as const,
  detail: (id: string) => ['admin-shipping-methods', id] as const,
}

export function useShippingMethods() {
  return useQuery({
    queryKey: SHIPPING_KEYS.all,
    queryFn: () => shippingApi.getAdminShippingMethods().then((r) => r.data.data),
  })
}

export function useCreateShippingMethod(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (body: CreateShippingMethodBody) => shippingApi.createShippingMethod(body),
    onSuccess: () => {
      toast.success(i18n.t('toast.created', { ns: 'shipping' }))
      qc.invalidateQueries({ queryKey: SHIPPING_KEYS.all })
      onSuccess?.()
    },
    onError: () => {
      toast.error(i18n.t('toast.createFailed', { ns: 'shipping' }))
    },
  })
}

export function useUpdateShippingMethod(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateShippingMethodBody }) =>
      shippingApi.updateShippingMethod(id, body),
    onSuccess: () => {
      toast.success(i18n.t('toast.updated', { ns: 'shipping' }))
      qc.invalidateQueries({ queryKey: SHIPPING_KEYS.all })
      onSuccess?.()
    },
    onError: () => {
      toast.error(i18n.t('toast.updateFailed', { ns: 'shipping' }))
    },
  })
}

export function useDeleteShippingMethod(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (id: string) => shippingApi.deleteShippingMethod(id),
    onSuccess: () => {
      toast.success(i18n.t('toast.deleted', { ns: 'shipping' }))
      qc.invalidateQueries({ queryKey: SHIPPING_KEYS.all })
      onSuccess?.()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? i18n.t('toast.deleteFailed', { ns: 'shipping' })
      toast.error(msg)
    },
  })
}

export function useToggleShippingMethod(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (id: string) => shippingApi.toggleShippingMethod(id),
    onSuccess: () => {
      toast.success(i18n.t('toast.statusUpdated', { ns: 'shipping' }))
      qc.invalidateQueries({ queryKey: SHIPPING_KEYS.all })
      onSuccess?.()
    },
    onError: () => {
      toast.error(i18n.t('toast.updateFailed', { ns: 'shipping' }))
    },
  })
}

export function useReorderShippingMethods(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (items: ReorderShippingItem[]) => shippingApi.reorderShippingMethods(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SHIPPING_KEYS.all })
      onSuccess?.()
    },
    onError: () => {
      toast.error(i18n.t('toast.updateFailed', { ns: 'shipping' }))
    },
  })
}
