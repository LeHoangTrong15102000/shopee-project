import type {
  Product as SharedProduct,
  ProductSKU,
  ProductVariant,
  ProductVariantOption,
  ProductVariantCombination,
  ProductWithVariants,
  ProductList,
  ProductListConfig,
  Category,
  User,
  SuccessResponse,
  ErrorResponse,
  PaginatedData,
  Review,
  ReviewComment,
} from '@shopee/shared-types'

// Re-export shared types
export type {
  Category,
  User,
  SuccessResponse,
  ErrorResponse,
  PaginatedData,
  Review,
  ReviewComment,
  ProductSKU,
  ProductVariant,
  ProductVariantOption,
  ProductVariantCombination,
  ProductWithVariants,
  ProductList,
  ProductListConfig,
}

// Extend shared Product with optional variants/skus for admin
export type Product = SharedProduct

// Pagination
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Domain type re-exports
export type { OrderStatus, OrderItem, Order } from './orders'
export type { DiscountType, Voucher, VoucherUsage } from './vouchers'
export type { LoyaltyReward, LoyaltyTransaction } from './loyalty'
export type { Notification } from './notifications'
export type { QAQuestion, QAAnswer } from './qa'
export type {
  DashboardOverview,
  RevenueData,
  OrderTrendData,
  UserGrowthData,
  TopProduct,
  TopBuyer,
  RevenueByCategoryData,
  ProductAnalytics,
  ChatbotAnalytics,
  ChatbotPerformanceData,
} from './analytics'
export type { ImportResult, ImportStats } from './import'
