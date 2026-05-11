/// <reference types="jest" />

const mockConvFindById = jest.fn()

jest.mock('@database/models/shop-conversation.model', () => ({
  ShopConversationModel: {
    findById: jest.fn(() => ({ lean: mockConvFindById })),
  },
}))

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn() },
}))

import { createMockSocket } from './setup'
import { registerShopChatHandlers } from '../../socket/handlers/shop-chat.handler'

const VALID_CONV_ID = '507f1f77bcf86cd799439011'
const USER_ID = 'test-user-id'

describe('shop-chat.handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('registerShopChatHandlers', () => {
    it('registers shop_chat:join, shop_chat:leave, typing, and message:read listeners', () => {
      const socket = createMockSocket() as any
      registerShopChatHandlers(socket)

      const registeredEvents = socket.on.mock.calls.map((c: any) => c[0])
      expect(registeredEvents).toContain('shop_chat:join')
      expect(registeredEvents).toContain('shop_chat:leave')
      expect(registeredEvents).toContain('typing')
      expect(registeredEvents).toContain('message:read')
    })
  })

  describe('shop_chat:join', () => {
    it('joins room when conversation belongs to user', async () => {
      const socket = createMockSocket({ user: { id: USER_ID, email: 'test@test.com', roles: ['User'] } }) as any
      registerShopChatHandlers(socket)

      mockConvFindById.mockResolvedValue({
        _id: VALID_CONV_ID,
        userId: { toString: () => USER_ID },
      })

      const joinHandler = socket.on.mock.calls.find((c: any) => c[0] === 'shop_chat:join')[1]
      await joinHandler({ conversationId: VALID_CONV_ID })

      expect(socket.join).toHaveBeenCalledWith(`shop_conv:${VALID_CONV_ID}`)
    })

    it('does not join room when conversation belongs to different user', async () => {
      const socket = createMockSocket({ user: { id: USER_ID, email: 'test@test.com', roles: ['User'] } }) as any
      registerShopChatHandlers(socket)

      mockConvFindById.mockResolvedValue({
        _id: VALID_CONV_ID,
        userId: { toString: () => 'different-user-id' },
      })

      const joinHandler = socket.on.mock.calls.find((c: any) => c[0] === 'shop_chat:join')[1]
      await joinHandler({ conversationId: VALID_CONV_ID })

      expect(socket.join).not.toHaveBeenCalled()
    })

    it('does not join room when conversation not found', async () => {
      const socket = createMockSocket() as any
      registerShopChatHandlers(socket)

      mockConvFindById.mockResolvedValue(null)

      const joinHandler = socket.on.mock.calls.find((c: any) => c[0] === 'shop_chat:join')[1]
      await joinHandler({ conversationId: VALID_CONV_ID })

      expect(socket.join).not.toHaveBeenCalled()
    })

    it('does nothing when conversationId is missing', async () => {
      const socket = createMockSocket() as any
      registerShopChatHandlers(socket)

      const joinHandler = socket.on.mock.calls.find((c: any) => c[0] === 'shop_chat:join')[1]
      await joinHandler({})

      expect(socket.join).not.toHaveBeenCalled()
    })
  })

  describe('shop_chat:leave', () => {
    it('leaves the conversation room', () => {
      const socket = createMockSocket() as any
      registerShopChatHandlers(socket)

      const leaveHandler = socket.on.mock.calls.find((c: any) => c[0] === 'shop_chat:leave')[1]
      leaveHandler({ conversationId: VALID_CONV_ID })

      expect(socket.leave).toHaveBeenCalledWith(`shop_conv:${VALID_CONV_ID}`)
    })

    it('does nothing when conversationId is missing', () => {
      const socket = createMockSocket() as any
      registerShopChatHandlers(socket)

      const leaveHandler = socket.on.mock.calls.find((c: any) => c[0] === 'shop_chat:leave')[1]
      leaveHandler({})

      expect(socket.leave).not.toHaveBeenCalled()
    })
  })

  describe('typing indicator', () => {
    it('broadcasts typing event to room using socket.to().emit pattern', () => {
      const socket = createMockSocket({ user: { id: USER_ID, email: 'test@test.com', roles: ['User'] } }) as any
      registerShopChatHandlers(socket)

      const typingHandler = socket.on.mock.calls.find((c: any) => c[0] === 'typing')[1]
      typingHandler({ conversationId: VALID_CONV_ID })

      expect(socket.to).toHaveBeenCalledWith(`shop_conv:${VALID_CONV_ID}`)
      // socket.to() returns an object with emit — verify emit was called
      const toResult = socket.to.mock.results[0].value
      expect(toResult.emit).toHaveBeenCalledWith(
        'typing',
        expect.objectContaining({ conversationId: VALID_CONV_ID, senderId: USER_ID }),
      )
    })

    it('does nothing when conversationId is missing', () => {
      const socket = createMockSocket() as any
      registerShopChatHandlers(socket)

      const typingHandler = socket.on.mock.calls.find((c: any) => c[0] === 'typing')[1]
      typingHandler({})

      expect(socket.to).not.toHaveBeenCalled()
    })
  })
})
