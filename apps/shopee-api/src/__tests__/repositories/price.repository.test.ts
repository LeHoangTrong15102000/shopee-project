import { Types } from 'mongoose'
import { PriceHistoryModel } from '@database/models/price-history.model'
import { PriceAlertModel } from '@database/models/price-alert.model'
import { PriceRepository } from '@repositories/price.repository'

jest.mock('@database/models/price-history.model')
jest.mock('@database/models/price-alert.model')

const chainMock = (resolvedValue: any) => ({
  populate: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(resolvedValue),
  exec: jest.fn().mockResolvedValue(resolvedValue),
})

describe('PriceRepository', () => {
  let repository: PriceRepository
  const mockPriceHistoryModel = PriceHistoryModel as jest.Mocked<typeof PriceHistoryModel>
  const mockPriceAlertModel = PriceAlertModel as jest.Mocked<typeof PriceAlertModel>
  const mockUserId = new Types.ObjectId().toString()
  const mockProductId = new Types.ObjectId().toString()
  const mockAlertId = new Types.ObjectId().toString()
  const mockPriceHistory = { _id: new Types.ObjectId(), product_id: mockProductId, price: 100, recorded_at: new Date() }
  const mockAlert = { _id: mockAlertId, user_id: mockUserId, product_id: mockProductId, target_price: 80, is_active: true }

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new PriceRepository()
  })

  describe('findPriceHistory', () => {
    it('should find price history for product', async () => {
      ;(mockPriceHistoryModel.find as jest.Mock).mockReturnValue(chainMock([mockPriceHistory]))
      const result = await repository.findPriceHistory(mockProductId, 30)
      expect(mockPriceHistoryModel.find).toHaveBeenCalled()
      expect(result).toEqual([mockPriceHistory])
    })
  })

  describe('findAlertsByUser', () => {
    it('should find alerts by user', async () => {
      ;(mockPriceAlertModel.find as jest.Mock).mockReturnValue(chainMock([mockAlert]))
      ;(mockPriceAlertModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findAlertsByUser(mockUserId, {}, { page: 1, limit: 10 })
      expect(result.data).toEqual([mockAlert])
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by is_active', async () => {
      ;(mockPriceAlertModel.find as jest.Mock).mockReturnValue(chainMock([mockAlert]))
      ;(mockPriceAlertModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findAlertsByUser(mockUserId, { is_active: true }, { page: 1, limit: 10 })
      expect(result.data).toEqual([mockAlert])
    })

    it('should filter by is_triggered', async () => {
      ;(mockPriceAlertModel.find as jest.Mock).mockReturnValue(chainMock([]))
      ;(mockPriceAlertModel.countDocuments as jest.Mock).mockResolvedValue(0)
      const result = await repository.findAlertsByUser(mockUserId, { is_triggered: true }, { page: 1, limit: 10 })
      expect(result.data).toEqual([])
    })
  })

  describe('findActiveAlertByUserAndProduct', () => {
    it('should find active alert by user and product', async () => {
      ;(mockPriceAlertModel.findOne as jest.Mock).mockReturnValue(chainMock(mockAlert))
      const result = await repository.findActiveAlertByUserAndProduct(mockUserId, mockProductId)
      expect(mockPriceAlertModel.findOne).toHaveBeenCalled()
      expect(result).toEqual(mockAlert)
    })

    it('should return null if no active alert', async () => {
      ;(mockPriceAlertModel.findOne as jest.Mock).mockReturnValue(chainMock(null))
      const result = await repository.findActiveAlertByUserAndProduct(mockUserId, mockProductId)
      expect(result).toBeNull()
    })
  })

  describe('createAlert', () => {
    it('should create a price alert', async () => {
      const mockSave = jest.fn().mockResolvedValue({ toObject: () => mockAlert })
      ;(mockPriceAlertModel as any).mockImplementation(() => ({ save: mockSave }))
      const result = await repository.createAlert({
        user_id: mockUserId,
        product_id: mockProductId,
        target_price: 80,
        current_price: 100,
      })
      expect(result).toEqual(mockAlert)
    })
  })

  describe('deleteAlertByIdAndUser', () => {
    it('should delete alert by id and user', async () => {
      ;(mockPriceAlertModel.findOneAndDelete as jest.Mock).mockReturnValue(chainMock(mockAlert))
      const result = await repository.deleteAlertByIdAndUser(mockAlertId, mockUserId)
      expect(mockPriceAlertModel.findOneAndDelete).toHaveBeenCalled()
      expect(result).toEqual(mockAlert)
    })

    it('should return null if alert not found', async () => {
      ;(mockPriceAlertModel.findOneAndDelete as jest.Mock).mockReturnValue(chainMock(null))
      const result = await repository.deleteAlertByIdAndUser(mockAlertId, mockUserId)
      expect(result).toBeNull()
    })
  })
})

