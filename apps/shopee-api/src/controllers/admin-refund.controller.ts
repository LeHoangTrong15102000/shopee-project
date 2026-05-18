import { Request, Response } from 'express'
import { responseSuccess } from '@utils/response'
import { refundService, auditLogService } from '../container'
import { RefundFilterOptions } from '@repositories/interfaces/refund.repository.interface'
import { RefundStatusType } from '@database/models/refund.model'

/**
 * Lấy IP thực của client
 */
const getClientIP = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket.remoteAddress || 'unknown'
}

/**
 * Get user-agent string safely (handles string | string[] | undefined)
 */
const getUserAgent = (req: Request): string => {
  const ua = req.headers['user-agent']
  if (Array.isArray(ua)) return ua[0] || ''
  return ua || ''
}

/**
 * GET /admin/refunds
 * List refunds with optional filters.
 * Query params: status, user_id, from, to, page, limit
 */
export const listRefunds = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))

  const filters: RefundFilterOptions = {}

  if (req.query.status) {
    filters.status = req.query.status as RefundStatusType
  }
  if (req.query.user_id) {
    filters.user_id = req.query.user_id as string
  }
  if (req.query.from) {
    filters.from = new Date(req.query.from as string)
  }
  if (req.query.to) {
    filters.to = new Date(req.query.to as string)
  }

  const result = await refundService.listRefunds(filters, { page, limit })

  return responseSuccess(res, {
    message: 'Lấy danh sách yêu cầu hoàn tiền thành công',
    data: result,
  })
}

/**
 * GET /admin/refunds/stats
 * Get refund counts grouped by status.
 */
export const getRefundStats = async (req: Request, res: Response) => {
  const stats = await refundService.getRefundStats()

  return responseSuccess(res, {
    message: 'Lấy thống kê hoàn tiền thành công',
    data: stats,
  })
}

/**
 * GET /admin/refunds/:id
 * Get a single refund by ID.
 */
export const getRefundDetail = async (req: Request, res: Response) => {
  const refundId = req.params.id as string

  const refund = await refundService.getRefundById(refundId)

  return responseSuccess(res, {
    message: 'Lấy chi tiết yêu cầu hoàn tiền thành công',
    data: refund,
  })
}

/**
 * PUT /admin/refunds/:id/approve
 * Approve a refund request.
 */
export const approveRefund = async (req: Request, res: Response) => {
  const refundId = req.params.id as string
  const adminId = req.jwtDecoded.id
  const { approved_amount, notes } = req.body

  const refund = await refundService.approveRefund(refundId, adminId, approved_amount, notes)

  // Audit log
  auditLogService.writeLog({
    action: 'refund.approve',
    resource: 'refund',
    resourceId: refundId,
    actor: { userId: adminId, roles: ['admin'] },
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    status: 'success',
  })

  return responseSuccess(res, {
    message: 'Yêu cầu hoàn tiền đã được duyệt',
    data: refund,
  })
}

/**
 * PUT /admin/refunds/:id/reject
 * Reject a refund request.
 */
export const rejectRefund = async (req: Request, res: Response) => {
  const refundId = req.params.id as string
  const adminId = req.jwtDecoded.id
  const { rejection_reason } = req.body

  const refund = await refundService.rejectRefund(refundId, adminId, rejection_reason)

  // Audit log
  auditLogService.writeLog({
    action: 'refund.reject',
    resource: 'refund',
    resourceId: refundId,
    actor: { userId: adminId, roles: ['admin'] },
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    status: 'success',
  })

  return responseSuccess(res, {
    message: 'Yêu cầu hoàn tiền đã bị từ chối',
    data: refund,
  })
}

/**
 * PUT /admin/refunds/:id/complete
 * Mark a refund as completed.
 */
export const completeRefund = async (req: Request, res: Response) => {
  const refundId = req.params.id as string
  const adminId = req.jwtDecoded.id

  const refund = await refundService.completeRefund(refundId)

  // Audit log
  auditLogService.writeLog({
    action: 'refund.complete',
    resource: 'refund',
    resourceId: refundId,
    actor: { userId: adminId, roles: ['admin'] },
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    status: 'success',
  })

  return responseSuccess(res, {
    message: 'Hoàn tiền đã được hoàn thành',
    data: refund,
  })
}

/**
 * PUT /admin/refunds/:id/retry
 * Retry a failed gateway refund (auto-refund methods only).
 */
export const retryGatewayRefund = async (req: Request, res: Response) => {
  const refundId = req.params.id as string
  const adminId = req.jwtDecoded.id

  const refund = await refundService.retryGatewayRefund(refundId)

  // Audit log
  auditLogService.writeLog({
    action: 'refund.retry',
    resource: 'refund',
    resourceId: refundId,
    actor: { userId: adminId, roles: ['admin'] },
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    status: 'success',
  })

  return responseSuccess(res, {
    message: 'Đã kích hoạt lại yêu cầu hoàn tiền qua cổng thanh toán',
    data: refund,
  })
}
