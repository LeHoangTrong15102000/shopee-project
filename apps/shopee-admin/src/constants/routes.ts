export const ROUTES = {
  DASHBOARD: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  USERS: '/users',
  USER_DETAIL: '/users/:id',

  PRODUCTS: '/products',
  PRODUCT_NEW: '/products/new',
  PRODUCT_EDIT: '/products/:id/edit',
  PRODUCT_DETAIL: '/products/:id',

  CATEGORIES: '/categories',

  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',

  VOUCHERS: '/vouchers',
  VOUCHER_DETAIL: '/vouchers/:id',

  REVIEWS: '/reviews',
  REVIEW_DETAIL: '/reviews/:id',

  LOYALTY: '/loyalty',
  INVENTORY: '/inventory',
  ANALYTICS: '/analytics',

  NOTIFICATIONS: '/notifications',
  QA: '/qa',
  IMPORT: '/import',
  SETTINGS: '/settings',
  ACTIVITY_LOG: '/activity-log',

  CONVERSATIONS: '/conversations',
  CONVERSATION_DETAIL: '/conversations/:id',

  SHIPPING_METHODS: '/shipping-methods',
  PAYMENT_METHODS: '/payment-methods',
  PRICE_ALERTS: '/price-alerts',
  CHECKIN: '/checkin',
} as const

export type RouteKey = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteKey]
