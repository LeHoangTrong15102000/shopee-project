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
import orderTrackingApi from '../orderTracking.api'

describe('OrderTracking API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTracking', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { order_id: '1', status: 'pending' } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await orderTrackingApi.getTracking({ order_id: '1' })
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(orderTrackingApi.getTracking({ order_id: '1' })).rejects.toThrow('Network error')
    })
  })

  describe('getTrackingByNumber', () => {
    it('should call http.get on success', async () => {
      const mockResponse = {
        data: { message: 'ok', data: { tracking_number: 'VN123', status: 'pending' } },
      }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await orderTrackingApi.getTrackingByNumber('VN123')
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(orderTrackingApi.getTrackingByNumber('VN123')).rejects.toThrow('Network error')
    })
  })
})
