import {
  Voucher,
  VoucherListConfig,
  ApplyVoucherResponse,
  VoucherListResponse,
  UserVoucher,
  UserVoucherListResponse,
  ValidateVoucherResponse,
  VoucherStatus
} from 'src/types/voucher.type'
import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'

const mockVouchers: Voucher[] = [
  {
    _id: 'v1',
    code: 'GIAM50K',
    name: 'Giảm 50K',
    discount_type: 'fixed_amount',
    discount_value: 50000,
    min_order_value: 200000,
    usage_limit: 100,
    used_count: 45,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    description: 'Giảm 50.000đ cho đơn từ 200.000đ',
    terms: ['Áp dụng cho tất cả sản phẩm', 'Mỗi tài khoản chỉ được sử dụng 1 lần'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'v2',
    code: 'FREESHIP',
    name: 'Miễn phí vận chuyển',
    discount_type: 'shipping',
    discount_value: 30000,
    min_order_value: 0,
    usage_limit: 200,
    used_count: 120,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    description: 'Miễn phí vận chuyển đến 30.000đ',
    terms: ['Áp dụng cho đơn hàng toàn quốc'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'v3',
    code: 'SALE10',
    name: 'Giảm 10%',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_value: 100000,
    max_discount: 100000,
    usage_limit: 500,
    used_count: 200,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    description: 'Giảm 10% tối đa 100.000đ',
    terms: ['Áp dụng cho đơn từ 100.000đ', 'Giảm tối đa 100.000đ'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'v4',
    code: 'SHOPEE20',
    name: 'Shopee giảm 20K',
    discount_type: 'fixed_amount',
    discount_value: 20000,
    min_order_value: 99000,
    usage_limit: 1000,
    used_count: 500,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    description: 'Shopee tài trợ giảm 20.000đ',
    terms: ['Áp dụng cho đơn từ 99.000đ'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

let savedVoucherIds: string[] = ['v1', 'v2']

const voucherApi = {
  getVouchers: async (params?: VoucherListConfig) => {
    try {
      const response = await http.get<SuccessResponseApi<VoucherListResponse>>('/vouchers', { params })
      return response
    } catch {
      return {
        data: {
          message: 'Lấy danh sách voucher thành công',
          data: {
            vouchers: mockVouchers,
            pagination: { page: 1, limit: 10, total: mockVouchers.length, totalPages: 1 }
          }
        }
      }
    }
  },

  getAvailableVouchers: async (params?: VoucherListConfig) => {
    try {
      const response = await http.get<SuccessResponseApi<VoucherListResponse>>('/vouchers/available', { params })
      return response
    } catch {
      const availableVouchers = mockVouchers.filter((v) => !savedVoucherIds.includes(v._id))
      return {
        data: {
          message: 'Lấy danh sách voucher có sẵn thành công',
          data: {
            vouchers: availableVouchers,
            pagination: { page: 1, limit: 10, total: availableVouchers.length, totalPages: 1 }
          }
        }
      }
    }
  },

  getMyVouchers: async (params?: { page?: number; limit?: number; status?: VoucherStatus | 'all' }) => {
    try {
      const response = await http.get<SuccessResponseApi<UserVoucherListResponse>>('/vouchers/my-vouchers', { params })
      return response
    } catch {
      const userVouchers: UserVoucher[] = mockVouchers
        .filter((v) => savedVoucherIds.includes(v._id))
        .map((v) => ({
          ...v,
          collected_at: new Date().toISOString(),
          status: 'available' as const
        }))

      const filteredVouchers =
        params?.status && params.status !== 'all'
          ? userVouchers.filter((v) => v.status === params.status)
          : userVouchers

      return {
        data: {
          message: 'Lấy danh sách voucher của tôi thành công',
          data: {
            vouchers: filteredVouchers,
            pagination: { page: 1, limit: 10, total: filteredVouchers.length, totalPages: 1 }
          }
        }
      }
    }
  },

  getVoucherByCode: async (code: string) => {
    try {
      const response = await http.get<SuccessResponseApi<Voucher>>(`/vouchers/code/${code}`)
      return response
    } catch {
      const voucher = mockVouchers.find((v) => v.code === code)
      if (voucher) {
        return { data: { message: 'Lấy voucher thành công', data: voucher } }
      }
      throw new Error('Voucher không tồn tại')
    }
  },

  collectVoucher: async (voucherId: string) => {
    try {
      const response = await http.post<SuccessResponseApi<{ message: string }>>(`/vouchers/${voucherId}/collect`)
      return response
    } catch {
      if (!savedVoucherIds.includes(voucherId)) {
        savedVoucherIds.push(voucherId)
      }
      return { data: { message: 'Thu thập voucher thành công', data: { message: 'Thu thập voucher thành công' } } }
    }
  },

  saveVoucher: async (voucherId: string) => {
    try {
      const response = await http.post<SuccessResponseApi<{ message: string }>>(`/vouchers/${voucherId}/save`)
      return response
    } catch {
      if (!savedVoucherIds.includes(voucherId)) {
        savedVoucherIds.push(voucherId)
      }
      return { data: { message: 'Lưu voucher thành công', data: { message: 'Lưu voucher thành công' } } }
    }
  },

  getSavedVouchers: async () => {
    try {
      const response = await http.get<SuccessResponseApi<Voucher[]>>('/vouchers/saved')
      return response
    } catch {
      const savedVouchers = mockVouchers.filter((v) => savedVoucherIds.includes(v._id))
      return { data: { message: 'Lấy voucher đã lưu thành công', data: savedVouchers } }
    }
  },

  applyVoucher: async (body: { code: string; order_total: number; product_ids?: string[] }) => {
    try {
      const response = await http.post<SuccessResponseApi<ApplyVoucherResponse>>('/vouchers/apply', body)
      return response
    } catch {
      const voucher = mockVouchers.find((v) => v.code === body.code)
      if (voucher && body.order_total >= voucher.min_order_value) {
        let discount =
          voucher.discount_type === 'percentage'
            ? Math.min((body.order_total * voucher.discount_value) / 100, voucher.max_discount || Infinity)
            : voucher.discount_value
        return {
          data: {
            message: 'Áp dụng voucher thành công',
            data: {
              voucher,
              discount_amount: discount,
              final_total: body.order_total - discount
            }
          }
        }
      }
      throw new Error('Voucher không hợp lệ hoặc chưa đạt giá trị đơn hàng tối thiểu')
    }
  },

  validateVoucher: async (body: { code: string; order_total: number }) => {
    try {
      const response = await http.post<SuccessResponseApi<ValidateVoucherResponse>>('/vouchers/validate', body)
      return response
    } catch {
      const voucher = mockVouchers.find((v) => v.code === body.code)
      if (voucher && body.order_total >= voucher.min_order_value) {
        return { data: { message: 'Voucher hợp lệ', data: { valid: true, voucher } } }
      }
      return {
        data: {
          message: 'Voucher không hợp lệ',
          data: { valid: false, message: 'Voucher không hợp lệ hoặc chưa đạt giá trị đơn hàng tối thiểu' }
        }
      }
    }
  }
}

export default voucherApi
