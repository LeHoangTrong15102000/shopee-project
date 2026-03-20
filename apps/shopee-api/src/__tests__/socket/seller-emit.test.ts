/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn(),
}))

const ROOM_PREFIX_SELLER = 'seller:'
const SOCKET_EVENT_SELLER_ORDER_NOTIFICATION = 'seller_order_notification'
const SOCKET_EVENT_SELLER_METRICS_UPDATE = 'seller_metrics_update'
const SOCKET_EVENT_SELLER_QA_NOTIFICATION = 'seller_qa_notification'

describe('Seller Emit Utils', () => {
  let mockIO: any
  let mockEmit: jest.Mock

  const setupMockIO = () => {
    mockEmit = jest.fn()
    mockIO = {
      to: jest.fn().mockReturnValue({
        emit: mockEmit,
      }),
    }
  }

  const setupMock = async (throwError = false) => {
    jest.resetModules()
    setupMockIO()
    const { getIORequired } = await import('../../socket/socket.init')
    if (throwError) {
      ;(getIORequired as jest.Mock).mockImplementation(() => {
        throw new Error('IO not initialized')
      })
    } else {
      ;(getIORequired as jest.Mock).mockReturnValue(mockIO)
    }
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('emitSellerOrderNotification', () => {
    it('should emit to correct seller room', async () => {
      await setupMock()
      const { emitSellerOrderNotification } = await import('../../socket/utils/seller-emit')
      const sellerId = 'seller-123'
      const notification = {
        order_id: 'order-456',
        status: 'pending',
        product_names: ['Product A'],
        total: 100000,
        timestamp: new Date().toISOString(),
      }

      emitSellerOrderNotification(sellerId, notification)

      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_SELLER}${sellerId}`)
      expect(mockEmit).toHaveBeenCalledWith(SOCKET_EVENT_SELLER_ORDER_NOTIFICATION, notification)
    })

    it('should handle error gracefully', async () => {
      await setupMock(true)
      const { Logger } = await import('@utils/logger')
      const { emitSellerOrderNotification } = await import('../../socket/utils/seller-emit')
      const notification = {
        order_id: 'order-err',
        status: 'pending',
        product_names: ['Product B'],
        total: 50000,
        timestamp: new Date().toISOString(),
      }

      expect(() => emitSellerOrderNotification('seller-error', notification)).not.toThrow()
      expect(mockIO.to).not.toHaveBeenCalled()
      expect(Logger.apiError).toHaveBeenCalled()
    })
  })

  describe('emitSellerMetricsUpdate', () => {
    it('should emit metrics to seller room', async () => {
      await setupMock()
      const { emitSellerMetricsUpdate } = await import('../../socket/utils/seller-emit')
      const sellerId = 'seller-789'
      const metrics = {
        today_orders: 10,
        today_revenue: 5000000,
        pending_orders: 3,
        pending_qa: 5,
        active_users: 42,
        orders_per_hour: 8,
      }

      emitSellerMetricsUpdate(sellerId, metrics)

      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_SELLER}${sellerId}`)
      expect(mockEmit).toHaveBeenCalledWith(SOCKET_EVENT_SELLER_METRICS_UPDATE, metrics)
    })

    it('should handle error gracefully', async () => {
      await setupMock(true)
      const { Logger } = await import('@utils/logger')
      const { emitSellerMetricsUpdate } = await import('../../socket/utils/seller-emit')
      const metrics = {
        today_orders: 0,
        today_revenue: 0,
        pending_orders: 0,
        pending_qa: 0,
        active_users: 0,
        orders_per_hour: 0,
      }

      expect(() => emitSellerMetricsUpdate('seller-error', metrics)).not.toThrow()
      expect(mockIO.to).not.toHaveBeenCalled()
      expect(Logger.apiError).toHaveBeenCalled()
    })
  })

  describe('emitSellerQANotification', () => {
    it('should emit QA notification to seller room', async () => {
      await setupMock()
      const { emitSellerQANotification } = await import('../../socket/utils/seller-emit')
      const sellerId = 'seller-qa-123'
      const notification = {
        product_id: 'product-abc',
        product_name: 'Test Product',
        question_id: 'question-xyz',
        question_preview: 'Is this product available?',
        user_name: 'John Doe',
        timestamp: new Date().toISOString(),
      }

      emitSellerQANotification(sellerId, notification)

      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_SELLER}${sellerId}`)
      expect(mockEmit).toHaveBeenCalledWith(SOCKET_EVENT_SELLER_QA_NOTIFICATION, notification)
    })

    it('should handle error gracefully', async () => {
      await setupMock(true)
      const { Logger } = await import('@utils/logger')
      const { emitSellerQANotification } = await import('../../socket/utils/seller-emit')
      const notification = {
        product_id: 'product-err',
        product_name: 'Error Product',
        question_id: 'question-err',
        question_preview: 'Error question?',
        user_name: 'Error User',
        timestamp: new Date().toISOString(),
      }

      expect(() => emitSellerQANotification('seller-error', notification)).not.toThrow()
      expect(mockIO.to).not.toHaveBeenCalled()
      expect(Logger.apiError).toHaveBeenCalled()
    })
  })
})

