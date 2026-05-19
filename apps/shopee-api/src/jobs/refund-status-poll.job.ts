/**
 * RefundStatusPollJob
 *
 * Polls MoMo for refund status updates every MOMO_REFUND_POLL_INTERVAL_MS (default 5 minutes).
 * Finds all refunds with status=PROCESSING and payment_method=momo,
 * queries MoMo /v2/gateway/api/refund/query, and:
 *
 *   success  → auto-complete the refund, set order.payment_status = 'refunded'
 *   failed   → revert to APPROVED so admin can retry
 *   pending  → no change (will check again next poll)
 */

import { IRefundRepository } from '@repositories/interfaces/refund.repository.interface'
import { IOrderRepository } from '@repositories/interfaces/order.repository.interface'
import { PaymentService } from '@services/payment.service'
import { RefundService } from '@services/refund.service'
import { PaymentProvider } from '@services/payment/payment.interface'
import { IRefund, REFUND_STATUS } from '@database/models/refund.model'
import { Logger } from '@utils/logger'

const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export class RefundStatusPollJob {
  private readonly intervalMs: number

  constructor(
    private readonly refundRepository: IRefundRepository,
    private readonly paymentService: PaymentService,
    private readonly refundService: RefundService,
    private readonly orderRepository: IOrderRepository,
  ) {
    this.intervalMs = Number(process.env.MOMO_REFUND_POLL_INTERVAL_MS) || DEFAULT_POLL_INTERVAL_MS
  }

  /**
   * Start the recurring polling job.
   */
  start(): void {
    Logger.apiInfo('[RefundPollJob] Starting MoMo refund status polling job', {
      intervalMs: this.intervalMs,
    })
    setInterval(() => this.execute(), this.intervalMs)
  }

  /**
   * Run a single polling pass.
   * Finds all PROCESSING momo refunds and checks their status with MoMo.
   */
  async execute(): Promise<void> {
    Logger.apiInfo('[RefundPollJob] Running MoMo refund status poll')

    let processingRefunds: IRefund[]
    try {
      processingRefunds = await this.refundRepository.findProcessingByProvider('momo')
    } catch (err: any) {
      Logger.apiError('[RefundPollJob] Failed to fetch processing refunds', {
        error: err?.message,
      })
      return
    }

    if (processingRefunds.length === 0) {
      Logger.apiInfo('[RefundPollJob] No PROCESSING momo refunds found')
      return
    }

    Logger.apiInfo('[RefundPollJob] Found PROCESSING momo refunds', {
      count: processingRefunds.length,
    })

    for (const refund of processingRefunds) {
      await this.checkMomoRefundStatus(refund)
    }
  }

  private async checkMomoRefundStatus(refund: IRefund): Promise<void> {
    const momoProvider = this.paymentService.getProvider(PaymentProvider.MOMO)

    if (!momoProvider?.queryRefundStatus) {
      Logger.apiWarn('[RefundPollJob] MoMo provider does not support queryRefundStatus')
      return
    }

    const idempotencyKey = `refund-${refund.order_id}-${refund._id}`

    try {
      const result = await momoProvider.queryRefundStatus({
        orderId: idempotencyKey,
        requestId: idempotencyKey,
      })

      if (result.success) {
        // Refund succeeded — auto-complete.
        // completeRefund() handles the payment_status update (sets it to 'refunded').
        await this.refundService.completeRefund(refund._id.toString())

        Logger.apiInfo('[RefundPollJob] MoMo refund auto-completed', {
          refundId: refund._id.toString(),
          orderId: refund.order_id.toString(),
        })
      } else if (result.resultCode !== 'PENDING') {
        // Definitive failure — revert to APPROVED so admin can retry
        await this.refundRepository.updateById(refund._id, {
          status: REFUND_STATUS.APPROVED,
          failure_reason: result.message,
        })

        Logger.apiWarn('[RefundPollJob] MoMo refund failed — reverted to APPROVED', {
          refundId: refund._id.toString(),
          orderId: refund.order_id.toString(),
          resultCode: result.resultCode,
          message: result.message,
        })
      }
      // If resultCode === 'PENDING', do nothing — will check again next poll
    } catch (err: any) {
      Logger.apiError('[RefundPollJob] Error checking MoMo refund status', {
        refundId: refund._id.toString(),
        error: err?.message,
      })
    }
  }
}
