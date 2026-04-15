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

// Order
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  product: Product | string
  buy_count: number
  price: number
  price_before_discount: number
}

export interface Order {
  _id: string
  user: User | string
  items: OrderItem[]
  total_price: number
  status: OrderStatus
  payment_method?: string
  shipping_address?: string
  note?: string
  createdAt: string
  updatedAt: string
}

// Voucher
export type DiscountType = 'percentage' | 'fixed'

export interface Voucher {
  _id: string
  code: string
  discount_type: DiscountType
  discount_value: number
  min_order_value: number
  usage_limit: number
  used_count: number
  is_active: boolean
  start_date: string
  end_date: string
  createdAt: string
  updatedAt: string
}

export interface VoucherUsage {
  _id: string
  user: User | string
  voucher: string
  order: string
  discount_amount: number
  createdAt: string
}

// Loyalty
export interface LoyaltyReward {
  _id: string
  name: string
  description: string
  points_required: number
  is_active: boolean
  createdAt: string
  updatedAt: string
}

export interface LoyaltyTransaction {
  _id: string
  user: User | string
  type: 'earn' | 'redeem' | 'adjust'
  points: number
  description: string
  createdAt: string
}

// Notification
export interface Notification {
  _id: string
  user?: User | string
  title: string
  message: string
  type: 'targeted' | 'broadcast'
  is_read: boolean
  createdAt: string
}

// QA
export interface QAQuestion {
  _id: string
  user: { _id: string; name: string; email: string; avatar?: string }
  user_id?: string
  user_name?: string
  user_avatar?: string
  title?: string
  question?: string
  content?: string
  answers: QAAnswer[]
  answers_count: number
  likes_count: number
  createdAt: string
  updatedAt: string
}

export interface QAAnswer {
  _id: string
  user: { _id: string; name: string; email: string; avatar?: string }
  user_name?: string
  user_avatar?: string
  question?: string
  content?: string
  answer?: string
  likes_count: number
  createdAt: string
  created_at?: string
  updatedAt?: string
}

// Dashboard
export interface DashboardOverview {
  total_revenue: number
  total_orders: number
  total_users: number
  total_products: number
  revenue_change?: number
  orders_change?: number
  users_change?: number
  products_change?: number
}

export interface RevenueData {
  date: string
  revenue: number
}

export interface OrderTrendData {
  date: string
  orders: number
}

export interface UserGrowthData {
  date: string
  users: number
}

export interface TopProduct {
  _id: string
  name: string
  image: string
  revenue: number
  sold: number
}

export interface TopBuyer {
  _id: string
  name: string
  email: string
  avatar?: string
  total_spent: number
  total_orders: number
}

export interface RevenueByCategoryData {
  category: string
  revenue: number
  percent: number
}

// Analytics
export interface ProductAnalytics {
  _id: string
  name: string
  image: string
  sold?: number
  view?: number
  rating?: number
  revenue?: number
}

export interface ChatbotAnalytics {
  total_conversations: number
  total_messages: number
  avg_messages_per_conversation: number
  satisfaction_rate: number
}

export interface ChatbotPerformanceData {
  date: string
  conversations: number
  messages: number
}

// Import
export interface ImportResult {
  imported: number
  deleted: number
  locationStats: Array<{ _id: string; count: number }>
}

export interface ImportStats {
  totalProducts: number
  productsWithLocation: number
  locationStats: Array<{ _id: string; count: number }>
}
