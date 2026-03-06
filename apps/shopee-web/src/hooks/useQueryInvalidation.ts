import { useQueryClient, Query } from '@tanstack/react-query'
import { QueryFilters, QueryPredicates } from '../utils/queryFilters'
import { PurchaseListStatus } from '../types/purchases.type'

/**
 * Hook quản lý invalidation của queries một cách thông minh
 * Sử dụng QueryFilters để invalidate selective thay vì invalidate all
 */
export const useQueryInvalidation = () => {
  const queryClient = useQueryClient()

  return {
    // === PRODUCTS ===

    /**
     * Invalidate tất cả queries liên quan đến products
     * Sử dụng khi có thay đổi lớn ảnh hưởng đến toàn bộ hệ thống products
     */
    invalidateProducts: () => {
      queryClient.invalidateQueries(QueryFilters.products.all())
    },

    /**
     * Invalidate một product detail cụ thể
     * Sử dụng khi update thông tin của một sản phẩm cụ thể
     */
    invalidateProductDetail: (productId: string) => {
      queryClient.invalidateQueries(QueryFilters.products.detail(productId))
    },

    /**
     * Invalidate tất cả product lists (nhưng không ảnh hưởng product details)
     * Sử dụng khi có sản phẩm mới được thêm/xóa, price thay đổi
     */
    invalidateProductLists: () => {
      queryClient.invalidateQueries(QueryFilters.products.lists())
    },

    /**
     * Invalidate products theo category cụ thể
     * Sử dụng khi có thay đổi trong một category
     */
    invalidateProductsByCategory: (categoryId: string) => {
      queryClient.invalidateQueries({
        predicate: QueryPredicates.productsByCategory(categoryId)
      })
    },

    /**
     * Invalidate products trong price range cụ thể
     * Sử dụng khi có thay đổi giá ảnh hưởng đến range
     */
    invalidateProductsByPriceRange: (minPrice: number, maxPrice: number) => {
      queryClient.invalidateQueries({
        predicate: QueryPredicates.productsByPriceRange(minPrice, maxPrice)
      })
    },

    /**
     * Invalidate tất cả queries bị ảnh hưởng bởi product update
     * Smart invalidation cho product updates
     */
    invalidateAffectedByProductUpdate: (productId: string) => {
      queryClient.invalidateQueries({
        predicate: QueryPredicates.affectedByProductUpdate(productId)
      })
    },

    /**
     * Invalidate search results
     */
    invalidateSearchResults: () => {
      queryClient.invalidateQueries(QueryFilters.search.all())
    },

    // === CART & PURCHASES ===

    /**
     * Invalidate cart data
     * Sử dụng khi add/remove/update items trong cart
     */
    invalidateCart: () => {
      queryClient.invalidateQueries(QueryFilters.purchases.cart())
    },

    /**
     * Invalidate tất cả purchases data
     * Sử dụng khi có thay đổi lớn trong purchase history
     */
    invalidatePurchases: () => {
      queryClient.invalidateQueries(QueryFilters.purchases.all())
    },

    /**
     * Invalidate purchases theo status
     */
    invalidatePurchasesByStatus: (status: PurchaseListStatus) => {
      queryClient.invalidateQueries(QueryFilters.purchases.byStatus(status))
    },

    // === USER ===

    /**
     * Invalidate tất cả user data
     * Sử dụng khi user login/logout hoặc update profile
     */
    invalidateUser: () => {
      queryClient.invalidateQueries(QueryFilters.user.all())
    },

    /**
     * Invalidate user profile
     */
    invalidateUserProfile: () => {
      queryClient.invalidateQueries(QueryFilters.user.profile())
    },

    // === CATEGORIES ===

    /**
     * Invalidate categories data
     * Sử dụng khi có thay đổi trong category structure
     */
    invalidateCategories: () => {
      queryClient.invalidateQueries(QueryFilters.categories.all())
    },

    // === REVIEWS ===

    /**
     * Invalidate reviews của một product
     */
    invalidateProductReviews: (productId: string) => {
      queryClient.invalidateQueries(QueryFilters.reviews.byProduct(productId))
    },

    /**
     * Invalidate user reviews
     */
    invalidateUserReviews: () => {
      queryClient.invalidateQueries(QueryFilters.reviews.byUser())
    },

    // === NOTIFICATIONS ===

    /**
     * Invalidate notifications
     */
    invalidateNotifications: () => {
      queryClient.invalidateQueries(QueryFilters.notifications.all())
    },

    /**
     * Invalidate unread notifications count
     */
    invalidateNotificationCount: () => {
      queryClient.invalidateQueries(QueryFilters.notifications.count())
    },

    // === ADVANCED OPERATIONS ===

    /**
     * Invalidate tất cả user-specific data (khi logout)
     * Sử dụng khi user đăng xuất
     */
    invalidateUserSpecificData: () => {
      queryClient.invalidateQueries({
        predicate: QueryPredicates.userSpecificData()
      })
    },

    /**
     * Selective invalidation - chỉ invalidate queries match với predicate
     */
    invalidateByPredicate: (predicate: (query: Query) => boolean) => {
      queryClient.invalidateQueries({ predicate })
    },

    /**
     * Batch invalidation - invalidate nhiều types cùng lúc
     */
    batchInvalidate: (operations: (() => void)[]) => {
      operations.forEach((operation) => operation())
    },

    // === UTILITY FUNCTIONS ===

    /**
     * Get all cached data for debugging
     */
    getAllCachedData: () => {
      return queryClient.getQueryCache().getAll()
    },

    /**
     * Clear all cache
     */
    clearAllCache: () => {
      queryClient.clear()
    },

    /**
     * Remove specific query from cache
     */
    removeQuery: (queryKey: unknown[]) => {
      queryClient.removeQueries({ queryKey })
    }
  }
}

export default useQueryInvalidation
