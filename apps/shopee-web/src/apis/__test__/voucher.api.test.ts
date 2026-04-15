import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('src/utils/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}))

import http from 'src/utils/http'
import voucherApi from '../voucher.api'

describe('Voucher API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getVouchers', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { vouchers: [], pagination: {} } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await voucherApi.getVouchers()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await voucherApi.getVouchers()
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('getAvailableVouchers', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { vouchers: [], pagination: {} } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await voucherApi.getAvailableVouchers()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await voucherApi.getAvailableVouchers()
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('getMyVouchers', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { vouchers: [], pagination: {} } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await voucherApi.getMyVouchers()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await voucherApi.getMyVouchers()
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('getVoucherByCode', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', code: 'TEST' } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await voucherApi.getVoucherByCode('TEST')
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(voucherApi.getVoucherByCode('NONEXISTENT')).rejects.toThrow()
    })
  })

  describe('collectVoucher', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { message: 'collected' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await voucherApi.collectVoucher('1')
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const result = await voucherApi.collectVoucher('1')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('saveVoucher', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { message: 'saved' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await voucherApi.saveVoucher('1')
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const result = await voucherApi.saveVoucher('1')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('getSavedVouchers', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: [] } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await voucherApi.getSavedVouchers()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await voucherApi.getSavedVouchers()
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('applyVoucher', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { discount_amount: 50000 } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await voucherApi.applyVoucher({ code: 'TEST', order_total: 200000 })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(
        voucherApi.applyVoucher({ code: 'NONEXISTENT', order_total: 200000 }),
      ).rejects.toThrow()
    })
  })

  describe('validateVoucher', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { valid: true } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await voucherApi.validateVoucher({ code: 'TEST', order_total: 200000 })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const result = await voucherApi.validateVoucher({ code: 'TEST', order_total: 200000 })
      expect(result.data.message).toEqual(expect.any(String))
    })
  })
})
