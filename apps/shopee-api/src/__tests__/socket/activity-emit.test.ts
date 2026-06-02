/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

jest.mock('@constants/socket', () => ({
  SOCKET_CONFIG: {
    ROOM_PREFIX: { PRODUCT: 'product:' },
  },
}))

jest.mock('../../socket/socket.init', () => ({
  getIORequired: jest.fn(),
}))

jest.mock('../../socket/managers/activity-feed.manager', () => ({
  addActivity: jest.fn(),
  getRecentActivities: jest.fn(),
}))

const ROOM_PREFIX_PRODUCT = 'product:'
const SOCKET_EVENT_ACTIVITY_EVENT = 'activity_event'
const SOCKET_EVENT_ACTIVITY_BUFFER = 'activity_buffer'

describe('Activity Emit Utils', () => {
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

  describe('emitActivityEvent', () => {
    it('should emit when addActivity returns true', async () => {
      await setupMock()
      const { addActivity } = await import('../../socket/managers/activity-feed.manager')
      ;(addActivity as jest.Mock).mockResolvedValue(true)
      const { emitActivityEvent } = await import('../../socket/utils/activity-emit')

      const productId = 'product-123'
      const type = 'purchase'
      const message = 'Someone just bought this product'

      await emitActivityEvent(productId, type, message)

      expect(addActivity).toHaveBeenCalledWith(
        productId,
        expect.objectContaining({
          product_id: productId,
          type,
          message,
          timestamp: expect.any(String),
        }),
      )
      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_PRODUCT}${productId}`)
      expect(mockEmit).toHaveBeenCalledWith(
        SOCKET_EVENT_ACTIVITY_EVENT,
        expect.objectContaining({
          product_id: productId,
          type,
          message,
          timestamp: expect.any(String),
        }),
      )
    })

    it('should NOT emit when addActivity returns false (throttled)', async () => {
      await setupMock()
      const { addActivity } = await import('../../socket/managers/activity-feed.manager')
      ;(addActivity as jest.Mock).mockResolvedValue(false)
      const { emitActivityEvent } = await import('../../socket/utils/activity-emit')

      const productId = 'product-456'
      const type = 'review'
      const message = 'Someone just reviewed this product'

      await emitActivityEvent(productId, type, message)

      expect(addActivity).toHaveBeenCalled()
      expect(mockIO.to).not.toHaveBeenCalled()
      expect(mockEmit).not.toHaveBeenCalled()
    })

    it('should handle error gracefully', async () => {
      await setupMock()
      const { addActivity } = await import('../../socket/managers/activity-feed.manager')
      ;(addActivity as jest.Mock).mockImplementation(() => {
        throw new Error('Activity manager error')
      })
      const { emitActivityEvent } = await import('../../socket/utils/activity-emit')

      await expect(emitActivityEvent('product-err', 'purchase', 'test')).resolves.not.toThrow()
      expect(mockIO.to).not.toHaveBeenCalled()
    })
  })

  describe('emitActivityBuffer', () => {
    it('should emit buffer to socket when activities exist', async () => {
      await setupMock()
      const { getRecentActivities } = await import('../../socket/managers/activity-feed.manager')
      const mockActivities = [
        {
          product_id: 'prod-1',
          type: 'purchase',
          message: 'Bought',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        {
          product_id: 'prod-1',
          type: 'review',
          message: 'Reviewed',
          timestamp: '2024-01-01T00:01:00.000Z',
        },
      ]
      ;(getRecentActivities as jest.Mock).mockReturnValue(mockActivities)
      const { emitActivityBuffer } = await import('../../socket/utils/activity-emit')

      const socketId = 'socket-abc'
      const productId = 'prod-1'

      emitActivityBuffer(socketId, productId)

      expect(getRecentActivities).toHaveBeenCalledWith(productId)
      expect(mockIO.to).toHaveBeenCalledWith(socketId)
      expect(mockEmit).toHaveBeenCalledWith(
        SOCKET_EVENT_ACTIVITY_BUFFER,
        expect.objectContaining({
          product_id: productId,
          activities: expect.arrayContaining([
            expect.objectContaining({ product_id: 'prod-1', type: 'purchase', message: 'Bought' }),
            expect.objectContaining({ product_id: 'prod-1', type: 'review', message: 'Reviewed' }),
          ]),
        }),
      )
    })

    it('should not emit when no activities', async () => {
      await setupMock()
      const { getRecentActivities } = await import('../../socket/managers/activity-feed.manager')
      ;(getRecentActivities as jest.Mock).mockReturnValue([])
      const { emitActivityBuffer } = await import('../../socket/utils/activity-emit')

      emitActivityBuffer('socket-xyz', 'prod-empty')

      expect(getRecentActivities).toHaveBeenCalledWith('prod-empty')
      expect(mockIO.to).not.toHaveBeenCalled()
      expect(mockEmit).not.toHaveBeenCalled()
    })

    it('should handle error gracefully', async () => {
      await setupMock()
      const { getRecentActivities } = await import('../../socket/managers/activity-feed.manager')
      ;(getRecentActivities as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to get activities')
      })
      const { emitActivityBuffer } = await import('../../socket/utils/activity-emit')

      expect(() => emitActivityBuffer('socket-err', 'prod-err')).not.toThrow()
      expect(mockIO.to).not.toHaveBeenCalled()
    })
  })
})
