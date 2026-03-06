import { QueryClient } from '@tanstack/react-query'
import { LoaderFunction } from 'react-router'

import categoryApi from 'src/apis/category.api'
import productApi from 'src/apis/product.api'
import purchasesApi from 'src/apis/purchases.api'
import userApi from 'src/apis/user.api'
import { purchasesStatus } from 'src/constant/purchase'
import { ProductListConfig } from 'src/types/product.type'
import { RetryError } from 'src/types/utils.type'
import { QueryFilters } from 'src/utils/queryFilters'

/**
 * Create optimized QueryClient for prefetching
 */
const createPrefetchQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: (failureCount, error: RetryError) => {
          // Không retry trong prefetch nếu 404
          if (error?.response?.status === 404) return false
          return failureCount < 2 // Ít retry hơn để loader nhanh hơn
        }
      }
    }
  })
}

/**
 * Loader cho ProductDetail page
 * Prefetch product detail, reviews, và related data
 */
export const productDetailLoader: LoaderFunction = async ({ params, request }) => {
  const queryClient = createPrefetchQueryClient()
  const productId = params.productId!
  const url = new URL(request.url)

  try {
    // Critical data - phải thành công
    await queryClient.prefetchQuery({
      ...QueryFilters.products.detail(productId),
      queryFn: ({ signal }) => productApi.getProductDetail(productId, { signal })
    })

    // Non-critical data - fail cũng được
    const prefetchPromises = []

    // Conditional prefetch dựa trên query params
    if (url.searchParams.get('includeReviews') !== 'false') {
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: ['reviews', 'product', productId],
          queryFn: ({ signal }) => {
            // API call cho reviews (giả định)
            return fetch(`/api/reviews/product/${productId}`, { signal }).then((res) => res.json())
          }
        })
      )
    }

    // Prefetch categories cho related products
    prefetchPromises.push(
      queryClient.prefetchQuery({
        ...QueryFilters.categories.all(),
        queryFn: ({ signal }) => categoryApi.getCategories({ signal })
      })
    )

    await Promise.allSettled(prefetchPromises)
  } catch (error: unknown) {
    // Nếu critical data fail, redirect về 404
    const retryErr = error as RetryError
    if (retryErr?.response?.status === 404) {
      throw new Response('Product not found', { status: 404 })
    }

    // Các lỗi khác, log và continue
    console.error('Product detail prefetch error:', error)
  }

  return queryClient
}

/**
 * Loader cho ProductList page
 * Prefetch products và categories
 */
export const productListLoader: LoaderFunction = async ({ request }) => {
  const queryClient = createPrefetchQueryClient()
  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams) as ProductListConfig

  try {
    // Prefetch product list
    await Promise.allSettled([
      queryClient.prefetchQuery({
        ...QueryFilters.products.list(searchParams),
        queryFn: ({ signal }) => productApi.getProducts(searchParams, { signal })
      }),

      // Prefetch categories cho filters
      queryClient.prefetchQuery({
        ...QueryFilters.categories.all(),
        queryFn: ({ signal }) => categoryApi.getCategories({ signal })
      })
    ])
  } catch (error) {
    console.error('Product list prefetch error:', error)
  }

  return queryClient
}

/**
 * Loader cho Home page
 * Prefetch trending products, categories, và banner data
 */
export const homeLoader: LoaderFunction = async () => {
  const queryClient = createPrefetchQueryClient()

  try {
    await Promise.allSettled([
      // Trending products
      queryClient.prefetchQuery({
        ...QueryFilters.products.trending(),
        queryFn: ({ signal }) => {
          const trendingFilters: ProductListConfig = { sort_by: 'sold', order: 'desc', limit: '20' }
          return productApi.getProducts(trendingFilters, { signal })
        }
      }),

      // Featured categories
      queryClient.prefetchQuery({
        ...QueryFilters.categories.featured(),
        queryFn: ({ signal }) => categoryApi.getCategories({ signal })
      }),

      // New products
      queryClient.prefetchQuery({
        queryKey: ['products', 'new'],
        queryFn: ({ signal }) => {
          const newFilters: ProductListConfig = { sort_by: 'createdAt', order: 'desc', limit: '20' }
          return productApi.getProducts(newFilters, { signal })
        }
      })
    ])
  } catch (error) {
    console.error('Home page prefetch error:', error)
  }

  return queryClient
}

/**
 * Loader cho Cart page
 * Prefetch cart data và user info nếu đã login
 */
export const cartLoader: LoaderFunction = async () => {
  const queryClient = createPrefetchQueryClient()

  try {
    // Check if user is logged in (có thể check từ localStorage hoặc cookie)
    const isLoggedIn = localStorage.getItem('access_token')

    if (isLoggedIn) {
      await Promise.allSettled([
        // Prefetch cart
        queryClient.prefetchQuery({
          ...QueryFilters.purchases.cart(),
          queryFn: () => purchasesApi.getPurchases({ status: purchasesStatus.inCart })
        }),

        // Prefetch user profile
        queryClient.prefetchQuery({
          ...QueryFilters.user.profile(),
          queryFn: () => userApi.getProfile()
        })
      ])
    }
  } catch (error) {
    console.error('Cart page prefetch error:', error)
  }

  return queryClient
}

/**
 * Loader cho User Profile page
 * Prefetch user data và purchase history
 */
export const userProfileLoader: LoaderFunction = async () => {
  const queryClient = createPrefetchQueryClient()

  try {
    const isLoggedIn = localStorage.getItem('access_token')

    if (!isLoggedIn) {
      // Redirect to login if not logged in
      throw new Response('Unauthorized', { status: 401 })
    }

    await Promise.allSettled([
      // User profile
      queryClient.prefetchQuery({
        ...QueryFilters.user.profile(),
        queryFn: () => userApi.getProfile()
      }),

      // Purchase history
      queryClient.prefetchQuery({
        ...QueryFilters.purchases.history(),
        queryFn: () => purchasesApi.getPurchases({ status: purchasesStatus.waitForConfirmation })
      })
    ])
  } catch (error) {
    console.error('User profile prefetch error:', error)
  }

  return queryClient
}

/**
 * Error loader function
 * Để handle các lỗi trong routing
 */
export const errorLoader: LoaderFunction = async ({ params }) => {
  console.error('Router error:', params)
  return null
}

/**
 * Smart loader với conditional prefetching
 * Dựa trên user behavior để quyết định prefetch gì
 */
export const createSmartLoader = (
  baseLoader: LoaderFunction,
  options: {
    shouldPrefetchRelated?: boolean
    maxPrefetchItems?: number
    priorityLevel?: 'high' | 'medium' | 'low'
  } = {}
): LoaderFunction => {
  return async (args) => {
    const { shouldPrefetchRelated = true, maxPrefetchItems = 5, priorityLevel = 'medium' } = options

    // Call base loader
    const queryClient = await baseLoader(args)

    // Additional smart prefetching based on options
    if (shouldPrefetchRelated && queryClient instanceof QueryClient) {
      try {
        // Prefetch based on priority level
        const prefetchPromises = []

        if (priorityLevel === 'high') {
          // Prefetch more aggressively
          prefetchPromises.push(
            queryClient.prefetchQuery({
              ...QueryFilters.products.trending(),
              queryFn: ({ signal }) => {
                const trendingFilters: ProductListConfig = {
                  sort_by: 'sold',
                  order: 'desc',
                  limit: String(maxPrefetchItems)
                }
                return productApi.getProducts(trendingFilters, { signal })
              }
            })
          )
        }

        await Promise.allSettled(prefetchPromises)
      } catch (error) {
        console.error('Smart prefetch error:', error)
      }
    }

    return queryClient
  }
}

export default {
  productDetailLoader,
  productListLoader,
  homeLoader,
  cartLoader,
  userProfileLoader,
  errorLoader,
  createSmartLoader
}
