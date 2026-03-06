import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

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

    /**
     * Prefetch product detail
     * Sử dụng khi hover vào product card hoặc trước khi navigate
     */
    prefetchProduct: useCallback(
      (productId: string) => {
        queryClient.prefetchQuery({
          ...QueryFilters.products.detail(productId),
          queryFn: ({ signal }) => productApi.getProductDetail(productId, { signal }),
          staleTime: 5 * 60 * 1000, // 5 phút
          gcTime: 10 * 60 * 1000 // 10 phút
        })
      },
      [queryClient]
    ),

    /**
     * Prefetch product list với filters cụ thể
     * Sử dụng khi user có khả năng navigate đến trang list
     */
    prefetchProductList: useCallback(
      (filters: ProductListConfig) => {
        queryClient.prefetchQuery({
          ...QueryFilters.products.list(filters),
          queryFn: ({ signal }) => productApi.getProducts(filters, { signal }),
          staleTime: 3 * 60 * 1000, // 3 phút
          gcTime: 8 * 60 * 1000 // 8 phút
        })
      },
      [queryClient]
    ),

    /**
     * Prefetch search suggestions
     * Sử dụng khi user đang gõ trong search box
     */
    prefetchSearchSuggestions: useCallback(
      (searchTerm: string) => {
        if (searchTerm.length < 2) return

        queryClient.prefetchQuery({
          ...QueryFilters.search.suggestions(searchTerm),
          queryFn: ({ signal }) => productApi.getSearchSuggestions({ q: searchTerm }, { signal }),
          staleTime: 2 * 60 * 1000, // 2 phút
          gcTime: 5 * 60 * 1000 // 5 phút
        })
      },
      [queryClient]
    ),

    // === CATEGORIES ===

    /**
     * Prefetch categories
     * Sử dụng khi user có khả năng sử dụng filters
     */
    prefetchCategories: useCallback(() => {
      queryClient.prefetchQuery({
        ...QueryFilters.categories.all(),
        queryFn: ({ signal }) => categoryApi.getCategories({ signal }),
        staleTime: 15 * 60 * 1000, // 15 phút
        gcTime: 30 * 60 * 1000 // 30 phút
      })
    }, [queryClient]),

    // === USER ===

    /**
     * Prefetch user profile
     * Sử dụng khi user login hoặc navigate đến profile page
     */
    prefetchUserProfile: useCallback(() => {
      queryClient.prefetchQuery({
        ...QueryFilters.user.profile(),
        queryFn: () => userApi.getProfile(),
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000 // 10 phút
      })
    }, [queryClient]),

    // === CART & PURCHASES ===

    /**
     * Prefetch cart data
     * Sử dụng khi user login hoặc có thể truy cập cart
     */
    prefetchCart: useCallback(() => {
      queryClient.prefetchQuery({
        ...QueryFilters.purchases.cart(),
        queryFn: () => purchasesApi.getPurchases({ status: purchasesStatus.inCart }),
        staleTime: 1 * 60 * 1000, // 1 phút
        gcTime: 5 * 60 * 1000 // 5 phút
      })
    }, [queryClient]),

    // === SMART PREFETCHING ===

    /**
     * Smart prefetch dựa trên user behavior
     */
    smartPrefetch: {
      /**
       * Prefetch next page trong pagination
       */
      nextPage: useCallback(
        (currentPage: number, filters: ProductListConfig) => {
          const nextPageFilters = { ...filters, page: String(currentPage + 1) }
          queryClient.prefetchQuery({
            ...QueryFilters.products.list(nextPageFilters),
            queryFn: ({ signal }) => productApi.getProducts(nextPageFilters, { signal }),
            staleTime: 2 * 60 * 1000,
            gcTime: 5 * 60 * 1000
          })
        },
        [queryClient]
      ),

      /**
       * Prefetch related products trong cùng category
       */
      relatedProducts: useCallback(
        (categoryId: string) => {
          const relatedFilters = { category: categoryId, limit: '20' }
          queryClient.prefetchQuery({
            queryKey: ['products', 'related', categoryId],
            queryFn: ({ signal }) => productApi.getProducts(relatedFilters, { signal }),
            staleTime: 10 * 60 * 1000,
            gcTime: 20 * 60 * 1000
          })
        },
        [queryClient]
      ),

      /**
       * Prefetch trending products
       */
      trendingProducts: useCallback(() => {
        const trendingFilters: ProductListConfig = { sort_by: 'sold', order: 'desc', limit: '20' }
        queryClient.prefetchQuery({
          ...QueryFilters.products.trending(),
          queryFn: ({ signal }) => productApi.getProducts(trendingFilters, { signal }),
          staleTime: 15 * 60 * 1000,
          gcTime: 30 * 60 * 1000
        })
      }, [queryClient])
    },

    // === UTILITY FUNCTIONS ===

    /**
     * Check if data is already cached
     */
    isCached: useCallback(
      (queryKey: unknown[]) => {
        return queryClient.getQueryData(queryKey) !== undefined
      },
      [queryClient]
    ),

    /**
     * Get cached data if available
     */
    getCachedData: useCallback(
      (queryKey: unknown[]) => {
        return queryClient.getQueryData(queryKey)
      },
      [queryClient]
    ),

    /**
     * Batch prefetch multiple items
     */
    batchPrefetch: useCallback((prefetchFunctions: (() => void)[]) => {
      prefetchFunctions.forEach((fn) => fn())
    }, [])
  }
}
