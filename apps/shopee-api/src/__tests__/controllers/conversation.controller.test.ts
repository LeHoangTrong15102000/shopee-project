/// <reference types="jest" />

jest.mock('../../container', () => ({
  container: {
    services: {
      conversation: {
        getConversations: jest.fn(),
        getConversation: jest.fn(),
        createConversation: jest.fn(),
        sendMessage: jest.fn(),
        updateConversation: jest.fn(),
        deleteConversation: jest.fn(),
        testChatbot: jest.fn(),
      },
    },
  },
}))

jest.mock('../../utils/chatbot.service', () => ({
  chatBotService: {
    generateStreamingResponse: jest.fn(),
  },
}))

jest.mock('../../database/models/conversation.model', () => ({
  CONVERSATION_STATUS: { ACTIVE: 'active', ARCHIVED: 'archived' },
}))

import { Request, Response } from 'express'
import { container } from '../../container'
import {
  getConversations,
  getConversation,
  createConversation,
  sendMessage,
  updateConversation,
  deleteConversation,
  testChatbot,
  testChatbotStream,
} from '@controllers/conversation.controller'

const mockConversationService = container.services.conversation as jest.Mocked<
  typeof container.services.conversation
>

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  headers: options.headers || {},
  jwtDecoded: options.jwtDecoded || {
    id: 'user123',
    email: 'test@test.com',
    roles: ['User'],
    created_at: '2024-01-01',
  },
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

const mockConversation = {
  _id: 'conv123',
  user: 'user123',
  title: 'Test Conversation',
  messages: [{ id: 'msg1', role: 'user', content: 'Hello', timestamp: new Date() }],
  status: 'active',
  lastActivity: new Date(),
}

describe('Conversation Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getConversations', () => {
    it('should return list of conversations with pagination', async () => {
      const mockResult = {
        data: [mockConversation],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      }
      mockConversationService.getConversations.mockResolvedValue(mockResult as any)
      const req = createMockRequest()
      const res = createMockResponse()

      await getConversations(req as Request, res as Response)

      expect(mockConversationService.getConversations).toHaveBeenCalledWith(
        'user123',
        { status: 'active' },
        { page: 1, limit: 10 },
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách cuộc trò chuyện thành công',
        data: {
          conversations: [mockConversation],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      })
    })

    it('should handle custom query params', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 2, limit: 5, total: 0, page_size: 0 },
      }
      mockConversationService.getConversations.mockResolvedValue(mockResult as any)
      const req = createMockRequest({ query: { page: '2', limit: '5', status: 'archived' } })
      const res = createMockResponse()

      await getConversations(req as Request, res as Response)

      expect(mockConversationService.getConversations).toHaveBeenCalledWith(
        'user123',
        { status: 'archived' },
        { page: 2, limit: 5 },
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('getConversation', () => {
    it('should return single conversation', async () => {
      mockConversationService.getConversation.mockResolvedValue(mockConversation as any)
      const req = createMockRequest({ params: { id: 'conv123' } })
      const res = createMockResponse()

      await getConversation(req as Request, res as Response)

      expect(mockConversationService.getConversation).toHaveBeenCalledWith('user123', 'conv123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy cuộc trò chuyện thành công',
        data: mockConversation,
      })
    })
  })

  describe('createConversation', () => {
    it('should create conversation and return 201', async () => {
      const aiMessage = { id: 'ai1', role: 'assistant', content: 'Hi there!' }
      mockConversationService.createConversation.mockResolvedValue({
        conversation: { ...mockConversation, messages: [mockConversation.messages[0], aiMessage] },
        aiMessage,
      } as any)
      const req = createMockRequest({ body: { message: 'Hello', title: 'New Chat' } })
      const res = createMockResponse()

      await createConversation(req as Request, res as Response)

      expect(mockConversationService.createConversation).toHaveBeenCalledWith(
        'user123',
        'Hello',
        'New Chat',
      )
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tạo cuộc trò chuyện thành công',
        data: { conversationId: 'conv123', message: aiMessage, totalMessages: 2 },
      })
    })
  })

  describe('sendMessage', () => {
    it('should send message and return response', async () => {
      const aiMessage = { id: 'ai2', role: 'assistant', content: 'Response' }
      mockConversationService.sendMessage.mockResolvedValue({
        conversation: { ...mockConversation, messages: [...mockConversation.messages, aiMessage] },
        aiMessage,
      } as any)
      const req = createMockRequest({
        params: { id: 'conv123' },
        body: { message: 'Test message' },
      })
      const res = createMockResponse()

      await sendMessage(req as Request, res as Response)

      expect(mockConversationService.sendMessage).toHaveBeenCalledWith(
        'user123',
        'conv123',
        'Test message',
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Gửi tin nhắn thành công',
        data: { conversationId: 'conv123', message: aiMessage, totalMessages: 2 },
      })
    })
  })

  describe('updateConversation', () => {
    it('should update conversation title and status', async () => {
      const updatedConversation = {
        ...mockConversation,
        title: 'Updated Title',
        status: 'archived',
      }
      mockConversationService.updateConversation.mockResolvedValue(updatedConversation as any)
      const req = createMockRequest({
        params: { id: 'conv123' },
        body: { title: 'Updated Title', status: 'archived' },
      })
      const res = createMockResponse()

      await updateConversation(req as Request, res as Response)

      expect(mockConversationService.updateConversation).toHaveBeenCalledWith(
        'user123',
        'conv123',
        { title: 'Updated Title', status: 'archived' },
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cập nhật cuộc trò chuyện thành công',
        data: updatedConversation,
      })
    })
  })

  describe('deleteConversation', () => {
    it('should delete conversation successfully', async () => {
      mockConversationService.deleteConversation.mockResolvedValue(undefined as any)
      const req = createMockRequest({ params: { id: 'conv123' } })
      const res = createMockResponse()

      await deleteConversation(req as Request, res as Response)

      expect(mockConversationService.deleteConversation).toHaveBeenCalledWith('user123', 'conv123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Xóa cuộc trò chuyện thành công' })
    })
  })

  describe('testChatbot', () => {
    it('should return bot response', async () => {
      mockConversationService.testChatbot.mockResolvedValue('Bot response' as any)
      const req = createMockRequest({ body: { message: 'Test input' } })
      const res = createMockResponse()

      await testChatbot(req as Request, res as Response)

      expect(mockConversationService.testChatbot).toHaveBeenCalledWith('Test input')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test chatbot thành công',
          data: expect.objectContaining({ userMessage: 'Test input', botResponse: 'Bot response' }),
        }),
      )
    })
  })

  describe('testChatbotStream', () => {
    it('should return 400 when message is missing', async () => {
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await testChatbotStream(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Tham số message không được để trống' })
    })
  })
})
