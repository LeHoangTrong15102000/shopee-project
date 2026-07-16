export const ORDER_STATUS = {
  PENDING: 'pending',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_FAILED: 'payment_failed',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const

export type OrderStatusType = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]
