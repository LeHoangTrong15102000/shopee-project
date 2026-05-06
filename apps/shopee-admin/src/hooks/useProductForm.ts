import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from 'src/i18n/i18n'
import productsApi from 'src/apis/products.api'
import { PRODUCT_KEYS } from './useProducts'
import { PRODUCT_DETAIL_KEYS } from './useProductDetail'
import { useAdminMutationContext } from './useAdminMutationContext'

interface ProductData {
  name: string
  description?: string
  price: number
  price_before_discount?: number
  quantity: number
  category: string
  image: string
  location?: string
}

export const PRODUCT_FORM_KEYS = PRODUCT_DETAIL_KEYS

export function useProductFormData(id?: string) {
  return useQuery({
    queryKey: PRODUCT_DETAIL_KEYS.detail(id!),
    queryFn: () => productsApi.getProduct(id!).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCreateProduct(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: (data: ProductData) => productsApi.createProduct(data),
    onSuccess: () => {
      toast.success(i18n.t('toast.productCreated', { ns: 'products' }))
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.createFailed', { ns: 'products' }))
    },
  })
}

export function useUpdateProduct(onSuccess?: () => void) {
  const { qc } = useAdminMutationContext()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductData }) =>
      productsApi.updateProduct(id, data),
    onSuccess: () => {
      toast.success(i18n.t('toast.productUpdated', { ns: 'products' }))
      qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all })
      onSuccess?.()
    },
    onError: (error) => {
      console.error(error)
      toast.error(i18n.t('toast.updateFailed', { ns: 'products' }))
    },
  })
}
