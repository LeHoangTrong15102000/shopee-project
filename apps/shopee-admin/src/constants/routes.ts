export const ROUTES = {
  DASHBOARD: '/',
  LOGIN: '/login',

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
} as const

export type RouteKey = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteKey]
