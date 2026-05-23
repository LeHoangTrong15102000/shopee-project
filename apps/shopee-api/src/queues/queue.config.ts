/**
 * BullMQ queue name constants and shared default job options.
 */
import { DefaultJobOptions } from 'bullmq'

// Queue name constants
export const EMAIL_QUEUE = 'email'
export const NOTIFICATION_QUEUE = 'notification'
export const SEARCH_SYNC_QUEUE = 'search-sync'
export const CLEANUP_QUEUE = 'cleanup'
export const FLASH_SALE_SCHEDULER_QUEUE = 'flash-sale-scheduler'
export const PAYMENT_RECONCILIATION_QUEUE = 'payment-reconciliation'
export const REFUND_STATUS_POLL_QUEUE = 'refund-status-poll'

/**
 * Shared default job options applied to all queues.
 * - 3 attempts with exponential backoff
 * - Keep last 100 completed jobs and 500 failed jobs for visibility
 */
export const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
}
