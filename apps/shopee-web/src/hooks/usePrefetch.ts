import { useQueryClient } from '@tanstack/react-query'

import productApi from 'src/apis/product.api'
import categoryApi from 'src/apis/category.api'
import userApi from 'src/apis/user.api'
import purchasesApi from 'src/apis/purchases.api'
import { QueryFilters } from 'src/utils/queryFilters'
import { ProductListConfig } from 'src/types/product.type'
import { purchasesStatus } from 'src/constant/purchase'

/**
 * Hook quản lý prefetching data để cải thiện UX
 * Prefetch data trước khi user thực sự cần đến
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient()

  return {
    // === PRODUCTS ===

    prefetchProduct: (productId: string) => {
      queryClient.prefetchQuery({
        ...QueryFilters.products.detail(productId),
        queryFn: ({ signal }) => productApi.getProductDetail(productId, { signal }),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      })
    },

    prefetchProductList: (filters: ProductListConfig) => {
      queryClient.prefetchQuery({
        ...QueryFilters.products.list(filters),
        queryFn: ({ signal }) => productApi.getProducts(filters, { signal }),
        staleTime: 3 * 60 * 1000,
        gcTime: 8 * 60 * 1000,
      })
    },

    prefetchSearchSuggestions: (searchTerm: string) => {
      if (searchTerm.length < 2) return

      queryClient.prefetchQuery({
        ...QueryFilters.search.suggestions(searchTerm),
        queryFn: ({ signal }) => productApi.getSearchSuggestions({ q: searchTerm }, { signal }),
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      })
    },

    // === CATEGORIES ===

    prefetchCategories: () => {
      queryClient.prefetchQuery({
        ...QueryFilters.categories.all(),
        queryFn: ({ signal }) => categoryApi.getCategories({ signal }),
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
      })
    },

    // === USER ===

    prefetchUserProfile: () => {
      queryClient.prefetchQuery({
        ...QueryFilters.user.profile(),
        queryFn: () => userApi.getProfile(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      })
    },

    // === CART & PURCHASES ===

    prefetchCart: () => {
      queryClient.prefetchQuery({
        ...QueryFilters.purchases.cart(),
        queryFn: () => purchasesApi.getPurchases({ status: purchasesStatus.inCart }),
        staleTime: 1 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      })
    },

    // === SMART PREFETCHING ===

    smartPrefetch: {
      nextPage: (currentPage: number, filters: ProductListConfig) => {
        const nextPageFilters = { ...filters, page: String(currentPage + 1) }
        queryClient.prefetchQuery({
          ...QueryFilters.products.list(nextPageFilters),
          queryFn: ({ signal }) => productApi.getProducts(nextPageFilters, { signal }),
          staleTime: 2 * 60 * 1000,
          gcTime: 5 * 60 * 1000,
        })
      },

      relatedProducts: (categoryId: string) => {
        const relatedFilters = { category: categoryId, limit: '20' }
        queryClient.prefetchQuery({
          queryKey: ['products', 'related', categoryId],
          queryFn: ({ signal }) => productApi.getProducts(relatedFilters, { signal }),
          staleTime: 10 * 60 * 1000,
          gcTime: 20 * 60 * 1000,
        })
      },

      trendingProducts: () => {
        const trendingFilters: ProductListConfig = { sort_by: 'sold', order: 'desc', limit: '20' }
        queryClient.prefetchQuery({
          ...QueryFilters.products.trending(),
          queryFn: ({ signal }) => productApi.getProducts(trendingFilters, { signal }),
          staleTime: 15 * 60 * 1000,
          gcTime: 30 * 60 * 1000,
        })
      },
    },

    // === UTILITY FUNCTIONS ===

    isCached: (queryKey: unknown[]) => {
      return queryClient.getQueryData(queryKey) !== undefined
    },

    getCachedData: (queryKey: unknown[]) => {
      return queryClient.getQueryData(queryKey)
    },

    batchPrefetch: (prefetchFunctions: (() => void)[]) => {
      prefetchFunctions.forEach((fn) => fn())
    },
  }
}
