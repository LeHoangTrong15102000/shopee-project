/**
 * TypeScript interfaces for BullMQ job payloads.
 * Each queue has a strongly-typed payload interface.
 */

export interface EmailJobPayload {
  to: string
  subject: string
  body: string
  /** Optional template name for future email provider integration */
  template?: string
  /** Optional template data */
  data?: Record<string, unknown>
}

export interface NotificationJobPayload {
  userId: string
  title: string
  content: string
  type: 'order' | 'promotion' | 'system' | 'other' | 'flash_sale' | 'price_drop'
  link?: string
}

export interface SearchSyncJobPayload {
  /** Entity type to sync */
  entityType: 'product' | 'category'
  /** Entity ID */
  entityId: string
  /** Operation: index or delete */
  operation: 'index' | 'delete'
}

export interface CleanupJobPayload {
  /** Sub-handler type */
  type: 'expired-carts' | 'expired-sessions' | 'old-notifications'
  /** Optional cutoff date (ISO string) */
  cutoffDate?: string
}

export interface FlashSaleSchedulerJobPayload {
  /** Timestamp when the job was enqueued */
  triggeredAt: string
}

export interface PaymentReconciliationJobPayload {
  /** Timestamp when the job was enqueued */
  triggeredAt: string
}

export interface RefundStatusPollJobPayload {
  /** Timestamp when the job was enqueued */
  triggeredAt: string
}
