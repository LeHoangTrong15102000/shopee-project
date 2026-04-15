import { createMockVoucher } from 'src/test-utils/factories'
import type { Voucher } from 'src/types'

export const mockVouchers: Voucher[] = [
  createMockVoucher({
    _id: 'voucher-1',
    code: 'SALE50',
    discount_type: 'percentage',
    discount_value: 50,
    is_active: true,
  }),
  createMockVoucher({
    _id: 'voucher-2',
    code: 'FLAT100K',
    discount_type: 'fixed',
    discount_value: 100000,
    is_active: true,
  }),
  createMockVoucher({
    _id: 'voucher-3',
    code: 'EXPIRED10',
    discount_type: 'percentage',
    discount_value: 10,
    is_active: false,
    end_date: '2023-12-31T23:59:59.000Z',
  }),
  createMockVoucher({
    _id: 'voucher-4',
    code: 'UPCOMING20',
    discount_type: 'percentage',
    discount_value: 20,
    is_active: true,
    start_date: '2025-06-01T00:00:00.000Z',
  }),
]
