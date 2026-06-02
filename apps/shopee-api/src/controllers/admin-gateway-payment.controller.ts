import { Request, Response } from 'express'
import { paymentService, paymentRepository, paymentReconciliationJob } from '../container'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { GatewayPaymentStatusType } from '@database/models/payment.model'
import { PaymentProvider } from '@services/payment/payment.interface'
import { Logger } from '@utils/logger'
import { v4 as uuidv4 } from 'uuid'
import { transitionOrderPaymentStatus } from '@services/order/order_state_machine'

/**
 * GET /admin/payments
 * List payments with filters: status, provider, date range, orderId
 */
export const adminListPayments = async (req: Request, res: Response) => {
  const { status, provider, orderId, startDate, endDate, page = '1', limit = '20' } = req.query

  const filters: Record<string, unknown> = {
    page: Number(page),
    limit: Number(limit),
  }

  if (status) filters.status = status as GatewayPaymentStatusType
  if (provider) filters.provider = provider as string
  if (orderId) filters.orderId = orderId as string
  if (startDate) filters.startDate = new Date(startDate as string)
  if (endDate) filters.endDate = new Date(endDate as string)

  const result = await paymentRepository.findWithFilters(filters as any)

  return responseSuccess(res, {
    message: 'Lấy danh sách thanh toán thành công',
    data: {
      payments: result.data,
      total: result.total,
      page: Number(page),
      limit: Number(limit),
    },
  })
}

/**
 * POST /admin/payments/:id/reconcile
 * Query provider API and update local payment status.
 */
export const adminReconcilePayment = async (req: Request, res: Response) => {
  const id = req.params.id as string

  const payment = await paymentRepository.findById(id)
  if (!payment) {
    throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy bản ghi thanh toán')
  }

  if (payment.provider === PaymentProvider.COD) {
    throw new ErrorHandler(STATUS.BAD_REQUEST, 'COD payments do not require reconciliation')
  }

  Logger.apiInfo('[Admin] Reconciling payment', {
    paymentId: id,
    provider: payment.provider,
    orderId: payment.orderId?.toString(),
  })

  const requestId = uuidv4()
  const provider = payment.provider as PaymentProvider
  const providerInstance = paymentService.getProvider(provider)

  const remoteStatus = await providerInstance.queryStatus({
    orderId: payment.orderId?.toString() ?? '',
    requestId,
    transactionId: payment.transactionId,
  })

  const { GATEWAY_PAYMENT_STATUS } = await import('@database/models/payment.model')
  const { PAYMENT_STATUS } = await import('@database/models/order.model')

  let newStatus: GatewayPaymentStatusType
  switch (remoteStatus) {
    case 'SUCCESS':
      newStatus = GATEWAY_PAYMENT_STATUS.SUCCESS
      break
    case 'FAILED':
      newStatus = GATEWAY_PAYMENT_STATUS.FAILED
      break
    case 'REFUNDED':
      newStatus = GATEWAY_PAYMENT_STATUS.REFUNDED
      break
    default:
      newStatus = GATEWAY_PAYMENT_STATUS.PENDING
  }

  const updated = await paymentRepository.updateById(id, { status: newStatus })

  // Sync order status if payment resolved
  if (newStatus === GATEWAY_PAYMENT_STATUS.SUCCESS) {
    await transitionOrderPaymentStatus(payment.orderId?.toString(), 'PAYMENT_SUCCESS', {
      extraUpdate: {
        payment_status: PAYMENT_STATUS.PAID,
        confirmed_at: new Date(),
      },
    })
  } else if (newStatus === GATEWAY_PAYMENT_STATUS.FAILED) {
    await transitionOrderPaymentStatus(payment.orderId?.toString(), 'PAYMENT_FAIL', {
      extraUpdate: {
        payment_status: PAYMENT_STATUS.FAILED,
      },
    })
  }

  Logger.apiInfo('[Admin] Payment reconciled', {
    paymentId: id,
    oldStatus: payment.status,
    newStatus,
  })

  return responseSuccess(res, {
    message: 'Đối soát thanh toán thành công',
    data: updated,
  })
}

/**
 * POST /admin/payments/:id/manual-confirm
 * Admin override: manually confirm a payment with a reason (audit log).
 */
export const adminManualConfirmPayment = async (req: Request, res: Response) => {
  const id = req.params.id as string
  const { reason } = req.body

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    throw new ErrorHandler(STATUS.BAD_REQUEST, 'Reason is required for manual confirmation')
  }

  const payment = await paymentRepository.findById(id)
  if (!payment) {
    throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy bản ghi thanh toán')
  }

  const { GATEWAY_PAYMENT_STATUS } = await import('@database/models/payment.model')
  const { PAYMENT_STATUS } = await import('@database/models/order.model')

  if (payment.status === GATEWAY_PAYMENT_STATUS.SUCCESS) {
    throw new ErrorHandler(STATUS.BAD_REQUEST, 'Payment is already confirmed')
  }

  const adminId = req.jwtDecoded?.id || 'unknown'

  Logger.apiInfo('[Admin] Manual payment confirmation', {
    paymentId: id,
    adminId,
    reason,
    orderId: payment.orderId?.toString(),
  })

  const updated = await paymentRepository.updateById(id, {
    status: GATEWAY_PAYMENT_STATUS.SUCCESS,
    ipnPayload: {
      ...(payment.ipnPayload || {}),
      manual_confirm: {
        adminId,
        reason,
        confirmedAt: new Date().toISOString(),
      },
    },
  })

  // Update order to confirmed via state machine helper
  await transitionOrderPaymentStatus(payment.orderId?.toString(), 'PAYMENT_SUCCESS', {
    extraUpdate: {
      payment_status: PAYMENT_STATUS.PAID,
      confirmed_at: new Date(),
    },
  })

  return responseSuccess(res, {
    message: 'Xác nhận thanh toán thủ công thành công',
    data: updated,
  })
}

/**
 * POST /admin/gateway-payments/reconcile-all
 * Trigger a full reconciliation run immediately.
 * Queries all stale PENDING payments against their providers and updates local state.
 * Protected by existing admin authentication middleware.
 */
export const adminReconcileAll = async (req: Request, res: Response) => {
  Logger.apiInfo('[Admin] Manual reconcile-all triggered', {
    adminId: req.jwtDecoded?.id || 'unknown',
  })

  const summary = await paymentReconciliationJob.runOnce()

  return responseSuccess(res, {
    message: 'Reconciliation run complete',
    data: summary,
  })
}
