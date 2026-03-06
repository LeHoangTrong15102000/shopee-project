import { Types } from 'mongoose'
import { PaginatedResult, PaginationOptions } from './base.repository.interface'
import { IVoucher, DiscountType } from '@database/models/voucher.model'
import { ISavedVoucher, VoucherStatus } from '@database/models/saved-voucher.model'

export interface VoucherFilterOptions {
  is_active?: boolean
  discount_type?: DiscountType
  available_only?: boolean
}

export interface ApplyVoucherInput {
  code: string
  order_value: number
  product_ids?: string[]
  category_ids?: string[]
}

export interface ApplyVoucherResult {
  voucher_id: Types.ObjectId
  code: string
  discount_type: DiscountType
  discount_value: number
  discount_amount: number
  final_value: number
}

export interface VoucherStatusInfo {
  is_expired: boolean
  is_not_started: boolean
  is_used_up: boolean
  is_inactive?: boolean
  is_valid: boolean
}

export interface IVoucherRepository {
  findAvailable(pagination: PaginationOptions, filters?: VoucherFilterOptions): Promise<PaginatedResult<IVoucher>>

  findByCode(code: string): Promise<IVoucher | null>

  findById(id: string | Types.ObjectId): Promise<IVoucher | null>

  incrementUsedCount(id: string | Types.ObjectId): Promise<IVoucher | null>

  findSavedByUser(
    userId: string | Types.ObjectId,
    pagination: PaginationOptions,
    status?: VoucherStatus
  ): Promise<PaginatedResult<ISavedVoucher>>

  findSavedVoucher(
    userId: string | Types.ObjectId,
    voucherId: string | Types.ObjectId
  ): Promise<ISavedVoucher | null>

  saveVoucher(userId: string | Types.ObjectId, voucherId: string | Types.ObjectId): Promise<ISavedVoucher>

  markVoucherUsed(
    userId: string | Types.ObjectId,
    voucherId: string | Types.ObjectId,
    orderId?: string | Types.ObjectId
  ): Promise<ISavedVoucher | null>

  getCollectedVoucherIds(userId: string | Types.ObjectId): Promise<string[]>
}

