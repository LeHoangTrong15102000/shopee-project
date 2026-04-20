import http from '@/utils/http'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  message: string
  data: T
}

export interface Voucher {
  _id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order_value: number
  max_discount?: number
  expire_date: string
  is_collected?: boolean
  status?: 'active' | 'expired' | 'used'
}

export interface VouchersPage {
  vouchers: Voucher[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// ─── Voucher API ──────────────────────────────────────────────────────────────

export async function getVouchers(page = 1, limit = 20) {
  const res = await http.get<ApiResponse<VouchersPage>>('vouchers', {
    params: { page, limit },
  })
  return res.data
}

export async function collectVoucher(voucherId: string) {
  const res = await http.post<ApiResponse<unknown>>('vouchers/collect', { voucher_id: voucherId })
  return res.data
}

export async function getSavedVouchers(page = 1, limit = 20) {
  const res = await http.get<ApiResponse<VouchersPage>>('vouchers/saved', {
    params: { page, limit },
  })
  return res.data
}

export async function validateVoucher(code: string, orderValue: number) {
  const res = await http.post<ApiResponse<Voucher>>('vouchers/validate', {
    code,
    order_value: orderValue,
  })
  return res.data
}
