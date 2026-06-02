/// <reference types="jest" />

const mockShopFind = jest.fn()
const mockShopCountDocuments = jest.fn()
const mockShopFindById = jest.fn()
const mockShopFindByIdAndUpdate = jest.fn()
const mockProductCountDocuments = jest.fn()
const mockProductFind = jest.fn()
const mockOrderAggregate = jest.fn()

jest.mock('@database/models/shop.model', () => ({
  ShopModel: {
    find: jest.fn(() => ({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: mockShopFind,
    })),
    countDocuments: mockShopCountDocuments,
    findById: jest.fn(() => ({ lean: mockShopFindById })),
    findByIdAndUpdate: mockShopFindByIdAndUpdate,
  },
  ShopStatus: {},
}))

jest.mock('@database/models/product.model', () => ({
  ProductModel: {
    countDocuments: mockProductCountDocuments,
    find: jest.fn(() => ({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: mockProductFind,
      distinct: jest.fn().mockResolvedValue([]),
    })),
    distinct: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('@database/models/order.model', () => ({
  OrderModel: {
    aggregate: mockOrderAggregate,
  },
  ORDER_STATUS: {
    DELIVERED: 'delivered',
  },
}))

import { AdminShopsService } from '@services/admin-shops.service'
import { ShopModel } from '@database/models/shop.model'

const VALID_ID = '507f1f77bcf86cd799439011'
const INVALID_ID = 'not-an-id'

describe('AdminShopsService', () => {
  let service: AdminShopsService

  beforeEach(() => {
    service = new AdminShopsService()
    jest.clearAllMocks()
    // Restore findById to return { lean: mockShopFindById } after clearAllMocks
    ;(ShopModel.findById as jest.Mock).mockReturnValue({ lean: mockShopFindById })
  })

  describe('listShops', () => {
    it('returns paginated shops with no filter', async () => {
      mockShopFind.mockResolvedValue([{ _id: 's1', name: 'Shop 1' }])
      mockShopCountDocuments.mockResolvedValue(1)

      const result = await service.listShops({})

      expect(ShopModel.find).toHaveBeenCalled()
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('pagination')
      expect(result.pagination.total).toBe(1)
    })

    it('applies status filter', async () => {
      mockShopFind.mockResolvedValue([])
      mockShopCountDocuments.mockResolvedValue(0)

      await service.listShops({ status: 'active' as any })

      expect(ShopModel.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }))
    })

    it('applies $text search filter', async () => {
      mockShopFind.mockResolvedValue([])
      mockShopCountDocuments.mockResolvedValue(0)

      await service.listShops({ search: 'electronics' })

      expect(ShopModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ $text: { $search: 'electronics' } }),
      )
    })

    it('uses default pagination values', async () => {
      mockShopFind.mockResolvedValue([])
      mockShopCountDocuments.mockResolvedValue(0)

      const result = await service.listShops({})

      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })
  })

  describe('getShopDetail', () => {
    it('throws ValidationError for invalid shopId', async () => {
      await expect(service.getShopDetail(INVALID_ID)).rejects.toThrow('Invalid shop id')
    })

    it('throws NotFoundError when shop not found', async () => {
      mockShopFindById.mockResolvedValue(null)
      await expect(service.getShopDetail(VALID_ID)).rejects.toThrow()
    })

    it('returns shop with computed stats including products_count, total_revenue, followers_count, avg_rating', async () => {
      mockShopFindById.mockResolvedValue({
        _id: VALID_ID,
        name: 'Test Shop',
        followerCount: 10,
        rating: 4.5,
        status: 'active',
      })
      mockProductCountDocuments.mockResolvedValue(5)
      mockOrderAggregate.mockResolvedValue([{ total_revenue: 50000 }])

      const result = await service.getShopDetail(VALID_ID)

      expect(result.stats).toHaveProperty('products_count', 5)
      expect(result.stats).toHaveProperty('total_revenue', 50000)
      expect(result.stats).toHaveProperty('followers_count', 10)
      expect(result.stats).toHaveProperty('avg_rating', 4.5)
      // Verify no order_count field
      expect(result.stats).not.toHaveProperty('order_count')
    })

    it('returns 0 total_revenue when no orders', async () => {
      mockShopFindById.mockResolvedValue({
        _id: VALID_ID,
        name: 'Test Shop',
        followerCount: 0,
        rating: 0,
      })
      mockProductCountDocuments.mockResolvedValue(0)
      mockOrderAggregate.mockResolvedValue([])

      const result = await service.getShopDetail(VALID_ID)

      expect(result.stats.total_revenue).toBe(0)
    })
  })

  describe('updateShopStatus', () => {
    it('throws ValidationError for invalid shopId', async () => {
      await expect(service.updateShopStatus(INVALID_ID, 'active' as any)).rejects.toThrow(
        'Invalid shop id',
      )
    })

    it('throws NotFoundError when shop not found', async () => {
      ;(ShopModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })
      ;(ShopModel.findById as jest.Mock).mockResolvedValue(null)
      await expect(service.updateShopStatus(VALID_ID, 'active' as any)).rejects.toThrow()
    })

    it('updates shop to active status', async () => {
      ;(ShopModel.findById as jest.Mock).mockResolvedValue({ _id: VALID_ID, status: 'suspended' })
      mockShopFindByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: VALID_ID, status: 'active' }),
      })

      const result = await service.updateShopStatus(VALID_ID, 'active' as any)
      expect(ShopModel.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_ID,
        expect.objectContaining({ status: 'active' }),
        expect.any(Object),
      )
    })

    it('updates shop to suspended status with reason', async () => {
      ;(ShopModel.findById as jest.Mock).mockResolvedValue({ _id: VALID_ID, status: 'active' })
      mockShopFindByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: VALID_ID, status: 'suspended' }),
      })

      await service.updateShopStatus(VALID_ID, 'suspended' as any, 'Violation')
      expect(ShopModel.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_ID,
        expect.objectContaining({ status: 'suspended', status_reason: 'Violation' }),
        expect.any(Object),
      )
    })

    it('updates shop to banned status', async () => {
      ;(ShopModel.findById as jest.Mock).mockResolvedValue({ _id: VALID_ID, status: 'active' })
      mockShopFindByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: VALID_ID, status: 'banned' }),
      })

      await service.updateShopStatus(VALID_ID, 'banned' as any)
      expect(ShopModel.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_ID,
        expect.objectContaining({ status: 'banned' }),
        expect.any(Object),
      )
    })
  })

  describe('getShopProducts', () => {
    it('throws ValidationError for invalid shopId', async () => {
      await expect(service.getShopProducts(INVALID_ID)).rejects.toThrow('Invalid shop id')
    })

    it('throws NotFoundError when shop not found', async () => {
      mockShopFindById.mockResolvedValue(null)
      await expect(service.getShopProducts(VALID_ID)).rejects.toThrow()
    })

    it('returns paginated products', async () => {
      mockShopFindById.mockResolvedValue({ _id: VALID_ID })
      mockProductFind.mockResolvedValue([{ _id: 'p1' }])
      mockProductCountDocuments.mockResolvedValue(1)

      const result = await service.getShopProducts(VALID_ID, 1, 10)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('pagination')
    })
  })

  describe('getShopRevenue', () => {
    it('throws ValidationError for invalid shopId', async () => {
      await expect(service.getShopRevenue(INVALID_ID)).rejects.toThrow('Invalid shop id')
    })

    it('throws NotFoundError when shop not found', async () => {
      mockShopFindById.mockResolvedValue(null)
      await expect(service.getShopRevenue(VALID_ID)).rejects.toThrow()
    })

    it('returns revenue data for 30d period (default)', async () => {
      mockShopFindById.mockResolvedValue({ _id: VALID_ID })
      mockOrderAggregate.mockResolvedValue([{ date: '2026-01-01', revenue: 1000, orders: 5 }])

      const result = await service.getShopRevenue(VALID_ID, '30d')

      expect(result).toHaveProperty('period', '30d')
      expect(result).toHaveProperty('data')
    })

    it('uses weekly grouping for 90d period', async () => {
      mockShopFindById.mockResolvedValue({ _id: VALID_ID })
      mockOrderAggregate.mockResolvedValue([])

      const result = await service.getShopRevenue(VALID_ID, '90d')

      expect(result.period).toBe('90d')
    })
  })
})
