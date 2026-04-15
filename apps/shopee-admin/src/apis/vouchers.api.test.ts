import { describe, it, expect, vi, beforeEach } from 'vitest'
import vouchersApi from './vouchers.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('vouchers.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getVouchers calls GET /admin/vouchers with params', () => {
    const params = { page: 1, limit: 10, is_active: true }
    vouchersApi.getVouchers(params)
    expect(mockHttp.get).toHaveBeenCalledWith('admin/vouchers', { params })
  })

  it('getVoucher calls GET /admin/vouchers/:id', () => {
    vouchersApi.getVoucher('v-1')
    expect(mockHttp.get).toHaveBeenCalledWith('admin/vouchers/v-1')
  })

  it('getVoucherUsage calls GET /admin/vouchers/:id/usage', () => {
    vouchersApi.getVoucherUsage('v-1', { page: 1, limit: 10 })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/vouchers/v-1/usage', {
      params: { page: 1, limit: 10 },
    })
  })

  it('getVoucherStats calls GET /admin/vouchers/stats', () => {
    vouchersApi.getVoucherStats()
    expect(mockHttp.get).toHaveBeenCalledWith('admin/vouchers/stats')
  })

  it('createVoucher calls POST /admin/vouchers', () => {
    const body = {
      code: 'SALE50',
      discount_type: 'percentage' as const,
      discount_value: 50,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    }
    vouchersApi.createVoucher(body)
    expect(mockHttp.post).toHaveBeenCalledWith('admin/vouchers', body)
  })

  it('updateVoucher calls PUT /admin/vouchers/:id', () => {
    vouchersApi.updateVoucher('v-1', { is_active: false })
    expect(mockHttp.put).toHaveBeenCalledWith('admin/vouchers/v-1', { is_active: false })
  })

  it('deleteVoucher calls DELETE /admin/vouchers/:id', () => {
    vouchersApi.deleteVoucher('v-1')
    expect(mockHttp.delete).toHaveBeenCalledWith('admin/vouchers/v-1')
  })
})
