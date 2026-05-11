/// <reference types="jest" />
import { Request, Response } from 'express'

const mockGetConversations = jest.fn()
const mockGetMessages = jest.fn()
const mockSendMessage = jest.fn()
const mockCreateOrGetConversation = jest.fn()

jest.mock('@services/shop-chat.service', () => ({
  ShopChatService: jest.fn().mockImplementation(() => ({
    getConversations: mockGetConversations,
    getMessages: mockGetMessages,
    sendMessage: mockSendMessage,
    createOrGetConversation: mockCreateOrGetConversation,
  })),
}))

import {
  getConversations,
  getMessages,
  sendMessage,
} from '../../controllers/shop-chat.controller'

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  jwtDecoded: options.jwtDecoded,
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('ShopChatController', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getConversations', () => {
    it('delegates to service with userId from jwtDecoded', async () => {
      const convs = [{ _id: 'c1' }, { _id: 'c2' }]
      mockGetConversations.mockResolvedValue(convs)

      const req = createMockRequest({ jwtDecoded: { id: 'user123' } })
      const res = createMockResponse()

      await getConversations(req as Request, res as Response)

      expect(mockGetConversations).toHaveBeenCalledWith('user123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: convs }))
    })
  })

  describe('getMessages', () => {
    it('passes conversationId and cursor to service', async () => {
      const msgResult = { data: [], nextCursor: null }
      mockGetMessages.mockResolvedValue(msgResult)

      const req = createMockRequest({
        params: { id: 'conv1' },
        query: { cursor: 'cursor123', limit: '10' },
      })
      const res = createMockResponse()

      await getMessages(req as Request, res as Response)

      expect(mockGetMessages).toHaveBeenCalledWith('conv1', 'cursor123', 10)
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('passes undefined cursor when not provided', async () => {
      mockGetMessages.mockResolvedValue({ data: [], nextCursor: null })

      const req = createMockRequest({ params: { id: 'conv1' } })
      const res = createMockResponse()

      await getMessages(req as Request, res as Response)

      expect(mockGetMessages).toHaveBeenCalledWith('conv1', undefined, 20)
    })
  })

  describe('sendMessage', () => {
    it('delegates to service with body content', async () => {
      const msg = { _id: 'msg1', content: 'hello' }
      mockSendMessage.mockResolvedValue(msg)

      const req = createMockRequest({
        params: { id: 'conv1' },
        jwtDecoded: { id: 'user123' },
        body: { content: 'hello', type: 'text' },
      })
      const res = createMockResponse()

      await sendMessage(req as Request, res as Response)

      expect(mockSendMessage).toHaveBeenCalledWith('conv1', 'user123', 'user', 'hello', 'text', undefined)
      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('returns 400 when content is empty', async () => {
      const req = createMockRequest({
        params: { id: 'conv1' },
        jwtDecoded: { id: 'user123' },
        body: { content: '' },
      })
      const res = createMockResponse()

      await sendMessage(req as Request, res as Response)

      expect(mockSendMessage).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('returns 400 when content is missing', async () => {
      const req = createMockRequest({
        params: { id: 'conv1' },
        jwtDecoded: { id: 'user123' },
        body: {},
      })
      const res = createMockResponse()

      await sendMessage(req as Request, res as Response)

      expect(mockSendMessage).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('forwards imageUrl when provided', async () => {
      mockSendMessage.mockResolvedValue({ _id: 'msg2', content: 'img' })

      const req = createMockRequest({
        params: { id: 'conv1' },
        jwtDecoded: { id: 'user123' },
        body: { content: 'img', type: 'image', imageUrl: 'http://img.jpg' },
      })
      const res = createMockResponse()

      await sendMessage(req as Request, res as Response)

      expect(mockSendMessage).toHaveBeenCalledWith(
        'conv1',
        'user123',
        'user',
        'img',
        'image',
        'http://img.jpg',
      )
    })
  })
})
