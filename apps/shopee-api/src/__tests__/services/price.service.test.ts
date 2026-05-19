/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiWarn: jest.fn(), apiError: jest.fn() },
}))

jest.mock('@database/models/price-alert.model', () => ({
  PriceAlertModel: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndDelete: jest.fn(),
    aggregate: jest.fn(),
  },
}))

import { Types } from 'mongoose'
import { PriceService } from '@services/price.service'
import { PriceAlertModel } from '@database/models/price-alert.model'

// Valid 24-char hex ObjectId strings
const validUserId = new Types.ObjectId().toHexString()
const validProductId = new Types.ObjectId().toHexString()
const validAlertId = new Types.ObjectId().toHexString()

describe('PriceService', () => {
  let service: PriceService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new PriceService()
  })

  describe('getPriceHistory', () => {
    it('should return empty array (stub implementation)', async () => {
      const result = await service.getPriceHistory(validProductId)
      expect(result).toEqual([])
    })

    it('should return empty array with custom days parameter', async () => {
      const result = await service.getPriceHistory(validProductId, 60)
      expect(result).toEqual([])
    })
  })

  describe('createPriceAlert', () => {
    it('should return PriceAlert object with given parameters', async () => {
      const targetPrice = 99.99
      const fakeAlert = {
        _id: new Types.ObjectId(),
        user_id: new Types.ObjectId(validUserId),
        product_id: new Types.ObjectId(validProductId),
        target_price: targetPrice,
        current_price: 0,
        is_triggered: false,
        is_active: true,
        created_at: new Date(),
        toObject() {
          return {
            _id: this._id,
            user_id: this.user_id,
            product_id: this.product_id,
            target_price: this.target_price,
            current_price: this.current_price,
            is_triggered: this.is_triggered,
            is_active: this.is_active,
            created_at: this.created_at,
          }
        },
      }
      ;(PriceAlertModel.create as jest.Mock).mockResolvedValue(fakeAlert)

      const result = await service.createPriceAlert(validUserId, validProductId, targetPrice)

      expect(result).toMatchObject({
        user_id: expect.anything(),
        product_id: expect.anything(),
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
      const filters = { is_active: true }
      const pagination = { page: 1, limit: 10 }

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }
      ;(PriceAlertModel.find as jest.Mock).mockReturnValue(mockFind)
      ;(PriceAlertModel.countDocuments as jest.Mock).mockResolvedValue(0)

      const result = await service.getPriceAlerts(validUserId, filters, pagination)

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
      ;(PriceAlertModel.findOneAndDelete as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })

      const result = await service.deletePriceAlert(validUserId, validAlertId)
      expect(result).toBeNull()
    })
  })
})
