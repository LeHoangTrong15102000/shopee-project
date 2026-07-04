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
import purchaseApi from '../purchases.api'

describe('Purchases API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addToCart', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await purchaseApi.addToCart({ product_id: '1', buy_count: 1 })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(purchaseApi.addToCart({ product_id: '1', buy_count: 1 })).rejects.toThrow(
        'Network error',
      )
    })
  })

  describe('getPurchases', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: [] } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await purchaseApi.getPurchases({ status: 0 })
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(purchaseApi.getPurchases({ status: 0 })).rejects.toThrow('Network error')
    })
  })

  describe('buyPurchases', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: [] } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await purchaseApi.buyPurchases([{ product_id: '1', buy_count: 1 }])
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(purchaseApi.buyPurchases([{ product_id: '1', buy_count: 1 }])).rejects.toThrow(
        'Network error',
      )
    })
  })

  describe('updatePurchase', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.put).mockResolvedValue(mockResponse as any)
      const result = await purchaseApi.updatePurchase({ product_id: '1', buy_count: 2 })
      expect(http.put).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'))
      await expect(purchaseApi.updatePurchase({ product_id: '1', buy_count: 2 })).rejects.toThrow(
        'Network error',
      )
    })

    // Task 1.1 — variant switch: all four contract fields are forwarded in the request body
    it('should send product_id, buy_count, sku_id, and target_sku_id in the request body when switching variants', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.put).mockResolvedValue(
        mockResponse as unknown as Awaited<ReturnType<typeof purchaseApi.updatePurchase>>,
      )

      await purchaseApi.updatePurchase({
        product_id: 'prod-1',
        buy_count: 3,
        sku_id: 'sku-A',
        target_sku_id: 'sku-B',
      })

      expect(http.put).toHaveBeenCalledOnce()
      const [_url, body] = vi.mocked(http.put).mock.calls[0] as [string, unknown]
      expect(body).toMatchObject({
        product_id: 'prod-1',
        buy_count: 3,
        sku_id: 'sku-A',
        target_sku_id: 'sku-B',
      })
    })

    // Task 1.2 — plain quantity update (no target_sku_id): body must NOT contain target_sku_id
    it('should NOT include target_sku_id in the request body when doing a plain quantity update', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.put).mockResolvedValue(
        mockResponse as unknown as Awaited<ReturnType<typeof purchaseApi.updatePurchase>>,
      )

      await purchaseApi.updatePurchase({
        product_id: 'prod-1',
        buy_count: 5,
        sku_id: 'sku-A',
      })

      expect(http.put).toHaveBeenCalledOnce()
      const [_url, body] = vi.mocked(http.put).mock.calls[0] as [string, unknown]
      expect(body).toMatchObject({ product_id: 'prod-1', buy_count: 5, sku_id: 'sku-A' })
      expect((body as Record<string, unknown>).target_sku_id).toBeUndefined()
    })
  })

  describe('deletePurchase', () => {
    it('should call http.delete on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { deleted_count: 1 } } }
      vi.mocked(http.delete).mockResolvedValue(mockResponse as any)
      const result = await purchaseApi.deletePurchase(['1'])
      expect(http.delete).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.delete).mockRejectedValue(new Error('Network error'))
      await expect(purchaseApi.deletePurchase(['1'])).rejects.toThrow('Network error')
    })
  })
})
