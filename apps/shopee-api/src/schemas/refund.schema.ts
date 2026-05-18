import { z } from 'zod'
import { REFUND_REASON } from '@database/models/refund.model'

const objectIdRegex = /^[0-9a-fA-F]{24}$/

/**
 * Schema for submitting a refund request
 * POST /orders/:orderId/refund-request
 */
export const submitRefundSchema = z.object({
  body: z.object({
    reason: z.enum(Object.values(REFUND_REASON) as [string, ...string[]], 'Lý do không hợp lệ'),
    reason_detail: z.string().min(1, 'Chi tiết lý do là bắt buộc'),
    evidence: z
      .array(z.string().url('URL ảnh không hợp lệ'))
      .max(5, 'Tối đa 5 ảnh bằng chứng')
      .default([]),
    requested_amount: z.coerce.number().positive('Số tiền yêu cầu phải lớn hơn 0'),
  }),
  params: z.object({
    orderId: z.string().regex(objectIdRegex, 'ID đơn hàng không hợp lệ'),
  }),
})

export type SubmitRefundInput = z.infer<typeof submitRefundSchema>

/**
 * Schema for cancelling a refund request
 * DELETE /orders/:orderId/refund-request
 */
export const cancelRefundSchema = z.object({
  params: z.object({
    orderId: z.string().regex(objectIdRegex, 'ID đơn hàng không hợp lệ'),
  }),
})

export type CancelRefundInput = z.infer<typeof cancelRefundSchema>

/**
 * Schema for checking refund status
 * GET /orders/:orderId/refund-status
 */
export const refundStatusSchema = z.object({
  params: z.object({
    orderId: z.string().regex(objectIdRegex, 'ID đơn hàng không hợp lệ'),
  }),
})

export type RefundStatusInput = z.infer<typeof refundStatusSchema>

/**
 * Schema for admin approving a refund
 * PUT /admin/refunds/:id/approve
 */
export const adminApproveRefundSchema = z.object({
  body: z.object({
    approved_amount: z.coerce.number().positive('Số tiền duyệt phải lớn hơn 0'),
    notes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'ID yêu cầu hoàn tiền không hợp lệ'),
  }),
})

export type AdminApproveRefundInput = z.infer<typeof adminApproveRefundSchema>

/**
 * Schema for admin rejecting a refund
 * PUT /admin/refunds/:id/reject
 */
export const adminRejectRefundSchema = z.object({
  body: z.object({
    rejection_reason: z.string().min(1, 'Lý do từ chối là bắt buộc'),
  }),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'ID yêu cầu hoàn tiền không hợp lệ'),
  }),
})

export type AdminRejectRefundInput = z.infer<typeof adminRejectRefundSchema>

/**
 * Schema for admin retrying a failed gateway refund
 * PUT /admin/refunds/:id/retry
 */
export const adminRetryRefundSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'ID yêu cầu hoàn tiền không hợp lệ'),
  }),
})

export type AdminRetryRefundInput = z.infer<typeof adminRetryRefundSchema>
