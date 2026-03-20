/// <reference types="jest" />
import { PriceService } from '@services/price.service'

describe('PriceService', () => {
  let service: PriceService

  beforeEach(() => {
    service = new PriceService()
  })

  describe('getPriceHistory', () => {
    it('should return empty array (stub implementation)', async () => {
      const result = await service.getPriceHistory('product123')
      expect(result).toEqual([])
    })

    it('should return empty array with custom days parameter', async () => {
      const result = await service.getPriceHistory('product123', 60)
      expect(result).toEqual([])
    })
  })

  describe('createPriceAlert', () => {
    it('should return PriceAlert object with given parameters', async () => {
      const userId = 'user123'
      const productId = 'product456'
      const targetPrice = 99.99

      const result = await service.createPriceAlert(userId, productId, targetPrice)

      expect(result).toMatchObject({
        user_id: userId,
        product_id: productId,
        target_price: targetPrice,
        current_price: 0,
        is_triggered: false,
        is_active: true,
      })
      expect(result.created_at).toBeInstanceOf(Date)
    })
  })

  describe('getPriceAlerts', () => {
    it('should return empty data with pagination', async () => {
      const userId = 'user123'
      const filters = { is_active: true }
      const pagination = { page: 1, limit: 10 }

      const result = await service.getPriceAlerts(userId, filters, pagination)

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          page_size: 1,
          total: 0,
        },
      })
    })
  })

  describe('deletePriceAlert', () => {
    it('should return null (stub implementation)', async () => {
      const result = await service.deletePriceAlert('user123', 'alert456')
      expect(result).toBeNull()
    })
  })
})
