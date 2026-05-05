import {
  Voucher,
  VoucherListConfig,
  ApplyVoucherResponse,
  VoucherListResponse,
  UserVoucherListResponse,
  ValidateVoucherResponse,
  VoucherStatus,
} from 'src/types/voucher.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const voucherApi = {
  getVouchers: (params?: VoucherListConfig) => {
    return http.get<SuccessResponseApi<VoucherListResponse>>('/vouchers', { params })
  },

  getAvailableVouchers: (params?: VoucherListConfig) => {
    return http.get<SuccessResponseApi<VoucherListResponse>>('/vouchers/available', { params })
  },

  getMyVouchers: (params?: { page?: number; limit?: number; status?: VoucherStatus | 'all' }) => {
    return http.get<SuccessResponseApi<UserVoucherListResponse>>('/vouchers/my-vouchers', {
      params,
    })
  },

  getVoucherByCode: (code: string) => {
    return http.get<SuccessResponseApi<Voucher>>(`/vouchers/code/${code}`)
  },

  collectVoucher: (voucherId: string) => {
    return http.post<SuccessResponseApi<{ message: string }>>(`/vouchers/${voucherId}/collect`)
  },

  saveVoucher: (voucherId: string) => {
    return http.post<SuccessResponseApi<{ message: string }>>(`/vouchers/${voucherId}/save`)
  },

  getSavedVouchers: () => {
    return http.get<SuccessResponseApi<Voucher[]>>('/vouchers/saved')
  },

  applyVoucher: (body: { code: string; order_total: number; product_ids?: string[] }) => {
    return http.post<SuccessResponseApi<ApplyVoucherResponse>>('/vouchers/apply', body)
  },

  validateVoucher: (body: { code: string; order_total: number }) => {
    return http.post<SuccessResponseApi<ValidateVoucherResponse>>('/vouchers/validate', body)
  },
}

export default voucherApi
