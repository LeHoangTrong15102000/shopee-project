/// <reference types="jest" />
import { Types } from 'mongoose'
import { PriceService } from '@services/price.service'
import { IPriceRepository } from '@repositories/interfaces/price.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { NotFoundError, BusinessError } from '@services/base.service'

const mockPriceRepository = {
  findPriceHistory: jest.fn(),
  findActiveAlertByUserAndProduct: jest.fn(),
  createAlert: jest.fn(),
  findAlertsByUser: jest.fn(),
  deleteAlertByIdAndUser: jest.fn(),
} as unknown as jest.Mocked<IPriceRepository>

const mockProductRepository = {
  findById: jest.fn(),
} as unknown as jest.Mocked<IProductRepository>

describe('PriceService', () => {
  let service: PriceService
  const validObjectId = new Types.ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
    service = new PriceService(mockPriceRepository, mockProductRepository)
  })

  describe('getPriceHistory', () => {
    it('should return price history for valid productId', async () => {
      const mockHistory = [{ price: 100, date: new Date() }]
      ;(mockPriceRepository.findPriceHistory as jest.Mock).mockResolvedValue(mockHistory)

      const result = await service.getPriceHistory(validObjectId, 30)

      expect(result.price_history).toEqual(mockHistory)
      expect(result.days).toBe(30)
    })

    it('should normalize days to min 1 and max 365', async () => {
      ;(mockPriceRepository.findPriceHistory as jest.Mock).mockResolvedValue([])

      const result1 = await service.getPriceHistory(validObjectId, -10)
      expect(result1.days).toBe(1)

      const result2 = await service.getPriceHistory(validObjectId, 500)
      expect(result2.days).toBe(365)
    })
  })

  describe('createPriceAlert', () => {
    it('should create alert when product exists and no existing alert', async () => {
      const mockProduct = { _id: validObjectId, price: 100, name: 'Test' }
      const mockAlert = { _id: validObjectId, target_price: 80 }
      ;(mockProductRepository.findById as jest.Mock).mockResolvedValue(mockProduct)
      ;(mockPriceRepository.findActiveAlertByUserAndProduct as jest.Mock).mockResolvedValue(null)
      ;(mockPriceRepository.createAlert as jest.Mock).mockResolvedValue(mockAlert)

      const result = await service.createPriceAlert(validObjectId, validObjectId, 80)

      expect(result).toEqual(mockAlert)
    })

    it('should throw NotFoundError when product not found', async () => {
      ;(mockProductRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(service.createPriceAlert(validObjectId, validObjectId, 80)).rejects.toThrow(NotFoundError)
    })

    it('should throw BusinessError when alert already exists', async () => {
      ;(mockProductRepository.findById as jest.Mock).mockResolvedValue({ price: 100 })
      ;(mockPriceRepository.findActiveAlertByUserAndProduct as jest.Mock).mockResolvedValue({ _id: validObjectId })

      await expect(service.createPriceAlert(validObjectId, validObjectId, 80)).rejects.toThrow(BusinessError)
    })
  })

  describe('getPriceAlerts', () => {
    it('should return paginated alerts', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, total_pages: 0, page_size: 10 } }
      ;(mockPriceRepository.findAlertsByUser as jest.Mock).mockResolvedValue(mockResult)

      const result = await service.getPriceAlerts(validObjectId, {}, { page: 1, limit: 10 })

      expect(result).toEqual(mockResult)
    })
  })

  describe('deletePriceAlert', () => {
    it('should delete alert when found', async () => {
      const mockAlert = { _id: validObjectId }
      ;(mockPriceRepository.deleteAlertByIdAndUser as jest.Mock).mockResolvedValue(mockAlert)

      const result = await service.deletePriceAlert(validObjectId, validObjectId)

      expect(result).toEqual(mockAlert)
    })

    it('should throw NotFoundError when alert not found', async () => {
      ;(mockPriceRepository.deleteAlertByIdAndUser as jest.Mock).mockResolvedValue(null)

      await expect(service.deletePriceAlert(validObjectId, validObjectId)).rejects.toThrow(NotFoundError)
    })
  })
})

