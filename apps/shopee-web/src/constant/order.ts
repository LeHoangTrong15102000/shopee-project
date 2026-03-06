import type { OrderStatus } from 'src/types/orderTracking.type'

// Numeric status values for order URL query params, following the same pattern as purchasesStatus
export const ordersStatus = {
  all: 0,
  pending: 1,
  confirmed: 2,
  processing: 3,
  shipping: 4,
  delivered: 5,
  cancelled: 6,
  returned: 7
} as const

export type OrdersStatusValue = (typeof ordersStatus)[keyof typeof ordersStatus]

// Bidirectional conversion: numeric <-> string
const numberToString: Record<number, OrderStatus> = {
  [ordersStatus.pending]: 'pending',
  [ordersStatus.confirmed]: 'confirmed',
  [ordersStatus.processing]: 'processing',
  [ordersStatus.shipping]: 'shipping',
  [ordersStatus.delivered]: 'delivered',
  [ordersStatus.cancelled]: 'cancelled',
  [ordersStatus.returned]: 'returned'
}

const stringToNumber: Record<string, number> = {
  pending: ordersStatus.pending,
  confirmed: ordersStatus.confirmed,
  processing: ordersStatus.processing,
  shipping: ordersStatus.shipping,
  delivered: ordersStatus.delivered,
  cancelled: ordersStatus.cancelled,
  returned: ordersStatus.returned
}

/** Convert numeric status (from URL) to OrderStatus string (for API/internal use) */
export const orderStatusFromNumber = (num: number): OrderStatus | undefined => numberToString[num]

/** Convert OrderStatus string to numeric value (for URL) */
export const orderStatusToNumber = (status: string): number => stringToNumber[status] ?? ordersStatus.all
