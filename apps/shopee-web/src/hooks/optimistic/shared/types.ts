import { Purchase } from 'src/types/purchases.type'
import { Review } from 'src/types/review.type'
import { SuccessResponseApi } from 'src/types/utils.type'

// Cache-shape interfaces for React Query data
export interface PurchasesQueryData {
  data: SuccessResponseApi<Purchase[]>
}

export interface ReviewsQueryData {
  data: SuccessResponseApi<{ reviews: Review[]; pagination: unknown }>
}

export interface WishlistCheckQueryData {
  data: SuccessResponseApi<{ in_wishlist: boolean }>
}

export interface WishlistCountQueryData {
  data: SuccessResponseApi<{ count: number }>
}

// Base optimistic context type
export interface OptimisticContext {
  previousData?: unknown
  [key: string]: unknown
}

// Cart-related types
export interface AddToCartPayload {
  product_id: string
  buy_count: number
}

export interface UpdateQuantityPayload {
  product_id: string
  buy_count: number
}

export interface AddToCartContext extends OptimisticContext {
  previousPurchases?: PurchasesQueryData | undefined
  optimisticPurchase?: Purchase | undefined
}

export interface UpdateQuantityContext extends OptimisticContext {
  previousData?: PurchasesQueryData | undefined
  product_id?: string
}

export interface RemoveFromCartContext extends OptimisticContext {
  previousData?: PurchasesQueryData | undefined
  removedItems?: Purchase[]
  undoToast?: string | number | undefined
}

// Review-related types
export interface ReviewLikeContext extends OptimisticContext {
  previousReviews?: unknown
  reviewId?: string
}

// Wishlist-related types
export interface WishlistContext extends OptimisticContext {
  previousWishlistCheck?: unknown
  previousWishlistData?: unknown
  previousWishlistCount?: unknown
  productId?: string
}

// Notification-related types
export interface NotificationContext extends OptimisticContext {
  previousNotifications?: unknown
  notificationId?: string
}

export interface MarkAllAsReadContext extends OptimisticContext {
  previousNotifications?: unknown
  previousUnreadCount?: number
}

// Toast configurations
export interface ToastConfig {
  autoClose: number
  position: 'top-center' | 'top-right' | 'top-left' | 'bottom-center' | 'bottom-right' | 'bottom-left'
}

// Query keys
export const QUERY_KEYS = {
  PURCHASES_IN_CART: ['purchases', { status: 'inCart' }] as readonly unknown[],
  PRODUCT_REVIEWS: (productId: string) => ['product-reviews', productId] as readonly unknown[],
  PRODUCTS: ['products'] as readonly unknown[],
  PRODUCT: ['product'] as readonly unknown[],
  WISHLIST: ['wishlist'] as readonly unknown[],
  WISHLIST_CHECK: (productId: string) => ['wishlist', 'check', productId] as readonly unknown[],
  WISHLIST_COUNT: ['wishlist', 'count'] as readonly unknown[],
  NOTIFICATIONS: ['notifications'] as readonly unknown[]
}
