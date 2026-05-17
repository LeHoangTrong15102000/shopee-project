/**
 * PaymentReconciliationJob
 *
 * Runs on a configurable interval (default: every 24 hours).
 * Queries the database for PENDING payments created more than 30 minutes ago,
 * calls the appropriate provider's queryStatus(), and applies status transitions:
 *
 *   SUCCESS  → payment.status = SUCCESS, order.status = confirmed
 *   FAILED   → payment.status = FAILED,  order.status = payment_failed
 *   PENDING  → no change (skip)
 *
 * Emits a summary log at the end of each run.
 */

import { v4 as uuidv4 } from 'uuid'
import { PaymentModel, GATEWAY_PAYMENT_STATUS } from '@database/models/payment.model'
import { PAYMENT_STATUS } from '@database/models/order.model'
import { PaymentService } from '@services/payment.service'
import { PaymentProvider, PaymentStatus } from '@services/payment/payment.interface'
import { Logger } from '@utils/logger'
import { transitionOrderPaymentStatus } from '@services/order/order_state_machine'

const STALE_THRESHOLD_MINUTES = 30
const DEFAULT_INTERVAL_HOURS = 24

export interface ReconciliationSummary {
  confirmed: number
  failed: number
  still_pending: number
  total_checked: number
}

export class PaymentReconciliationJob {
  private readonly intervalMs: number

  constructor(private readonly paymentService: PaymentService) {
    const hours = Number(process.env.RECONCILIATION_INTERVAL_HOURS) || DEFAULT_INTERVAL_HOURS
    this.intervalMs = hours * 60 * 60 * 1000
  }

  /**
   * Start the recurring reconciliation job.
   * Calls runOnce() on the configured interval.
   */
  start(): void {
    Logger.apiInfo('[ReconciliationJob] Starting payment reconciliation job', {
      intervalHours: this.intervalMs / (60 * 60 * 1000),
    })
    setInterval(() => this.runOnce(), this.intervalMs)
  }

  /**
   * Run a single reconciliation pass.
   * Returns a summary of what was processed.
   */
  async runOnce(): Promise<ReconciliationSummary> {
    Logger.apiInfo('[ReconciliationJob] Starting reconciliation run')

    const summary: ReconciliationSummary = {
      confirmed: 0,
      failed: 0,
      still_pending: 0,
      total_checked: 0,
    }

    const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000)

    // Query PENDING payments older than 30 minutes
    const stalePendingPayments = await PaymentModel.find({
      status: GATEWAY_PAYMENT_STATUS.PENDING,
      createdAt: { $lt: staleThreshold },
    })
      .lean()
      .exec()

    summary.total_checked = stalePendingPayments.length

    if (stalePendingPayments.length === 0) {
      Logger.apiInfo('[ReconciliationJob] No stale PENDING payments found')
      this.logSummary(summary)
      return summary
    }

    Logger.apiInfo('[ReconciliationJob] Found stale PENDING payments', {
      count: stalePendingPayments.length,
    })

    for (const payment of stalePendingPayments) {
      const paymentId = payment._id.toString()
      // orderId string used only for logging; actual guard for order status transition uses payment.orderId (ObjectId)
      const orderId = payment.orderId?.toString() ?? ''
      const provider = payment.provider as PaymentProvider

      // Skip COD — no provider to query
      if (provider === PaymentProvider.COD) {
        summary.still_pending++
        continue
      }

      try {
        const providerInstance = this.paymentService.getProvider(provider)
        const requestId = uuidv4()

        const remoteStatus = await providerInstance.queryStatus({
          orderId,
          requestId,
          transactionId: payment.transactionId,
        })

        if (remoteStatus === PaymentStatus.SUCCESS) {
          await PaymentModel.findByIdAndUpdate(payment._id, {
            status: GATEWAY_PAYMENT_STATUS.SUCCESS,
          })

          // Skip order status transition for session-based payments (no orderId)
          if (payment.orderId) {
            await transitionOrderPaymentStatus(payment.orderId.toString(), 'PAYMENT_SUCCESS', {
              extraUpdate: {
                payment_status: PAYMENT_STATUS.PAID,
                confirmed_at: new Date(),
              },
            })
          }

          Logger.apiInfo('[ReconciliationJob] Payment transitioned to SUCCESS', {
            paymentId,
            orderId,
            provider,
            oldStatus: GATEWAY_PAYMENT_STATUS.PENDING,
            newStatus: GATEWAY_PAYMENT_STATUS.SUCCESS,
          })

          summary.confirmed++
        } else if (remoteStatus === PaymentStatus.FAILED) {
          await PaymentModel.findByIdAndUpdate(payment._id, {
            status: GATEWAY_PAYMENT_STATUS.FAILED,
          })

          // Skip order status transition for session-based payments (no orderId)
          if (payment.orderId) {
            await transitionOrderPaymentStatus(payment.orderId.toString(), 'PAYMENT_FAIL', {
              extraUpdate: {
                payment_status: PAYMENT_STATUS.FAILED,
              },
            })
          }

          Logger.apiInfo('[ReconciliationJob] Payment transitioned to FAILED', {
            paymentId,
            orderId,
            provider,
            oldStatus: GATEWAY_PAYMENT_STATUS.PENDING,
            newStatus: GATEWAY_PAYMENT_STATUS.FAILED,
          })

          summary.failed++
        } else {
          // Still PENDING at provider — skip
          summary.still_pending++
        }
      } catch (err: any) {
        Logger.apiError('[ReconciliationJob] Error querying provider status', {
          paymentId,
          orderId,
          provider,
          error: err?.message,
        })
        summary.still_pending++
      }
    }

    this.logSummary(summary)
    return summary
  }

  private logSummary(summary: ReconciliationSummary): void {
    Logger.apiInfo('[ReconciliationJob] Run complete', {
      confirmed: summary.confirmed,
      failed: summary.failed,
      still_pending: summary.still_pending,
      total_checked: summary.total_checked,
    })
  }
}
