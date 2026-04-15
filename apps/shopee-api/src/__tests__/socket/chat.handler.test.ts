/// <reference types="jest" />

jest.mock('../../database/models/chat.model', () => ({
  ChatModel: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}))

jest.mock('../../database/models/message.model', () => ({
  MessageModel: {
    create: jest.fn(),
  },
}))

jest.mock('../../database/models/user.model', () => ({
  UserModel: {
    findById: jest.fn().mockReturnValue({ select: jest.fn() }),
  },
}))

jest.mock('../../utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiError: jest.fn() },
}))

jest.mock('../../constants/socket', () => ({
  SOCKET_CONFIG: { ROOM_PREFIX: { CHAT: 'chat:' } },
  SOCKET_ERRORS: {
    INVALID_PAYLOAD: 'INVALID_PAYLOAD',
    CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },
}))

const VALID_USER_ID = '507f1f77bcf86cd799439011'
const VALID_CHAT_ID = '507f1f77bcf86cd799439022'

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose')
  return {
    ...actual,
    Types: {
      ...actual.Types,
      ObjectId: jest.fn().mockImplementation((id: string) => ({
        toString: () => id,
        equals: (other: any) => other?.toString() === id,
      })),
    },
  }
})

import { createMockSocket } from './setup'
import { ChatModel } from '../../database/models/chat.model'
import { MessageModel } from '../../database/models/message.model'
import { UserModel } from '../../database/models/user.model'
import { registerChatHandlers } from '../../socket/handlers/chat.handler'
import { SocketEvent } from '../../@types/socket.type'

describe('chat.handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('registerChatHandlers', () => {
    it('should register all chat event listeners', () => {
      const mockSocket = createMockSocket() as any

      registerChatHandlers(mockSocket)

      expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.JOIN_CHAT, expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.LEAVE_CHAT, expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.SEND_MESSAGE, expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.TYPING_START, expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.TYPING_STOP, expect.any(Function))
    })
  })

  describe('JOIN_CHAT event', () => {
    it('should join chat room when chat exists and user is participant', async () => {
      const mockSocket = createMockSocket() as any
      const mockChat = { participants: [{ user: { toString: () => 'test-user-id' } }] }
      ;(ChatModel.findById as jest.Mock).mockResolvedValue(mockChat)

      registerChatHandlers(mockSocket)
      const joinHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.JOIN_CHAT,
      )[1]
      await joinHandler({ chat_id: 'chat-123' })

      expect(ChatModel.findById).toHaveBeenCalledWith('chat-123')
      expect(mockSocket.join).toHaveBeenCalledWith('chat:chat-123')
    })

    it('should emit error when chat_id is missing', async () => {
      const mockSocket = createMockSocket() as any

      registerChatHandlers(mockSocket)
      const joinHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.JOIN_CHAT,
      )[1]
      await joinHandler({})

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SocketEvent.ERROR,
        expect.objectContaining({ code: 'INVALID_PAYLOAD' }),
      )
    })

    it('should emit error when chat not found', async () => {
      const mockSocket = createMockSocket() as any
      ;(ChatModel.findById as jest.Mock).mockResolvedValue(null)

      registerChatHandlers(mockSocket)
      const joinHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.JOIN_CHAT,
      )[1]
      await joinHandler({ chat_id: 'invalid-chat' })

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SocketEvent.ERROR,
        expect.objectContaining({ code: 'CHAT_NOT_FOUND' }),
      )
    })
  })

  describe('SEND_MESSAGE event', () => {
    it('should create message and broadcast to room', async () => {
      const mockSocket = createMockSocket() as any
      const mockChat = { participants: [{ user: { toString: () => 'test-user-id' } }] }
      const mockMessage = {
        _id: { toString: () => 'msg-123' },
        content: 'Hello',
        message_type: 'text',
        createdAt: new Date('2024-01-01'),
      }
      ;(ChatModel.findById as jest.Mock).mockResolvedValue(mockChat)
      ;(MessageModel.create as jest.Mock).mockResolvedValue(mockMessage)
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ name: 'Test User' }),
      })
      ;(ChatModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      registerChatHandlers(mockSocket)
      const sendHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.SEND_MESSAGE,
      )[1]
      await sendHandler({ chat_id: 'chat-123', message: 'Hello' })

      expect(MessageModel.create).toHaveBeenCalled()
      expect(mockSocket.to).toHaveBeenCalledWith('chat:chat-123')
    })
  })

  describe('TYPING events', () => {
    it('should broadcast typing start to room', () => {
      const mockSocket = createMockSocket() as any

      registerChatHandlers(mockSocket)
      const typingHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.TYPING_START,
      )[1]
      typingHandler({ chat_id: 'chat-123' })

      expect(mockSocket.to).toHaveBeenCalledWith('chat:chat-123')
    })

    it('should broadcast typing stop to room', () => {
      const mockSocket = createMockSocket() as any

      registerChatHandlers(mockSocket)
      const typingHandler = mockSocket.on.mock.calls.find(
        (c: any) => c[0] === SocketEvent.TYPING_STOP,
      )[1]
      typingHandler({ chat_id: 'chat-123' })

      expect(mockSocket.to).toHaveBeenCalledWith('chat:chat-123')
    })
  })
})
