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
import checkoutApi from '../checkout.api'

describe('Checkout API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getShippingMethods', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: [] } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await checkoutApi.getShippingMethods()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await checkoutApi.getShippingMethods()
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('getPaymentMethods', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: [] } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await checkoutApi.getPaymentMethods()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await checkoutApi.getPaymentMethods()
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('calculateSummary', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { total: 100 } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await checkoutApi.calculateSummary({ purchaseIds: ['1'] })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(checkoutApi.calculateSummary({ purchaseIds: ['1'] })).rejects.toThrow(
        'Network error',
      )
    })
  })

  describe('createOrder', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await checkoutApi.createOrder({
        purchaseIds: ['1'],
        shippingAddressId: '1',
        shippingMethodId: '1',
        paymentMethod: 'cod',
      })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(
        checkoutApi.createOrder({
          purchaseIds: ['1'],
          shippingAddressId: '1',
          shippingMethodId: '1',
          paymentMethod: 'cod',
        }),
      ).rejects.toThrow('Network error')
    })
  })
})
