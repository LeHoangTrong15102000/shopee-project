/**
 * RefundStatusPollJob — registers a BullMQ repeatable job for MoMo refund status polling.
 *
 * @deprecated The polling logic has been migrated to RefundStatusPollWorker.
 * This class only manages repeatable job registration. Kept for backward compatibility
 * with container.ts and index.ts.
 */
import { Logger } from '@utils/logger'
import { refundStatusPollQueue } from '../queues'

const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export class RefundStatusPollJob {
  private readonly intervalMs: number

  constructor() {
    this.intervalMs = Number(process.env.MOMO_REFUND_POLL_INTERVAL_MS) || DEFAULT_POLL_INTERVAL_MS
  }

  /**
   * Register the BullMQ repeatable job.
   * Runs every MOMO_REFUND_POLL_INTERVAL_MS milliseconds (default 5 minutes).
   */
  async start(): Promise<void> {
    Logger.apiInfo('[RefundStatusPollJob] Registering BullMQ repeatable job', {
      intervalMs: this.intervalMs,
    })

    await refundStatusPollQueue.add(
      'refund-status-poll',
      { triggeredAt: new Date().toISOString() },
      {
        repeat: { every: this.intervalMs },
        jobId: 'refund-status-poll-repeatable',
      },
    )

    Logger.apiInfo('[RefundStatusPollJob] Repeatable job registered')
  }
}
