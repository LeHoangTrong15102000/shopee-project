/**
 * PaymentReconciliationWorker — processes jobs from the `payment-reconciliation` queue.
 *
 * Migrates the logic from PaymentReconciliationJob into a BullMQ repeatable job.
 */
import { Worker, Job } from 'bullmq'
import { Logger } from '@utils/logger'
import { PAYMENT_RECONCILIATION_QUEUE } from '../queues/queue.config'
import { PaymentReconciliationJobPayload } from '../queues/job-payloads'
import { getWorkerConnection } from './worker.connection'
import { PaymentService } from '@services/payment.service'
import { v4 as uuidv4 } from 'uuid'
import { PaymentModel, GATEWAY_PAYMENT_STATUS } from '@database/models/payment.model'
import { PAYMENT_STATUS } from '@database/models/order.model'
import { PaymentProvider, PaymentStatus } from '@services/payment/payment.interface'
import { transitionOrderPaymentStatus } from '@services/order/order_state_machine'

const STALE_THRESHOLD_MINUTES = 30

export interface ReconciliationSummary {
  confirmed: number
  failed: number
  still_pending: number
  total_checked: number
}

export class PaymentReconciliationWorker {
  readonly worker: Worker

  constructor(private readonly paymentService: PaymentService) {
    this.worker = new Worker<PaymentReconciliationJobPayload>(
      PAYMENT_RECONCILIATION_QUEUE,
      async (job: Job<PaymentReconciliationJobPayload>) => {
        Logger.apiInfo('[PaymentReconciliationWorker] Starting reconciliation run', {
          jobId: job.id,
          triggeredAt: job.data.triggeredAt,
        })
        await this.runOnce()
      },
      { connection: getWorkerConnection() },
    )

    this.worker.on('error', (err) => {
      Logger.apiError('[PaymentReconciliationWorker] Worker error', { message: err.message })
    })

    this.worker.on('failed', (job, err) => {
      Logger.apiError('[PaymentReconciliationWorker] Job failed', {
        jobId: job?.id,
        error: err.message,
      })
    })
  }

  async runOnce(): Promise<ReconciliationSummary> {
    const summary: ReconciliationSummary = {
      confirmed: 0,
      failed: 0,
      still_pending: 0,
      total_checked: 0,
    }

    const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000)

    const stalePendingPayments = await PaymentModel.find({
      status: GATEWAY_PAYMENT_STATUS.PENDING,
      createdAt: { $lt: staleThreshold },
    })
      .lean()
      .exec()

    summary.total_checked = stalePendingPayments.length

    if (stalePendingPayments.length === 0) {
      Logger.apiInfo('[PaymentReconciliationWorker] No stale PENDING payments found')
      this.logSummary(summary)
      return summary
    }

    Logger.apiInfo('[PaymentReconciliationWorker] Found stale PENDING payments', {
      count: stalePendingPayments.length,
    })

    for (const payment of stalePendingPayments) {
      const paymentId = payment._id.toString()
      const orderId = payment.orderId?.toString() ?? ''
      const provider = payment.provider as PaymentProvider

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

          if (payment.orderId) {
            await transitionOrderPaymentStatus(payment.orderId.toString(), 'PAYMENT_SUCCESS', {
              extraUpdate: {
                payment_status: PAYMENT_STATUS.PAID,
                confirmed_at: new Date(),
              },
            })
          }

          Logger.apiInfo('[PaymentReconciliationWorker] Payment transitioned to SUCCESS', {
            paymentId,
            orderId,
            provider,
          })

          summary.confirmed++
        } else if (remoteStatus === PaymentStatus.FAILED) {
          await PaymentModel.findByIdAndUpdate(payment._id, {
            status: GATEWAY_PAYMENT_STATUS.FAILED,
          })

          if (payment.orderId) {
            await transitionOrderPaymentStatus(payment.orderId.toString(), 'PAYMENT_FAIL', {
              extraUpdate: {
                payment_status: PAYMENT_STATUS.FAILED,
              },
            })
          }

          Logger.apiInfo('[PaymentReconciliationWorker] Payment transitioned to FAILED', {
            paymentId,
            orderId,
            provider,
          })

          summary.failed++
        } else {
          summary.still_pending++
        }
      } catch (err: any) {
        Logger.apiError('[PaymentReconciliationWorker] Error querying provider status', {
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
    Logger.apiInfo('[PaymentReconciliationWorker] Run complete', {
      confirmed: summary.confirmed,
      failed: summary.failed,
      still_pending: summary.still_pending,
      total_checked: summary.total_checked,
    })
  }
}
