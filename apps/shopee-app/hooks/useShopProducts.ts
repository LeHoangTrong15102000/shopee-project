import { useInfiniteQuery } from '@tanstack/react-query'
import { getShopProducts } from '@/apis/shop.api'
import { Product } from '@/types/product.type'

const LIMIT = 20

export function useShopProducts(shopId: string, sort = 'popular') {
  return useInfiniteQuery({
    queryKey: ['shop-products', shopId, sort],
    queryFn: ({ pageParam }) => getShopProducts(shopId, pageParam as number, LIMIT, sort),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.limit)
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined
    },
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.data) as Product[],
    }),
    enabled: !!shopId,
  })
}
