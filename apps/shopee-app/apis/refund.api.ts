import http from '@/utils/http'
import { type ApiResponse } from '@/types/api.type'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Refund reason enum — mirrors REFUND_REASON in the backend refund model.
 */
export type RefundReason =
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'CHANGED_MIND'
  | 'OTHER'

/**
 * Refund status enum — mirrors REFUND_STATUS in the backend refund model.
 */
export type RefundStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'

export interface Refund {
  _id: string
  order_id: string
  user_id: string
  reason: RefundReason
  reason_detail: string
  evidence: string[]
  requested_amount: number
  approved_amount?: number
  status: RefundStatus
  rejection_reason?: string
  admin_notes?: string
  processed_at?: string
  completed_at?: string
  createdAt: string
  updatedAt: string
}

/**
 * Payload for submitting a refund request.
 * Mirrors submitRefundSchema:
 *   - reason: required enum
 *   - reason_detail: required non-empty string
 *   - evidence: up to 5 URL strings
 *   - requested_amount: positive number
 */
export interface SubmitRefundPayload {
  reason: RefundReason
  reason_detail: string
  evidence: string[]
  requested_amount: number
}

export interface RefundsPagination {
  page: number
  limit: number
  page_size: number
  total: number
}

export interface RefundsPage {
  data: Refund[]
  pagination: RefundsPagination
}

// ─── Refund API ───────────────────────────────────────────────────────────────

/**
 * POST orders/:orderId/refund-request — submit a refund request.
 */
export async function submitRefundRequest(
  orderId: string,
  payload: SubmitRefundPayload
): Promise<Refund> {
  const res = await http.post<ApiResponse<Refund>>(`orders/${orderId}/refund-request`, payload)
  return res.data.data
}

/**
 * GET orders/:orderId/refund-status — get the refund status for an order.
 */
export async function getRefundStatus(orderId: string): Promise<Refund | null> {
  const res = await http.get<ApiResponse<Refund | null>>(`orders/${orderId}/refund-status`)
  return res.data.data
}

/**
 * DELETE orders/:orderId/refund-request — cancel a pending refund request.
 */
export async function cancelRefundRequest(orderId: string): Promise<Refund> {
  const res = await http.delete<ApiResponse<Refund>>(`orders/${orderId}/refund-request`)
  return res.data.data
}

/**
 * GET refunds — list all refund requests for the authenticated user.
 */
export async function listMyRefunds(params: {
  page?: number
  limit?: number
}): Promise<RefundsPage> {
  const res = await http.get<ApiResponse<RefundsPage>>('refunds', { params })
  return res.data.data
}
