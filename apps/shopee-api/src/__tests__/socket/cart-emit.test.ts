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

const ROOM_PREFIX_CART = 'cart:'
const SOCKET_EVENT_CART_UPDATED = 'cart_updated'

describe('Cart Emit Utils', () => {
  let mockIO: any
  let mockEmit: jest.Mock
  let mockExcept: jest.Mock

  const setupMockIO = () => {
    mockEmit = jest.fn()
    mockExcept = jest.fn().mockReturnValue({ emit: mockEmit })
    mockIO = {
      to: jest.fn().mockReturnValue({
        emit: mockEmit,
        except: mockExcept,
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

  describe('emitCartUpdate', () => {
    it('should emit CART_UPDATED to correct cart room', async () => {
      await setupMock()
      const { emitCartUpdate } = await import('../../socket/utils/cart-emit')
      const userId = 'user-123'

      emitCartUpdate(userId, 'add', 'product-456')

      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_CART}${userId}`)
      expect(mockEmit).toHaveBeenCalledWith(
        SOCKET_EVENT_CART_UPDATED,
        expect.objectContaining({
          user_id: userId,
          action: 'add',
          product_id: 'product-456',
        }),
      )
    })

    it('should include correct payload with action and product_id', async () => {
      await setupMock()
      const { emitCartUpdate } = await import('../../socket/utils/cart-emit')
      const userId = 'user-789'
      const productId = 'product-abc'

      emitCartUpdate(userId, 'update', productId)

      expect(mockEmit).toHaveBeenCalledWith(
        SOCKET_EVENT_CART_UPDATED,
        expect.objectContaining({
          user_id: userId,
          action: 'update',
          product_id: productId,
          timestamp: expect.any(String),
        }),
      )
    })

    it('should use .except() when excludeSocketId is provided', async () => {
      await setupMock()
      const { emitCartUpdate } = await import('../../socket/utils/cart-emit')
      const userId = 'user-exclude'
      const excludeSocketId = 'socket-to-exclude'

      emitCartUpdate(userId, 'delete', 'product-xyz', excludeSocketId)

      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_CART}${userId}`)
      expect(mockExcept).toHaveBeenCalledWith(excludeSocketId)
      expect(mockEmit).toHaveBeenCalledWith(
        SOCKET_EVENT_CART_UPDATED,
        expect.objectContaining({
          user_id: userId,
          action: 'delete',
          product_id: 'product-xyz',
        }),
      )
    })

    it('should not use .except() when excludeSocketId is not provided', async () => {
      await setupMock()
      const { emitCartUpdate } = await import('../../socket/utils/cart-emit')
      const userId = 'user-no-exclude'

      emitCartUpdate(userId, 'buy', 'product-buy')

      expect(mockIO.to).toHaveBeenCalledWith(`${ROOM_PREFIX_CART}${userId}`)
      expect(mockExcept).not.toHaveBeenCalled()
      expect(mockEmit).toHaveBeenCalledWith(
        SOCKET_EVENT_CART_UPDATED,
        expect.objectContaining({
          user_id: userId,
          action: 'buy',
          product_id: 'product-buy',
        }),
      )
    })

    it('should handle error gracefully when getIORequired throws', async () => {
      await setupMock(true)
      const { emitCartUpdate } = await import('../../socket/utils/cart-emit')

      expect(() => emitCartUpdate('user-error', 'add', 'product-err')).not.toThrow()
      expect(mockIO.to).not.toHaveBeenCalled()
    })
  })
})
