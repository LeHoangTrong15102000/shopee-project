import { useInfiniteQuery } from '@tanstack/react-query'
import { getProducts } from '@/apis/product.api'
import { type Product } from '@/types/product.type'

const PRODUCTS_PER_PAGE = 10

export function useProducts(category?: string) {
  return useInfiniteQuery({
    queryKey: ['products', category],
    queryFn: ({ pageParam }) =>
      getProducts({ page: pageParam, limit: PRODUCTS_PER_PAGE, category }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination
      return page < total_pages ? page + 1 : undefined
    },
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products) as Product[],
    }),
  })
}
