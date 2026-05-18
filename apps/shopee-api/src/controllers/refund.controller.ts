import { Request, Response } from 'express'
import { responseSuccess } from '@utils/response'
import { refundService } from '../container'

/**
 * POST /orders/:orderId/refund-request
 * Submit a refund request for a delivered/returned order.
 */
export const submitRefundRequest = async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string
  const userId = req.jwtDecoded.id
  const { reason, reason_detail, evidence, requested_amount } = req.body

  const refund = await refundService.createRefundRequest(orderId, userId, {
    reason,
    reason_detail,
    evidence: evidence || [],
    requested_amount,
  })

  return responseSuccess(res, {
    message: 'Yêu cầu hoàn tiền đã được gửi thành công',
    data: refund,
  })
}

/**
 * GET /orders/:orderId/refund-status
 * Get the refund status for a specific order.
 */
export const getRefundStatus = async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string
  const userId = req.jwtDecoded.id

  const refund = await refundService.getRefundStatus(orderId, userId)

  return responseSuccess(res, {
    message: 'Lấy trạng thái hoàn tiền thành công',
    data: refund,
  })
}

/**
 * DELETE /orders/:orderId/refund-request
 * Cancel a pending refund request.
 */
export const cancelRefundRequest = async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string
  const userId = req.jwtDecoded.id

  const refund = await refundService.cancelRefund(orderId, userId)

  return responseSuccess(res, {
    message: 'Yêu cầu hoàn tiền đã được hủy',
    data: refund,
  })
}

/**
 * GET /refunds
 * List all refund requests for the authenticated user.
 */
export const listMyRefunds = async (req: Request, res: Response) => {
  const userId = req.jwtDecoded.id
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))

  const result = await refundService.listUserRefunds(userId, { page, limit })

  return responseSuccess(res, {
    message: 'Lấy danh sách yêu cầu hoàn tiền thành công',
    data: result,
  })
}
