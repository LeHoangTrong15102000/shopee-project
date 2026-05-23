/**
 * RefundStatusPollWorker — processes jobs from the `refund-status-poll` queue.
 *
 * Migrates the logic from RefundStatusPollJob into a BullMQ repeatable job.
 */
import { Worker, Job } from 'bullmq'
import { Logger } from '@utils/logger'
import { REFUND_STATUS_POLL_QUEUE } from '../queues/queue.config'
import { RefundStatusPollJobPayload } from '../queues/job-payloads'
import { getWorkerConnection } from './worker.connection'
import { IRefundRepository } from '@repositories/interfaces/refund.repository.interface'
import { IOrderRepository } from '@repositories/interfaces/order.repository.interface'
import { PaymentService } from '@services/payment.service'
import { RefundService } from '@services/refund.service'
import { PaymentProvider } from '@services/payment/payment.interface'
import { IRefund, REFUND_STATUS } from '@database/models/refund.model'

export class RefundStatusPollWorker {
  readonly worker: Worker

  constructor(
    private readonly refundRepository: IRefundRepository,
    private readonly paymentService: PaymentService,
    private readonly refundService: RefundService,
    private readonly orderRepository: IOrderRepository,
  ) {
    this.worker = new Worker<RefundStatusPollJobPayload>(
      REFUND_STATUS_POLL_QUEUE,
      async (job: Job<RefundStatusPollJobPayload>) => {
        Logger.apiInfo('[RefundStatusPollWorker] Running MoMo refund status poll', {
          jobId: job.id,
          triggeredAt: job.data.triggeredAt,
        })
        await this.execute()
      },
      { connection: getWorkerConnection() },
    )

    this.worker.on('error', (err) => {
      Logger.apiError('[RefundStatusPollWorker] Worker error', { message: err.message })
    })

    this.worker.on('failed', (job, err) => {
      Logger.apiError('[RefundStatusPollWorker] Job failed', {
        jobId: job?.id,
        error: err.message,
      })
    })
  }

  async execute(): Promise<void> {
    let processingRefunds: IRefund[]
    try {
      processingRefunds = await this.refundRepository.findProcessingByProvider('momo')
    } catch (err: any) {
      Logger.apiError('[RefundStatusPollWorker] Failed to fetch processing refunds', {
        error: err?.message,
      })
      return
    }

    if (processingRefunds.length === 0) {
      Logger.apiInfo('[RefundStatusPollWorker] No PROCESSING momo refunds found')
      return
    }

    Logger.apiInfo('[RefundStatusPollWorker] Found PROCESSING momo refunds', {
      count: processingRefunds.length,
    })

    for (const refund of processingRefunds) {
      await this.checkMomoRefundStatus(refund)
    }
  }

  private async checkMomoRefundStatus(refund: IRefund): Promise<void> {
    const momoProvider = this.paymentService.getProvider(PaymentProvider.MOMO)

    if (!momoProvider?.queryRefundStatus) {
      Logger.apiWarn('[RefundStatusPollWorker] MoMo provider does not support queryRefundStatus')
      return
    }

    const idempotencyKey = `refund-${refund.order_id}-${refund._id}`

    try {
      const result = await momoProvider.queryRefundStatus({
        orderId: idempotencyKey,
        requestId: idempotencyKey,
      })

      if (result.success) {
        await this.refundService.completeRefund(refund._id.toString())

        Logger.apiInfo('[RefundStatusPollWorker] MoMo refund auto-completed', {
          refundId: refund._id.toString(),
          orderId: refund.order_id.toString(),
        })
      } else if (result.resultCode !== 'PENDING') {
        await this.refundRepository.updateById(refund._id, {
          status: REFUND_STATUS.APPROVED,
          failure_reason: result.message,
        })

        Logger.apiWarn('[RefundStatusPollWorker] MoMo refund failed — reverted to APPROVED', {
          refundId: refund._id.toString(),
          orderId: refund.order_id.toString(),
          resultCode: result.resultCode,
          message: result.message,
        })
      }
    } catch (err: any) {
      Logger.apiError('[RefundStatusPollWorker] Error checking MoMo refund status', {
        refundId: refund._id.toString(),
        error: err?.message,
      })
    }
  }
}
