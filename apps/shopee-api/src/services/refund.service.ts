import { Types } from 'mongoose'
import {
  BaseService,
  NotFoundError,
  BusinessError,
  ConflictError,
  ForbiddenError,
} from './base.service'
import {
  IRefundRepository,
  RefundFilterOptions,
} from '@repositories/interfaces/refund.repository.interface'
import { IOrderRepository } from '@repositories/interfaces/order.repository.interface'
import { NotificationService } from './notification.service'
import { StripeService } from './stripe.service'
import { PaymentService } from './payment.service'
import { PaymentProvider } from './payment/payment.interface'
import { IRefund, REFUND_STATUS, RefundStatusType } from '@database/models/refund.model'
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, IOrder } from '@database/models/order.model'
import { config } from '@constants/config'
import {
  PaginatedResult,
  PaginationOptions,
} from '@repositories/interfaces/base.repository.interface'
import { Logger } from '@utils/logger'

export interface RefundStats {
  [status: string]: number
}

export class RefundService extends BaseService {
  constructor(
    private readonly refundRepository: IRefundRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly notificationService: NotificationService,
    private readonly stripeService: StripeService,
    private readonly paymentService: PaymentService,
  ) {
    super()
  }

  /**
   * Submit a refund request for a delivered/returned order.
   */
  async createRefundRequest(
    orderId: string,
    userId: string,
    data: {
      reason: string
      reason_detail: string
      evidence: string[]
      requested_amount: number
    },
  ): Promise<IRefund> {
    // Validate order exists and belongs to user
    const order = await this.orderRepository.findByIdAndUser(orderId, userId)
    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    // Validate order status is DELIVERED or RETURNED
    if (order.status !== ORDER_STATUS.DELIVERED && order.status !== ORDER_STATUS.RETURNED) {
      throw new BusinessError('Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đã giao hoặc đã trả hàng')
    }

    // Validate within refund deadline
    if (order.delivered_at) {
      const deadlineDays = config.REFUND_REQUEST_DEADLINE_DAYS
      const deadlineDate = new Date(order.delivered_at)
      deadlineDate.setDate(deadlineDate.getDate() + deadlineDays)
      if (new Date() > deadlineDate) {
        throw new BusinessError(
          `Đã quá thời hạn yêu cầu hoàn tiền (${deadlineDays} ngày kể từ ngày giao hàng)`,
        )
      }
    }

    // Check no existing refund for this order
    const existingRefund = await this.refundRepository.findByOrderId(orderId)
    if (existingRefund) {
      throw new ConflictError('Đơn hàng này đã có yêu cầu hoàn tiền')
    }

    // Create refund with PENDING status, capturing current order status for revert
    const refund = await this.refundRepository.create({
      order_id: new Types.ObjectId(orderId),
      user_id: new Types.ObjectId(userId),
      reason: data.reason,
      reason_detail: data.reason_detail,
      evidence: data.evidence,
      requested_amount: data.requested_amount,
      status: REFUND_STATUS.PENDING,
      previous_order_status: order.status,
    })

    // Update order status to REFUND_REQUESTED
    await this.orderRepository.updateStatus(orderId, ORDER_STATUS.REFUND_REQUESTED)

    return refund
  }

  /**
   * Get refund status for a specific order (user-facing).
   */
  async getRefundStatus(orderId: string, userId: string): Promise<IRefund> {
    const refund = await this.refundRepository.findByOrderId(orderId)
    if (!refund) {
      throw new NotFoundError('Refund request for order', orderId)
    }

    // Verify user ownership
    if (refund.user_id.toString() !== userId) {
      throw new ForbiddenError('Bạn không có quyền xem yêu cầu hoàn tiền này')
    }

    return refund
  }

  /**
   * List all refunds for a user with pagination.
   */
  async listUserRefunds(
    userId: string,
    pagination: Partial<PaginationOptions>,
  ): Promise<PaginatedResult<IRefund>> {
    return this.refundRepository.findByUserId(userId, this.normalizePagination(pagination))
  }

  /**
   * Cancel a pending refund request (user action).
   */
  async cancelRefund(orderId: string, userId: string): Promise<IRefund> {
    const refund = await this.refundRepository.findByOrderId(orderId)
    if (!refund) {
      throw new NotFoundError('Refund request for order', orderId)
    }

    // Verify user ownership
    if (refund.user_id.toString() !== userId) {
      throw new ForbiddenError('Bạn không có quyền hủy yêu cầu hoàn tiền này')
    }

    // Only PENDING refunds can be cancelled
    if (refund.status !== REFUND_STATUS.PENDING) {
      throw new BusinessError('Chỉ có thể hủy yêu cầu hoàn tiền đang chờ xử lý')
    }

    // Update refund status to CANCELLED
    const updated = await this.refundRepository.updateById(refund._id, {
      status: REFUND_STATUS.CANCELLED,
    })

    // Revert order status to previous state
    await this.orderRepository.updateStatus(orderId, refund.previous_order_status)

    return updated!
  }

  /**
   * Approve a refund request (admin action).
   * Validates amount, determines refund_method, and triggers gateway refund for auto methods.
   */
  async approveRefund(
    refundId: string,
    adminId: string,
    approvedAmount: number,
    notes?: string,
  ): Promise<IRefund> {
    const refund = await this.refundRepository.findById(refundId)
    if (!refund) {
      throw new NotFoundError('Refund', refundId)
    }

    if (refund.status !== REFUND_STATUS.PENDING) {
      throw new BusinessError('Chỉ có thể duyệt yêu cầu hoàn tiền đang chờ xử lý')
    }

    // Fetch order to validate amount and payment_method
    const order = await this.orderRepository.findById(refund.order_id.toString())
    if (!order) {
      throw new NotFoundError('Order', refund.order_id.toString())
    }

    // Validate order payment_status is 'paid'
    if (order.payment_status !== PAYMENT_STATUS.PAID) {
      throw new BusinessError('Chỉ có thể hoàn tiền cho đơn hàng đã thanh toán')
    }

    // Validate approved amount does not exceed order total
    if (approvedAmount > order.total) {
      throw new BusinessError(
        `Số tiền hoàn (${approvedAmount}) không thể lớn hơn tổng đơn hàng (${order.total})`,
      )
    }

    const refundMethod = this.determineRefundMethod(order.payment_method)

    const updated = await this.refundRepository.updateById(refundId, {
      status: REFUND_STATUS.APPROVED,
      admin_id: new Types.ObjectId(adminId),
      approved_amount: approvedAmount,
      admin_notes: notes,
      processed_at: new Date(),
      refund_method: refundMethod,
    })

    // Update order status to REFUND_APPROVED
    await this.orderRepository.updateStatus(
      refund.order_id.toString(),
      ORDER_STATUS.REFUND_APPROVED,
    )

    // Notify user
    this.notificationService
      .createNotification(
        refund.user_id.toString(),
        'Yêu cầu hoàn tiền đã được chấp thuận',
        `Yêu cầu hoàn tiền của bạn đã được duyệt. Số tiền hoàn: ${approvedAmount.toLocaleString('vi-VN')} VNĐ`,
        'order',
      )
      .catch(() => {
        // fire-and-forget — don't block response on notification failure
      })

    // For auto-refundable methods, trigger gateway refund asynchronously
    if (refundMethod === 'auto') {
      setImmediate(() => {
        this.processGatewayRefund(updated!, order).catch((_err) => {
          // fire-and-forget — errors are logged inside processGatewayRefund
        })
      })
    }

    return updated!
  }

  /**
   * Reject a refund request (admin action).
   */
  async rejectRefund(refundId: string, adminId: string, rejectionReason: string): Promise<IRefund> {
    const refund = await this.refundRepository.findById(refundId)
    if (!refund) {
      throw new NotFoundError('Refund', refundId)
    }

    if (refund.status !== REFUND_STATUS.PENDING) {
      throw new BusinessError('Chỉ có thể từ chối yêu cầu hoàn tiền đang chờ xử lý')
    }

    const updated = await this.refundRepository.updateById(refundId, {
      status: REFUND_STATUS.REJECTED,
      admin_id: new Types.ObjectId(adminId),
      rejection_reason: rejectionReason,
      processed_at: new Date(),
    })

    // Revert order status to previous state
    await this.orderRepository.updateStatus(
      refund.order_id.toString(),
      refund.previous_order_status,
    )

    // Notify user
    this.notificationService
      .createNotification(
        refund.user_id.toString(),
        'Yêu cầu hoàn tiền bị từ chối',
        `Yêu cầu hoàn tiền của bạn đã bị từ chối. Lý do: ${rejectionReason}`,
        'order',
      )
      .catch(() => {
        // fire-and-forget
      })

    return updated!
  }

  /**
   * Mark a refund as completed (admin action — after actual money transfer).
   * Also updates order payment_status to 'refunded'.
   */
  async completeRefund(refundId: string): Promise<IRefund> {
    const refund = await this.refundRepository.findById(refundId)
    if (!refund) {
      throw new NotFoundError('Refund', refundId)
    }

    if (refund.status !== REFUND_STATUS.APPROVED && refund.status !== REFUND_STATUS.PROCESSING) {
      throw new BusinessError(
        'Chỉ có thể hoàn thành yêu cầu hoàn tiền đã được duyệt hoặc đang xử lý',
      )
    }

    const updated = await this.refundRepository.updateById(refundId, {
      status: REFUND_STATUS.COMPLETED,
      completed_at: new Date(),
    })

    // Update order status to REFUND_COMPLETED
    await this.orderRepository.updateStatus(
      refund.order_id.toString(),
      ORDER_STATUS.REFUND_COMPLETED,
    )

    // Update order payment_status to 'refunded' via repository
    await this.orderRepository.updatePaymentStatus(
      refund.order_id.toString(),
      PAYMENT_STATUS.REFUNDED,
    )

    // Notify user
    this.notificationService
      .createNotification(
        refund.user_id.toString(),
        'Hoàn tiền đã được xử lý',
        'Yêu cầu hoàn tiền của bạn đã được xử lý thành công. Tiền đã được hoàn về tài khoản của bạn.',
        'order',
      )
      .catch(() => {
        // fire-and-forget
      })

    return updated!
  }

  /**
   * Retry a failed gateway refund (admin action).
   * Only APPROVED auto-refunds can be retried.
   */
  async retryGatewayRefund(refundId: string): Promise<IRefund> {
    const refund = await this.refundRepository.findById(refundId)
    if (!refund) throw new NotFoundError('Refund', refundId)

    if (refund.status !== REFUND_STATUS.APPROVED) {
      throw new BusinessError('Only APPROVED refunds can be retried')
    }

    if (refund.refund_method !== 'auto') {
      throw new BusinessError('Manual refunds cannot be retried via gateway')
    }

    const order = await this.orderRepository.findById(refund.order_id.toString())
    if (!order) throw new NotFoundError('Order', refund.order_id.toString())

    await this.processGatewayRefund(refund, order)
    return (await this.refundRepository.findById(refundId))!
  }

  /**
   * List refunds with optional filters (admin view).
   */
  async listRefunds(
    filters: RefundFilterOptions,
    pagination: Partial<PaginationOptions>,
  ): Promise<PaginatedResult<IRefund>> {
    return this.refundRepository.findWithFilters(filters, this.normalizePagination(pagination))
  }

  /**
   * Get refund by ID (admin view).
   */
  async getRefundById(refundId: string): Promise<IRefund> {
    const refund = await this.refundRepository.findByIdPopulated(refundId)
    if (!refund) {
      throw new NotFoundError('Refund', refundId)
    }
    return refund
  }

  /**
   * Get count of refunds grouped by status (admin stats).
   */
  async getRefundStats(): Promise<RefundStats> {
    const statuses = Object.values(REFUND_STATUS) as RefundStatusType[]
    const counts = await Promise.all(
      statuses.map((status) => this.refundRepository.count({ status })),
    )

    const stats: RefundStats = {}
    statuses.forEach((status, index) => {
      stats[status] = counts[index]
    })

    return stats
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Determine whether a payment method supports automatic gateway refund.
   */
  private determineRefundMethod(paymentMethod: string): 'auto' | 'manual' {
    switch (paymentMethod) {
      case PAYMENT_METHOD.CREDIT_CARD:
      case PAYMENT_METHOD.MOMO:
        return 'auto'
      default:
        return 'manual'
    }
  }

  /**
   * Execute the actual money refund via payment gateway.
   * Called after admin approves a refund for auto-refundable payment methods.
   * On success: sets status = PROCESSING and stores gateway_refund_id.
   * On failure: keeps status = APPROVED, stores failure_reason, increments retry_count.
   */
  private async processGatewayRefund(refund: IRefund, order: IOrder): Promise<void> {
    // Idempotency guard — skip if gateway call was already made
    if (refund.gateway_refund_id) {
      Logger.apiWarn('[RefundService] Refund already has gateway_refund_id — skipping', {
        refundId: refund._id.toString(),
      })
      return
    }

    const idempotencyKey = `refund-${order._id}-${refund._id}`

    try {
      if (order.payment_method === PAYMENT_METHOD.CREDIT_CARD) {
        // Stripe refund path
        if (!order.stripe_payment_intent_id) {
          throw new BusinessError('Order has no Stripe PaymentIntent — cannot auto-refund')
        }

        const result = await this.stripeService.createRefund(
          order.stripe_payment_intent_id,
          refund.approved_amount!,
          {
            orderId: order._id.toString(),
            refundId: refund._id.toString(),
            idempotencyKey,
          },
        )

        await this.refundRepository.updateById(refund._id, {
          status: REFUND_STATUS.PROCESSING,
          gateway_refund_id: result.refundId,
        })

        Logger.apiInfo('[RefundService] Stripe refund initiated', {
          refundId: refund._id.toString(),
          orderId: order._id.toString(),
          stripeRefundId: result.refundId,
          status: result.status,
        })
      } else if (order.payment_method === PAYMENT_METHOD.MOMO) {
        // MoMo refund path — need original transactionId from Payment record
        const payment = await this.getPaymentTransactionId(order)
        const momoProvider = this.paymentService.getProvider(PaymentProvider.MOMO)

        if (!momoProvider?.refund) {
          throw new BusinessError('MoMo refund not available')
        }

        const result = await momoProvider.refund({
          transactionId: payment.transactionId,
          amount: refund.approved_amount!,
          orderId: idempotencyKey,
          requestId: idempotencyKey,
          description: `Refund for order ${order._id}`,
        })

        if (result.success) {
          await this.refundRepository.updateById(refund._id, {
            status: REFUND_STATUS.PROCESSING,
            gateway_refund_id: result.transactionId || idempotencyKey,
          })

          Logger.apiInfo('[RefundService] MoMo refund initiated', {
            refundId: refund._id.toString(),
            orderId: order._id.toString(),
            momoTransId: result.transactionId,
          })
        } else {
          throw new Error(`MoMo refund failed: ${result.message}`)
        }
      }
    } catch (error: any) {
      // Gateway call failed — keep APPROVED so admin can retry
      await this.refundRepository.updateById(refund._id, {
        failure_reason: error.message,
        retry_count: (refund.retry_count || 0) + 1,
      })

      Logger.apiError('[RefundService] Gateway refund failed', {
        refundId: refund._id.toString(),
        orderId: order._id.toString(),
        error: error.message,
      })
      // Do not re-throw — refund stays APPROVED for manual retry
    }
  }

  /**
   * Look up the provider transaction ID for an order's payment record.
   * Used to get the MoMo transId needed for refund requests.
   */
  private async getPaymentTransactionId(order: IOrder): Promise<{ transactionId: string }> {
    const { PaymentModel } = await import('@database/models/payment.model')

    // Try payment_id first (direct order-based payment)
    if (order.payment_id) {
      const payment = await PaymentModel.findById(order.payment_id).lean()
      if (payment?.transactionId) {
        return { transactionId: payment.transactionId }
      }
    }

    // Fall back to payment_session_id (session-based e-wallet payment)
    if (order.payment_session_id) {
      const payment = await PaymentModel.findOne({
        sessionId: order.payment_session_id,
      }).lean()
      if (payment?.transactionId) {
        return { transactionId: payment.transactionId }
      }
    }

    throw new BusinessError(
      `No payment transaction found for order ${order._id} — cannot process MoMo refund`,
    )
  }
}
