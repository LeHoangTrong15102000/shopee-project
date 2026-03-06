import type { Query } from '@tanstack/react-query'
import { ProductListConfig } from 'src/types/product.type'
import { PurchaseListStatus } from 'src/types/purchases.type'

/**
 * QueryFilters - Centralized query key management cho TanStack Query
 *
 * Giúp quản lý cache một cách thống nhất và hỗ trợ invalidation selective
 *
 * Usage examples:
 * - QueryFilters.products.all() → match tất cả product queries
 * - QueryFilters.products.detail(id) → match product detail cụ thể
 * - QueryFilters.products.list(filters) → match product list với filters cụ thể
 */
export const QueryFilters = {
  // Products
  products: {
    all: () => ({ queryKey: ['products'] }),
    lists: () => ({ queryKey: ['products', 'list'] }),
    list: (filters: ProductListConfig) => ({
      queryKey: ['products', 'list', filters]
    }),
    details: () => ({ queryKey: ['products', 'detail'] }),
    detail: (id: string) => ({
      queryKey: ['products', 'detail', id]
    }),
    search: (term: string) => ({
      queryKey: ['products', 'search', term]
    }),
    trending: () => ({
      queryKey: ['products', 'trending']
    }),
    related: (categoryId: string) => ({
      queryKey: ['products', 'related', categoryId]
    }),
    recommendations: () => ({
      queryKey: ['products', 'recommendations']
    })
  },

  // Cart & Purchases
  purchases: {
    all: () => ({ queryKey: ['purchases'] }),
    byStatus: (status: PurchaseListStatus) => ({
      queryKey: ['purchases', { status }]
    }),
    cart: () => ({
      queryKey: ['purchases', { status: -1 }] // -1 là status của cart
    }),
    history: () => ({
      queryKey: ['purchases', 'history']
    })
  },

  // User
  user: {
    all: () => ({ queryKey: ['user'] }),
    profile: () => ({ queryKey: ['user', 'profile'] }),
    addresses: () => ({ queryKey: ['user', 'addresses'] })
  },

  // Categories
  categories: {
    all: () => ({ queryKey: ['categories'] }),
    tree: () => ({ queryKey: ['categories', 'tree'] }),
    featured: () => ({ queryKey: ['categories', 'featured'] })
  },

  // Search
  search: {
    all: () => ({ queryKey: ['search'] }),
    suggestions: (term: string) => ({
      queryKey: ['searchSuggestions', term]
    }),
    history: () => ({ queryKey: ['search', 'history'] })
  },

  // Reviews
  reviews: {
    all: () => ({ queryKey: ['reviews'] }),
    byProduct: (productId: string) => ({
      queryKey: ['reviews', 'product', productId]
    }),
    byUser: () => ({ queryKey: ['reviews', 'user'] })
  },

  // Notifications
  notifications: {
    all: () => ({ queryKey: ['notifications'] }),
    unread: () => ({ queryKey: ['notifications', 'unread'] }),
    count: () => ({ queryKey: ['notifications', 'count'] })
  }
}

/**
 * Predicate functions cho advanced filtering
 */
export const QueryPredicates = {
  // Predicate để match products theo category
  productsByCategory: (categoryId: string) => (query: Query) => {
    const [entity, type, filters] = query.queryKey as [string, string, Record<string, unknown>]
    return entity === 'products' && type === 'list' && filters?.category === categoryId
  },

  // Predicate để match products theo price range
  productsByPriceRange: (minPrice: number, maxPrice: number) => (query: Query) => {
    const [entity, type, filters] = query.queryKey as [string, string, Record<string, unknown>]
    if (entity !== 'products' || type !== 'list') return false

    const filterPriceMin = filters?.price_min ? Number(filters.price_min) : 0
    const filterPriceMax = filters?.price_max ? Number(filters.price_max) : Infinity

    return filterPriceMin >= minPrice && filterPriceMax <= maxPrice
  },

  // Predicate để match user-specific data
  userSpecificData: () => (query: Query) => {
    const [entity, type] = query.queryKey
    return (
      entity === 'user' ||
      entity === 'purchases' ||
      entity === 'notifications' ||
      (entity === 'products' && (type === 'recommendations' || type === 'personalized')) ||
      (entity === 'reviews' && type === 'user')
    )
  },

  // Predicate để match queries có thể outdated sau product update
  affectedByProductUpdate: (productId: string) => (query: Query) => {
    const [entity, type, param] = query.queryKey

    // Product detail cụ thể
    if (entity === 'products' && type === 'detail' && param === productId) {
      return true
    }

    // Product lists (có thể chứa product đã update)
    if (entity === 'products' && type === 'list') {
      return true
    }

    // Search results (có thể chứa product đã update)
    if (entity === 'products' && type === 'search') {
      return true
    }

    // Trending, recommendations có thể bị ảnh hưởng
    if (entity === 'products' && (type === 'trending' || type === 'recommendations')) {
      return true
    }

    return false
  }
}

export default QueryFilters
