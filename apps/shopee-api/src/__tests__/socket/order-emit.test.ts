/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn(), apiWarn: jest.fn() },
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn(),
}))

jest.mock('@database/models/purchase.model', () => ({
  PurchaseModel: { findById: jest.fn() },
}))

jest.mock('@database/models/user.model', () => ({
  UserModel: { find: jest.fn() },
}))

jest.mock('../../socket/handlers/notification.handler', () => ({
  pushNotification: jest.fn(),
}))

jest.mock('../../socket/utils/seller-metrics.service', () => ({
  emitCurrentSellerMetrics: jest.fn(),
}))

describe('Order Emit Utils', () => {
  let mockIO: any
  let mockEmit: jest.Mock

  const setupMock = async (throwError = false) => {
    jest.resetModules()
    mockEmit = jest.fn()
    mockIO = {
      to: jest.fn().mockReturnValue({ emit: mockEmit }),
      sockets: { adapter: { rooms: new Map() } },
    }
    const { getIORequired } = await import('../../socket/socket.init')
    if (throwError) {
      ;(getIORequired as jest.Mock).mockImplementation(() => {
        throw new Error('IO not initialized')
      })
    } else {
      ;(getIORequired as jest.Mock).mockReturnValue(mockIO)
    }
  }

  afterEach(() => jest.clearAllMocks())

  describe('emitOrderStatusUpdate', () => {
    it('should emit order status update to room', async () => {
      await setupMock()
      const { PurchaseModel } = await import('@database/models/purchase.model')
      ;(PurchaseModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ user: 'user1' }) }),
      })
      const { emitOrderStatusUpdate } = await import('../../socket/utils/order-emit')
      emitOrderStatusUpdate('order1', 'pending', 'confirmed', 'Order confirmed')
      expect(mockIO.to).toHaveBeenCalled()
      expect(mockEmit).toHaveBeenCalled()
    })

    it('should handle IO error gracefully', async () => {
      await setupMock(true)
      const { emitOrderStatusUpdate } = await import('../../socket/utils/order-emit')
      expect(() => emitOrderStatusUpdate('order1', 'pending', 'confirmed')).not.toThrow()
    })
  })

  describe('emitAdminNewOrderNotification', () => {
    it('should emit to admin users', async () => {
      await setupMock()
      const { UserModel } = await import('@database/models/user.model')
      ;(UserModel.find as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: 'admin1' }]) }),
      })
      const { emitAdminNewOrderNotification } = await import('../../socket/utils/order-emit')
      emitAdminNewOrderNotification({
        order_id: 'o1',
        buyer_name: 'John',
        items_count: 2,
        total_amount: 100000,
        created_at: new Date().toISOString(),
      })
      // Flush microtask queue so fire-and-forget async completes
      await new Promise(process.nextTick)
      expect(mockIO.to).toHaveBeenCalled()
      expect(mockEmit).toHaveBeenCalled()
    })
  })
})
