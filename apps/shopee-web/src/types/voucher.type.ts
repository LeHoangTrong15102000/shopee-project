export type VoucherType = 'percentage' | 'fixed_amount' | 'shipping' | 'shop'
export type VoucherStatus = 'available' | 'used' | 'expired'
export type VoucherCategory = 'all' | 'shop' | 'shipping' | 'shopee'

export interface Voucher {
  _id: string
  code: string
  name: string
  description: string
  discount_type: VoucherType
  discount_value: number
  min_order_value: number
  max_discount?: number
  usage_limit: number
  used_count: number
  start_date: string
  end_date: string
  is_active: boolean
  applicable_categories?: string[]
  applicable_products?: string[]
  terms?: string[]
  createdAt: string
  updatedAt: string
}

export interface UserVoucher extends Voucher {
  collected_at: string
  status: VoucherStatus
  used_at?: string
}

export interface VoucherListConfig {
  page?: number | string
  limit?: number | string
  status?: 'active' | 'expired' | 'upcoming' | 'all'
  category?: VoucherCategory
}

export interface VoucherPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface VoucherListResponse {
  vouchers: Voucher[]
  pagination: VoucherPagination
}

export interface UserVoucherListResponse {
  vouchers: UserVoucher[]
  pagination: VoucherPagination
}

export interface ApplyVoucherResponse {
  voucher: Voucher
  discount_amount: number
  final_total: number
}

export interface ValidateVoucherResponse {
  valid: boolean
  voucher?: Voucher
  message?: string
}
