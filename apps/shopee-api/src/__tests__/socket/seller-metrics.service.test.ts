/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

jest.mock('@database/models/purchase.model', () => ({
  PurchaseModel: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}))

jest.mock('@database/models/question.model', () => ({
  QuestionModel: {
    countDocuments: jest.fn(),
  },
}))

jest.mock('../../socket/utils/seller-emit', () => ({
  emitSellerMetricsUpdate: jest.fn(),
}))

jest.mock('../../socket/managers/presence.manager', () => ({
  getOnlineUserCount: jest.fn().mockReturnValue(0),
}))

jest.mock('../../socket/socket.init', () => ({
  getIO: jest.fn(),
}))

jest.mock('@constants/purchase', () => ({
  STATUS_PURCHASE: { WAIT_FOR_CONFIRMATION: 1 },
}))

describe('Seller Metrics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSellerMetrics', () => {
    it('should return correct metrics from DB queries', async () => {
      jest.resetModules()
      const { PurchaseModel } = await import('@database/models/purchase.model')
      const { QuestionModel } = await import('@database/models/question.model')

      const mockPurchases = [
        { price: 100000, buy_count: 2 },
        { price: 50000, buy_count: 3 },
        { price: 200000, buy_count: 1 },
      ]

      ;(PurchaseModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPurchases),
      })
      ;(PurchaseModel.countDocuments as jest.Mock).mockResolvedValue(5)
      ;(QuestionModel.countDocuments as jest.Mock).mockResolvedValue(8)

      const { getSellerMetrics } = await import('../../socket/utils/seller-metrics.service')
      const result = await getSellerMetrics()

      expect(result).toEqual({
        today_orders: 3,
        today_revenue: 100000 * 2 + 50000 * 3 + 200000 * 1,
        pending_orders: 5,
        pending_qa: 8,
        active_users: 0,
        orders_per_hour: expect.any(Number),
      })

      expect(PurchaseModel.find).toHaveBeenCalledWith({
        status: { $gte: 1 },
        createdAt: expect.objectContaining({ $gte: expect.any(Date) }),
      })
      expect(PurchaseModel.countDocuments).toHaveBeenCalledWith({
        status: 1,
      })
      expect(QuestionModel.countDocuments).toHaveBeenCalledWith({
        $or: [{ answers: { $size: 0 } }, { answers: { $exists: false } }],
      })
    })

    it('should return zeros on error', async () => {
      jest.resetModules()
      const { PurchaseModel } = await import('@database/models/purchase.model')
      const { Logger } = await import('@utils/logger')

      ;(PurchaseModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      })

      const { getSellerMetrics } = await import('../../socket/utils/seller-metrics.service')
      const result = await getSellerMetrics()

      expect(result).toEqual({
        today_orders: 0,
        today_revenue: 0,
        pending_orders: 0,
        pending_qa: 0,
        active_users: 0,
        orders_per_hour: 0,
      })
      expect(Logger.apiError).toHaveBeenCalledWith('Failed to get seller metrics', {
        error: 'Database error',
      })
    })
  })

  describe('emitCurrentSellerMetrics', () => {
    it('should call getSellerMetrics and emitSellerMetricsUpdate', async () => {
      jest.resetModules()
      const { PurchaseModel } = await import('@database/models/purchase.model')
      const { QuestionModel } = await import('@database/models/question.model')
      const { emitSellerMetricsUpdate } = await import('../../socket/utils/seller-emit')
      const { Logger } = await import('@utils/logger')

      const mockPurchases = [{ price: 150000, buy_count: 2 }]

      ;(PurchaseModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPurchases),
      })
      ;(PurchaseModel.countDocuments as jest.Mock).mockResolvedValue(3)
      ;(QuestionModel.countDocuments as jest.Mock).mockResolvedValue(2)

      const { emitCurrentSellerMetrics } = await import('../../socket/utils/seller-metrics.service')
      await emitCurrentSellerMetrics('seller-123')

      expect(emitSellerMetricsUpdate).toHaveBeenCalledWith('seller-123', {
        today_orders: 1,
        today_revenue: 300000,
        pending_orders: 3,
        pending_qa: 2,
        active_users: 0,
        orders_per_hour: expect.any(Number),
      })
      expect(Logger.apiInfo).toHaveBeenCalledWith('Seller metrics emitted with real data', {
        sellerId: 'seller-123',
        metrics: {
          today_orders: 1,
          today_revenue: 300000,
          pending_orders: 3,
          pending_qa: 2,
          active_users: 0,
          orders_per_hour: expect.any(Number),
        },
      })
    })

    it('should handle error gracefully', async () => {
      jest.resetModules()
      const { PurchaseModel } = await import('@database/models/purchase.model')
      const { emitSellerMetricsUpdate } = await import('../../socket/utils/seller-emit')

      ;(PurchaseModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Connection failed')),
      })

      const { emitCurrentSellerMetrics } = await import('../../socket/utils/seller-metrics.service')

      await expect(emitCurrentSellerMetrics('seller-error')).resolves.toBeUndefined()

      expect(emitSellerMetricsUpdate).toHaveBeenCalledWith('seller-error', {
        today_orders: 0,
        today_revenue: 0,
        pending_orders: 0,
        pending_qa: 0,
        active_users: 0,
        orders_per_hour: 0,
      })
    })
  })
})

