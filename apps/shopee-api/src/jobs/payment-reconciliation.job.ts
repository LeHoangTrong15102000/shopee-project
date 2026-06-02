/**
 * PaymentReconciliationJob — registers a BullMQ repeatable job for payment reconciliation.
 *
 * @deprecated The reconciliation logic has been migrated to PaymentReconciliationWorker.
 * This class only manages repeatable job registration. Kept for backward compatibility
 * with container.ts and index.ts.
 */
import { Logger } from '@utils/logger'
import { paymentReconciliationQueue } from '../queues'
import {
  PaymentReconciliationWorker,
  ReconciliationSummary,
} from '../workers/payment-reconciliation.worker'

const DEFAULT_INTERVAL_HOURS = 24

export class PaymentReconciliationJob {
  private readonly intervalHours: number
  private readonly worker?: PaymentReconciliationWorker

  constructor(worker?: PaymentReconciliationWorker) {
    this.intervalHours = Number(process.env.RECONCILIATION_INTERVAL_HOURS) || DEFAULT_INTERVAL_HOURS
    this.worker = worker
  }

  /**
   * Register the BullMQ repeatable job.
   * Runs every RECONCILIATION_INTERVAL_HOURS hours (default 24h).
   */
  async start(): Promise<void> {
    const repeatEveryMs = this.intervalHours * 60 * 60 * 1000

    Logger.apiInfo('[PaymentReconciliationJob] Registering BullMQ repeatable job', {
      intervalHours: this.intervalHours,
    })

    await paymentReconciliationQueue.add(
      'payment-reconciliation',
      { triggeredAt: new Date().toISOString() },
      {
        repeat: { every: repeatEveryMs },
        jobId: 'payment-reconciliation-repeatable',
      },
    )

    Logger.apiInfo('[PaymentReconciliationJob] Repeatable job registered')
  }

  /**
   * Run a reconciliation pass immediately (on-demand).
   * Delegates to PaymentReconciliationWorker.runOnce() if a worker was provided.
   */
  async runOnce(): Promise<ReconciliationSummary> {
    if (!this.worker) {
      throw new Error(
        '[PaymentReconciliationJob] runOnce() requires a PaymentReconciliationWorker instance. ' +
          'Pass the worker to the constructor.',
      )
    }
    return this.worker.runOnce()
  }
}
