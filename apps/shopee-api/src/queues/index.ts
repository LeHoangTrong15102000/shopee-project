import { createQueue } from './queue.factory'
import {
  EMAIL_QUEUE,
  NOTIFICATION_QUEUE,
  SEARCH_SYNC_QUEUE,
  CLEANUP_QUEUE,
  FLASH_SALE_SCHEDULER_QUEUE,
  PAYMENT_RECONCILIATION_QUEUE,
  REFUND_STATUS_POLL_QUEUE,
  FEED_FAN_OUT_QUEUE,
} from './queue.config'

export const emailQueue = createQueue(EMAIL_QUEUE)
export const notificationQueue = createQueue(NOTIFICATION_QUEUE)
export const searchSyncQueue = createQueue(SEARCH_SYNC_QUEUE)
export const cleanupQueue = createQueue(CLEANUP_QUEUE)
export const flashSaleSchedulerQueue = createQueue(FLASH_SALE_SCHEDULER_QUEUE)
export const paymentReconciliationQueue = createQueue(PAYMENT_RECONCILIATION_QUEUE)
export const refundStatusPollQueue = createQueue(REFUND_STATUS_POLL_QUEUE)
export const feedFanOutQueue = createQueue(FEED_FAN_OUT_QUEUE)
