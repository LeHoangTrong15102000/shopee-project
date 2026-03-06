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

jest.mock('../../socket/utils/emit', () => ({
  emitToUser: jest.fn(),
}))

import { SOCKET_CONFIG } from '@constants/socket'
import { SocketEvent } from '../../@types/socket.type'

describe('Emit Utils', () => {
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

  /** Re-acquire mocks from freshly imported modules after resetModules */
  const setupMock = async () => {
    jest.resetModules()
    setupMockIO()
    const { getIORequired } = await import('../../socket/socket.init')
    ;(getIORequired as jest.Mock).mockReturnValue(mockIO)
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('product-emit', () => {
    it('emitPriceUpdate should emit PRICE_UPDATED to product room', async () => {
      await setupMock()
      const { emitPriceUpdate } = await import('../../socket/utils/product-emit')

      emitPriceUpdate('product-123', 100, 80, 120, 100)

      const expectedRoom = `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}product-123`
      expect(mockIO.to).toHaveBeenCalledWith(expectedRoom)
      expect(mockEmit).toHaveBeenCalledWith(SocketEvent.PRICE_UPDATED, {
        product_id: 'product-123',
        old_price: 100,
        new_price: 80,
        old_price_before_discount: 120,
        new_price_before_discount: 100,
      })
    })

    it('emitPriceAlert should emit to user via emitToUser', async () => {
      await setupMock()
      const { emitToUser } = await import('../../socket/utils/emit')
      const { emitPriceAlert } = await import('../../socket/utils/product-emit')

      const alertPayload = {
        alert_id: 'alert-1',
        product_id: 'product-123',
        product_name: 'Test Product',
        target_price: 90,
        new_price: 80,
      }

      emitPriceAlert('user-456', alertPayload)

      expect(emitToUser).toHaveBeenCalledWith('user-456', SocketEvent.PRICE_ALERT_TRIGGERED, alertPayload)
    })
  })

  describe('order-emit', () => {
    it('emitOrderStatusUpdate should emit ORDER_STATUS_UPDATED to order room', async () => {
      jest.resetModules()
      setupMockIO()
      const { getIORequired } = await import('../../socket/socket.init')
      ;(getIORequired as jest.Mock).mockReturnValue(mockIO)

      jest.mock('@database/models/notification.model', () => ({ NotificationModel: { create: jest.fn() } }))
      jest.mock('@database/models/purchase.model', () => ({
        PurchaseModel: { findById: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn() }) }) },
      }))

      const { emitOrderStatusUpdate } = await import('../../socket/utils/order-emit')

      emitOrderStatusUpdate('order-789', 'pending', 'confirmed', 'Order confirmed')

      const expectedRoom = `${SOCKET_CONFIG.ROOM_PREFIX.ORDER}order-789`
      expect(mockIO.to).toHaveBeenCalledWith(expectedRoom)
      expect(mockEmit).toHaveBeenCalledWith(
        SocketEvent.ORDER_STATUS_UPDATED,
        expect.objectContaining({
          order_id: 'order-789',
          old_status: 'pending',
          new_status: 'confirmed',
          message: 'Order confirmed',
        })
      )
    })
  })

  describe('review-emit', () => {
    it('emitNewReview should emit NEW_REVIEW to product room', async () => {
      await setupMock()
      const { emitNewReview } = await import('../../socket/utils/review-emit')

      const review = {
        _id: 'review-1',
        user: { name: 'Test User', avatar: 'avatar.jpg' },
        rating: 5,
        comment: 'Great product!',
        images: [],
        createdAt: '2024-01-01T00:00:00.000Z',
      }

      emitNewReview('product-123', review)

      const expectedRoom = `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}product-123`
      expect(mockIO.to).toHaveBeenCalledWith(expectedRoom)
      expect(mockEmit).toHaveBeenCalledWith(SocketEvent.NEW_REVIEW, {
        product_id: 'product-123',
        review,
      })
    })

    it('emitNewReview should exclude sender socket when provided', async () => {
      await setupMock()
      const { emitNewReview } = await import('../../socket/utils/review-emit')

      const review = {
        _id: 'review-2',
        user: { name: 'Test User' },
        rating: 4,
        comment: 'Good',
        images: [],
        createdAt: '2024-01-01T00:00:00.000Z',
      }

      emitNewReview('product-456', review, 'sender-socket-id')

      expect(mockExcept).toHaveBeenCalledWith('sender-socket-id')
    })

    it('emitReviewLiked should emit REVIEW_LIKED to product room', async () => {
      await setupMock()
      const { emitReviewLiked } = await import('../../socket/utils/review-emit')

      emitReviewLiked('product-123', 'review-1', 10)

      const expectedRoom = `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}product-123`
      expect(mockIO.to).toHaveBeenCalledWith(expectedRoom)
      expect(mockEmit).toHaveBeenCalledWith(SocketEvent.REVIEW_LIKED, {
        product_id: 'product-123',
        review_id: 'review-1',
        helpful_count: 10,
      })
    })
  })
})

