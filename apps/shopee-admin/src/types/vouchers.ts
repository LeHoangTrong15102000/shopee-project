import type { User } from '@shopee/shared-types'

export type DiscountType = 'percentage' | 'fixed'

export interface Voucher {
  _id: string
  code: string
  discount_type: DiscountType
  discount_value: number
  min_order_value: number
  usage_limit: number
  used_count: number
  is_active: boolean
  start_date: string
  end_date: string
  createdAt: string
  updatedAt: string
}

export interface VoucherUsage {
  _id: string
  user: User | string
  voucher: string
  order: string
  discount_amount: number
  createdAt: string
}
