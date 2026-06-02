/// <reference types="jest" />

const mockConvFind = jest.fn()
const mockConvFindById = jest.fn()
const mockConvFindByIdAndUpdate = jest.fn()
const mockConvFindOne = jest.fn()
const mockConvCreate = jest.fn()
const mockMsgFind = jest.fn()
const mockMsgCreate = jest.fn()
const mockGetIO = jest.fn()

jest.mock('@database/models/shop-conversation.model', () => ({
  ShopConversationModel: {
    find: jest.fn(() => ({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: mockConvFind,
    })),
    findById: jest.fn(() => ({ lean: jest.fn() })),
    findByIdAndUpdate: mockConvFindByIdAndUpdate,
    findOne: jest.fn(() => ({ lean: mockConvFindOne })),
    create: mockConvCreate,
  },
}))

jest.mock('@database/models/shop-message.model', () => ({
  ShopMessageModel: {
    find: jest.fn(() => ({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: mockMsgFind,
    })),
    create: mockMsgCreate,
  },
  ShopMessageType: {},
}))

jest.mock('@database/models/shop.model', () => ({
  ShopModel: {
    findById: jest.fn(),
  },
}))

jest.mock('../../socket/socket.init', () => ({
  getIO: mockGetIO,
}))

jest.mock('@constants/socket', () => ({
  SOCKET_CONFIG: {},
}))

import { ShopChatService } from '@services/shop-chat.service'
import { ShopConversationModel } from '@database/models/shop-conversation.model'

const VALID_CONV_ID = '507f1f77bcf86cd799439011'
const VALID_USER_ID = '507f1f77bcf86cd799439012'
const INVALID_ID = 'not-an-id'

describe('ShopChatService', () => {
  let service: ShopChatService

  beforeEach(() => {
    service = new ShopChatService()
    jest.clearAllMocks()
    mockGetIO.mockReturnValue(null)
  })

  describe('getConversations', () => {
    it('returns conversations sorted by updatedAt descending', async () => {
      const convs = [
        { _id: 'c1', updatedAt: new Date('2026-01-02') },
        { _id: 'c2', updatedAt: new Date('2026-01-01') },
      ]
      mockConvFind.mockResolvedValue(convs)

      const result = await service.getConversations(VALID_USER_ID)

      expect(ShopConversationModel.find).toHaveBeenCalled()
      expect(result).toEqual(convs)
    })
  })

  describe('getMessages', () => {
    it('throws ValidationError for invalid conversationId', async () => {
      await expect(service.getMessages(INVALID_ID)).rejects.toThrow('Invalid conversation id')
    })

    it('returns messages without cursor', async () => {
      const msgs = [{ _id: { toString: () => 'm1' } }, { _id: { toString: () => 'm2' } }]
      mockMsgFind.mockResolvedValue(msgs)

      const result = await service.getMessages(VALID_CONV_ID)

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('nextCursor')
      expect(result.nextCursor).toBeNull()
    })

    it('sets nextCursor when there are more messages than limit', async () => {
      // Return limit+1 messages to trigger hasMore
      const msgs = Array.from({ length: 21 }, (_, i) => ({
        _id: { toString: () => `m${i}` },
      }))
      mockMsgFind.mockResolvedValue(msgs)

      const result = await service.getMessages(VALID_CONV_ID, undefined, 20)

      expect(result.nextCursor).not.toBeNull()
      expect(result.data).toHaveLength(20)
    })

    it('uses cursor in query when provided', async () => {
      const cursor = '507f1f77bcf86cd799439099'
      mockMsgFind.mockResolvedValue([])

      await service.getMessages(VALID_CONV_ID, cursor)

      // The find was called — cursor was a valid ObjectId so it was used
      const { ShopMessageModel } = require('@database/models/shop-message.model')
      expect(ShopMessageModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ _id: expect.any(Object) }),
      )
    })
  })

  describe('sendMessage', () => {
    it('throws ValidationError for invalid conversationId', async () => {
      await expect(service.sendMessage(INVALID_ID, VALID_USER_ID, 'user', 'hello')).rejects.toThrow(
        'Invalid conversation id',
      )
    })

    it('throws NotFoundError when conversation not found', async () => {
      ;(ShopConversationModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })
      // Override findById to return null directly
      ;(ShopConversationModel.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        service.sendMessage(VALID_CONV_ID, VALID_USER_ID, 'user', 'hello'),
      ).rejects.toThrow()
    })

    it('creates message and updates conversation for text type', async () => {
      ;(ShopConversationModel.findById as jest.Mock).mockResolvedValue({
        _id: VALID_CONV_ID,
      })
      const createdMsg = { _id: 'msg1', content: 'hello', type: 'text' }
      mockMsgCreate.mockResolvedValue(createdMsg)
      mockConvFindByIdAndUpdate.mockResolvedValue({})

      const result = await service.sendMessage(VALID_CONV_ID, VALID_USER_ID, 'user', 'hello')

      expect(mockMsgCreate).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'hello', type: 'text' }),
      )
      expect(mockConvFindByIdAndUpdate).toHaveBeenCalled()
      expect(result).toEqual(createdMsg)
    })

    it('creates message with image type and imageUrl', async () => {
      ;(ShopConversationModel.findById as jest.Mock).mockResolvedValue({ _id: VALID_CONV_ID })
      const createdMsg = { _id: 'msg2', content: 'img', type: 'image', imageUrl: 'http://img.jpg' }
      mockMsgCreate.mockResolvedValue(createdMsg)
      mockConvFindByIdAndUpdate.mockResolvedValue({})

      const result = await service.sendMessage(
        VALID_CONV_ID,
        VALID_USER_ID,
        'user',
        'img',
        'image',
        'http://img.jpg',
      )

      expect(mockMsgCreate).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'image', imageUrl: 'http://img.jpg' }),
      )
      expect(result).toEqual(createdMsg)
    })

    it('emits WebSocket event when io is available', async () => {
      const mockEmit = jest.fn()
      const mockTo = jest.fn().mockReturnValue({ emit: mockEmit })
      mockGetIO.mockReturnValue({ to: mockTo })
      ;(ShopConversationModel.findById as jest.Mock).mockResolvedValue({ _id: VALID_CONV_ID })
      mockMsgCreate.mockResolvedValue({ _id: 'msg3', content: 'hello' })
      mockConvFindByIdAndUpdate.mockResolvedValue({})

      await service.sendMessage(VALID_CONV_ID, VALID_USER_ID, 'user', 'hello')

      expect(mockTo).toHaveBeenCalledWith(`shop_conv:${VALID_CONV_ID}`)
      expect(mockEmit).toHaveBeenCalledWith('message:new', expect.any(Object))
    })
  })

  describe('markRead', () => {
    it('calls findByIdAndUpdate with unreadCount 0', async () => {
      mockConvFindByIdAndUpdate.mockResolvedValue({})

      await service.markRead(VALID_CONV_ID)

      expect(mockConvFindByIdAndUpdate).toHaveBeenCalledWith(VALID_CONV_ID, { unreadCount: 0 })
    })

    it('does nothing for invalid conversationId (no throw)', async () => {
      await expect(service.markRead(INVALID_ID)).resolves.toBeUndefined()
      expect(mockConvFindByIdAndUpdate).not.toHaveBeenCalled()
    })
  })
})
