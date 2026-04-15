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
import addressApi from '../address.api'

describe('Address API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAddresses', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { addresses: [], total: 0 } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await addressApi.getAddresses()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await addressApi.getAddresses()
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('getAddressById', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await addressApi.getAddressById('1')
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await addressApi.getAddressById('1')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('createAddress', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await addressApi.createAddress({
        fullName: 'Test',
        phone: '123',
        province: 'HCM',
        district: 'Q1',
        ward: 'P1',
        street: 'Street',
      })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const result = await addressApi.createAddress({
        fullName: 'Test',
        phone: '123',
        province: 'HCM',
        district: 'Q1',
        ward: 'P1',
        street: 'Street',
      })
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('updateAddress', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.put).mockResolvedValue(mockResponse as any)
      const result = await addressApi.updateAddress('1', { fullName: 'Updated' })
      expect(http.put).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'))
      const result = await addressApi.updateAddress('1', { fullName: 'Updated' })
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('deleteAddress', () => {
    it('should call http.delete on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { message: 'deleted' } } }
      vi.mocked(http.delete).mockResolvedValue(mockResponse as any)
      const result = await addressApi.deleteAddress('1')
      expect(http.delete).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.delete).mockRejectedValue(new Error('Network error'))
      const result = await addressApi.deleteAddress('1')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('setDefaultAddress', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', isDefault: true } } }
      vi.mocked(http.put).mockResolvedValue(mockResponse as any)
      const result = await addressApi.setDefaultAddress('1')
      expect(http.put).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'))
      const result = await addressApi.setDefaultAddress('1')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })
})
