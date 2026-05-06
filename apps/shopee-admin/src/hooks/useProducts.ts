import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import productsApi from 'src/apis/products.api'
import { useAdminMutationContext } from './useAdminMutationContext'

export const PRODUCT_KEYS = {
  list: (page: number, filters?: Record<string, string>) =>
    ['admin-products', page, filters] as const,
  all: ['admin-products'] as const,
}

export function useProducts(page: number, filters?: { category?: string; name?: string }) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(page, filters),
    queryFn: () =>
      productsApi.getProducts({ page: page + 1, limit: 10, ...filters }).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useDeleteProduct(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      toast.success(i18n.t('toast.productDeleted', { ns: 'products' }))
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.deleteFailed', { ns: 'products' }))
    },
  })
}

export function useDeleteManyProducts(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (ids: string[]) => productsApi.deleteManyProducts(ids),
    onSuccess: () => {
      toast.success(i18n.t('toast.productsDeleted', { ns: 'products' }))
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.deleteMultipleFailed', { ns: 'products' }))
    },
  })
}
