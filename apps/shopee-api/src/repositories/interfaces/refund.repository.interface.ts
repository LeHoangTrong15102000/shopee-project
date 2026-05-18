import { Types } from 'mongoose'
import { IBaseRepository, PaginatedResult, PaginationOptions } from './base.repository.interface'
import { IRefund, RefundStatusType } from '@database/models/refund.model'

/**
 * DTO for creating a new refund request
 */
export interface CreateRefundDTO {
  order_id: Types.ObjectId | string
  user_id: Types.ObjectId | string
  reason: string
  reason_detail: string
  evidence: string[]
  requested_amount: number
  status: RefundStatusType
  previous_order_status: string
}

/**
 * DTO for updating an existing refund
 */
export interface UpdateRefundDTO {
  status?: RefundStatusType
  approved_amount?: number
  admin_id?: Types.ObjectId | string
  admin_notes?: string
  rejection_reason?: string
  processed_at?: Date
  completed_at?: Date
  gateway_refund_id?: string
  refund_method?: 'auto' | 'manual'
  failure_reason?: string
  retry_count?: number
}

/**
 * Filter options for admin refund list queries
 */
export interface RefundFilterOptions {
  status?: RefundStatusType
  user_id?: string | Types.ObjectId
  from?: Date
  to?: Date
}

/**
 * Refund repository interface
 */
export interface IRefundRepository extends IBaseRepository<
  IRefund,
  CreateRefundDTO,
  UpdateRefundDTO
> {
  /**
   * Find a refund by its associated order ID
   */
  findByOrderId(orderId: string | Types.ObjectId): Promise<IRefund | null>

  /**
   * Find all refunds for a specific user with pagination
   */
  findByUserId(
    userId: string | Types.ObjectId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IRefund>>

  /**
   * Find all PENDING refunds for admin review with pagination
   */
  findPending(pagination: PaginationOptions): Promise<PaginatedResult<IRefund>>

  /**
   * Find refunds with optional filters for admin list view
   */
  findWithFilters(
    filters: RefundFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IRefund>>

  /**
   * Find a refund by ID with populated order and user info (admin detail view)
   */
  findByIdPopulated(id: string | Types.ObjectId): Promise<IRefund | null>

  /**
   * Find all refunds with status=PROCESSING for a given payment provider (payment_method).
   * Used by the MoMo refund polling job to check pending refund statuses.
   */
  findProcessingByProvider(paymentMethod: string): Promise<IRefund[]>
}
