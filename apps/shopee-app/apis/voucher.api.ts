import http from '@/utils/http'
import { type ApiResponse, type Pagination } from '@/types/api.type'

// ─── Types ───────────────────────────────────────────────────────────────────

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
  pagination: Pagination
}

export interface ApplyVoucherResponse {
  discount_amount: number
  final_total: number
  voucher: Voucher
}

// ─── Voucher API ──────────────────────────────────────────────────────────────

export async function getVouchers(page = 1, limit = 20) {
  const res = await http.get<ApiResponse<VouchersPage>>('vouchers', {
    params: { page, limit },
  })
  return res.data
}

export async function getAvailableVouchers() {
  const res = await http.get<ApiResponse<VouchersPage>>('vouchers/available')
  return res.data
}

export async function getMyVouchers(status: 'available' | 'used' | 'expired', page = 1, limit = 20) {
  const res = await http.get<ApiResponse<VouchersPage>>('vouchers/my-vouchers', {
    params: { status, page, limit },
  })
  return res.data
}

export async function applyVoucher(code: string, orderValue: number) {
  const res = await http.post<ApiResponse<ApplyVoucherResponse>>('vouchers/apply', {
    code,
    order_value: orderValue,
  })
  return res.data
}

export async function saveVoucher(voucherId: string) {
  const res = await http.post<ApiResponse<unknown>>(`vouchers/${voucherId}/save`)
  return res.data
}

export async function getVoucherByCode(code: string) {
  const res = await http.get<ApiResponse<Voucher>>(`vouchers/code/${code}`)
  return res.data
}

export async function collectVoucher(voucherId: string) {
  const res = await http.post<ApiResponse<unknown>>(`vouchers/${voucherId}/collect`)
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

