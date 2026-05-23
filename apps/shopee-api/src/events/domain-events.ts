/**
 * Domain event type definitions.
 *
 * All 13 domain events are defined as a discriminated union.
 * Each event has a `type` discriminant and a `payload` object.
 */

// ─── Individual event payload interfaces ─────────────────────────────────────

export interface OrderCreatedPayload {
  orderId: string
  userId: string
  totalAmount: number
  items: Array<{ productId: string; quantity: number; price?: number }>
}

export interface OrderStatusChangedPayload {
  orderId: string
  userId: string
  previousStatus: string
  newStatus: string
}

export interface OrderCancelledPayload {
  orderId: string
  userId: string
  reason?: string
}

export interface ProductCreatedPayload {
  productId: string
  name: string
  sellerId?: string
}

export interface ProductUpdatedPayload {
  productId: string
  name: string
  changedFields?: string[]
}

export interface ProductStockChangedPayload {
  productId: string
  previousStock: number
  newStock: number
}

export interface UserRegisteredPayload {
  userId: string
  email: string
  registeredAt?: Date
}

export interface UserLoginPayload {
  userId: string
  email: string
  ip?: string
}

export interface UserPasswordChangedPayload {
  userId: string
  email: string
}

export interface FlashSaleStartedPayload {
  saleId: string
  name: string
  startTime: Date
  endTime: Date
}

export interface FlashSaleEndedPayload {
  saleId: string
  name: string
  endTime: Date
}

export interface PaymentCompletedPayload {
  paymentId: string
  orderId: string
  userId: string
  amount: number
  provider: string
}

export interface PaymentFailedPayload {
  paymentId: string
  orderId: string
  userId: string
  reason?: string
}

// ─── Discriminated union ──────────────────────────────────────────────────────

export type DomainEvent =
  | { type: 'order.created'; payload: OrderCreatedPayload }
  | { type: 'order.status_changed'; payload: OrderStatusChangedPayload }
  | { type: 'order.cancelled'; payload: OrderCancelledPayload }
  | { type: 'product.created'; payload: ProductCreatedPayload }
  | { type: 'product.updated'; payload: ProductUpdatedPayload }
  | { type: 'product.stock_changed'; payload: ProductStockChangedPayload }
  | { type: 'user.registered'; payload: UserRegisteredPayload }
  | { type: 'user.login'; payload: UserLoginPayload }
  | { type: 'user.password_changed'; payload: UserPasswordChangedPayload }
  | { type: 'flash_sale.started'; payload: FlashSaleStartedPayload }
  | { type: 'flash_sale.ended'; payload: FlashSaleEndedPayload }
  | { type: 'payment.completed'; payload: PaymentCompletedPayload }
  | { type: 'payment.failed'; payload: PaymentFailedPayload }

export type DomainEventType = DomainEvent['type']
