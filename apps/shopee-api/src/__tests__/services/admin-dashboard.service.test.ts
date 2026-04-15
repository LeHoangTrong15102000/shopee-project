/// <reference types="jest" />
jest.mock('@database/models/order.model', () => ({
  OrderModel: {
    aggregate: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockResolvedValue(0),
  },
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPING: 'shipping',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    RETURNED: 'returned',
  },
}))

jest.mock('@database/models/product.model', () => ({
  ProductModel: {
    aggregate: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockResolvedValue(0),
  },
}))

jest.mock('@database/models/user.model', () => ({
  UserModel: {
    aggregate: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockResolvedValue(0),
  },
}))

jest.mock('@database/models/review.model', () => ({
  ReviewModel: {
    aggregate: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockResolvedValue(0),
  },
}))

jest.mock('@database/models/category.model', () => ({
  CategoryModel: {},
}))

jest.mock('../../socket/managers/presence.manager', () => ({
  getOnlineUserCount: jest.fn().mockReturnValue(5),
}))

jest.mock('@schemas/admin-common.schema', () => ({
  getDateRangeFromPeriod: jest
    .fn()
    .mockReturnValue({ start: new Date('2026-01-01'), end: new Date('2026-03-16') }),
  getGroupingForPeriod: jest.fn().mockReturnValue({ format: '%Y-%m-%d' }),
}))

import { AdminDashboardService } from '@services/admin-dashboard.service'
import { OrderModel } from '@database/models/order.model'
import { ProductModel } from '@database/models/product.model'
import { UserModel } from '@database/models/user.model'
import { ReviewModel } from '@database/models/review.model'

describe('AdminDashboardService', () => {
  let service: AdminDashboardService

  beforeEach(() => {
    service = new AdminDashboardService()
    jest.clearAllMocks()
  })

  describe('getOverview', () => {
    it('should return structured overview data', async () => {
      const result = await service.getOverview()

      expect(result).toHaveProperty('revenue')
      expect(result).toHaveProperty('orders')
      expect(result).toHaveProperty('users')
      expect(result).toHaveProperty('products')
      expect(result).toHaveProperty('reviews')
      expect(OrderModel.aggregate).toHaveBeenCalled()
      expect(OrderModel.countDocuments).toHaveBeenCalled()
      expect(UserModel.countDocuments).toHaveBeenCalled()
      expect(ProductModel.countDocuments).toHaveBeenCalled()
      expect(ReviewModel.countDocuments).toHaveBeenCalled()
    })
  })

  describe('getRevenue', () => {
    it('should call OrderModel.aggregate twice for current and previous period', async () => {
      const result = await service.getRevenue()

      expect(result).toHaveProperty('total_revenue')
      expect(result).toHaveProperty('growth_rate')
      expect(result).toHaveProperty('data')
      expect(OrderModel.aggregate).toHaveBeenCalledTimes(2)
    })
  })

  describe('getRevenueByCategory', () => {
    it('should call OrderModel.aggregate and return category revenue data', async () => {
      ;(OrderModel.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'cat1', category_name: 'Electronics', revenue: 1000, order_count: 5 },
      ])

      const result = await service.getRevenueByCategory()

      expect(OrderModel.aggregate).toHaveBeenCalled()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getRevenueByProduct', () => {
    it('should call OrderModel.aggregate and return product revenue data', async () => {
      const result = await service.getRevenueByProduct()

      expect(OrderModel.aggregate).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('getOrderTrend', () => {
    it('should call OrderModel.aggregate and return order trend data', async () => {
      const result = await service.getOrderTrend()

      expect(OrderModel.aggregate).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('getUserGrowth', () => {
    it('should call UserModel.aggregate and return user growth data', async () => {
      const result = await service.getUserGrowth()

      expect(UserModel.aggregate).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('getTopBuyers', () => {
    it('should call OrderModel.aggregate and return top buyers', async () => {
      const result = await service.getTopBuyers()

      expect(OrderModel.aggregate).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('getTopSelling', () => {
    it('should call OrderModel.aggregate and return top selling products', async () => {
      const result = await service.getTopSelling()

      expect(OrderModel.aggregate).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('getTopViewed', () => {
    it('should call ProductModel.aggregate and return top viewed products', async () => {
      const result = await service.getTopViewed()

      expect(ProductModel.aggregate).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('getTopRated', () => {
    it('should call ReviewModel.aggregate and return top rated products', async () => {
      const result = await service.getTopRated()

      expect(ReviewModel.aggregate).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('getStatsByCategory', () => {
    it('should call ProductModel.aggregate and return category stats', async () => {
      const result = await service.getStatsByCategory()

      expect(ProductModel.aggregate).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })
})
