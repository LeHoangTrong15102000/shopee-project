import { useInfiniteQuery } from '@tanstack/react-query';
import { getProducts, Product } from '@/services/product.api';

const PRODUCTS_PER_PAGE = 10;

export function useProducts(category?: string) {
  return useInfiniteQuery({
    queryKey: ['products', category],
    queryFn: ({ pageParam }) =>
      getProducts({ page: pageParam, limit: PRODUCTS_PER_PAGE, category }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, page_size } = lastPage.pagination;
      return page < page_size ? page + 1 : undefined;
    },
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products) as Product[],
    }),
  });
}
