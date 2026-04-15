import { useQuery } from '@tanstack/react-query'
import productsApi from 'src/apis/products.api'

export const PRODUCT_DETAIL_KEYS = {
  detail: (id: string) => ['admin-product', id] as const,
}

export function useProductDetail(id: string | undefined) {
  return useQuery({
    queryKey: PRODUCT_DETAIL_KEYS.detail(id!),
    queryFn: () => productsApi.getProduct(id!).then((r) => r.data.data),
    enabled: !!id,
  })
}
