import http from 'src/utils/http'
import type { SuccessResponse, Voucher, VoucherUsage, DiscountType } from 'src/types'

interface VoucherListParams {
  page?: number
  limit?: number
  is_active?: boolean
  discount_type?: DiscountType
  sort_by?: string
  order?: string
  search?: string
}

interface VoucherListResponse {
  vouchers: Voucher[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface VoucherStats {
  total: number
  active: number
  inactive: number
  total_usage: number
}

interface CreateVoucherBody {
  code: string
  discount_type: DiscountType
  discount_value: number
  min_order_value?: number
  usage_limit?: number
  start_date: string
  end_date: string
}

const vouchersApi = {
  getVouchers: (params?: VoucherListParams) =>
    http.get<SuccessResponse<VoucherListResponse>>('admin/vouchers', { params }),

  getVoucher: (id: string) => http.get<SuccessResponse<Voucher>>(`admin/vouchers/${id}`),

  getVoucherUsage: (id: string, params?: { page?: number; limit?: number }) =>
    http.get<
      SuccessResponse<{
        usage: VoucherUsage[]
        pagination: { page: number; limit: number; total: number }
      }>
    >(`admin/vouchers/${id}/usage`, { params }),

  getVoucherStats: () => http.get<SuccessResponse<VoucherStats>>('admin/vouchers/stats'),

  createVoucher: (body: CreateVoucherBody) =>
    http.post<SuccessResponse<Voucher>>('admin/vouchers', body),

  updateVoucher: (id: string, body: Partial<CreateVoucherBody> & { is_active?: boolean }) =>
    http.put<SuccessResponse<Voucher>>(`admin/vouchers/${id}`, body),

  deleteVoucher: (id: string) => http.delete<SuccessResponse<null>>(`admin/vouchers/${id}`),
}

export default vouchersApi
