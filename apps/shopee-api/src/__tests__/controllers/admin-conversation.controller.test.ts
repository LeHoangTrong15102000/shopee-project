/// <reference types="jest" />
import { Request, Response } from 'express'

const mockConversationAggregate = jest.fn()
const mockConversationCountDocuments = jest.fn()
const mockConversationFindById = jest.fn()
const mockConversationFindByIdAndDelete = jest.fn()

jest.mock('@database/models/conversation.model', () => ({
  ConversationModel: {
    aggregate: mockConversationAggregate,
    countDocuments: mockConversationCountDocuments,
    findById: jest.fn(() => ({
      populate: jest.fn().mockReturnThis(),
      lean: mockConversationFindById,
    })),
    findByIdAndDelete: jest.fn(() => ({
      lean: mockConversationFindByIdAndDelete,
    })),
  },
}))

jest.mock('@utils/response', () => ({
  responseSuccess: jest.fn((res: any, { data }: any = {}) => {
    res.status(200).send({ data })
  }),
}))

import {
  adminGetConversations,
  adminGetConversation,
  adminDeleteConversation,
} from '../../controllers/admin-conversation.controller'

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('AdminConversationController', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('adminGetConversations', () => {
    it('returns paginated conversations with no filters', async () => {
      mockConversationAggregate.mockResolvedValue([])
      mockConversationCountDocuments.mockResolvedValue(0)

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await adminGetConversations(req as Request, res as Response)

      expect(mockConversationAggregate).toHaveBeenCalled()
      expect(mockConversationCountDocuments).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('applies user_id filter when provided', async () => {
      mockConversationAggregate.mockResolvedValue([])
      mockConversationCountDocuments.mockResolvedValue(0)

      const req = createMockRequest({
        query: { user_id: '507f1f77bcf86cd799439011' },
      })
      const res = createMockResponse()

      await adminGetConversations(req as Request, res as Response)

      expect(mockConversationAggregate).toHaveBeenCalled()
    })

    it('applies status filter when provided', async () => {
      mockConversationAggregate.mockResolvedValue([])
      mockConversationCountDocuments.mockResolvedValue(0)

      const req = createMockRequest({ query: { status: 'active' } })
      const res = createMockResponse()

      await adminGetConversations(req as Request, res as Response)

      expect(mockConversationCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
      )
    })

    it('applies date_from and date_to filters', async () => {
      mockConversationAggregate.mockResolvedValue([])
      mockConversationCountDocuments.mockResolvedValue(0)

      const req = createMockRequest({
        query: { date_from: '2026-01-01', date_to: '2026-01-31' },
      })
      const res = createMockResponse()

      await adminGetConversations(req as Request, res as Response)

      expect(mockConversationCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ createdAt: expect.any(Object) }),
      )
    })

    it('uses default page 1 and limit 20', async () => {
      mockConversationAggregate.mockResolvedValue([])
      mockConversationCountDocuments.mockResolvedValue(0)

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await adminGetConversations(req as Request, res as Response)

      // Verify pagination defaults are applied (aggregate is called with skip=0, limit=20)
      const aggregateCall = mockConversationAggregate.mock.calls[0][0]
      const skipStage = aggregateCall.find((s: any) => s.$skip !== undefined)
      const limitStage = aggregateCall.find((s: any) => s.$limit !== undefined)
      expect(skipStage.$skip).toBe(0)
      expect(limitStage.$limit).toBe(20)
    })
  })

  describe('adminGetConversation', () => {
    it('returns conversation with messages when found', async () => {
      const conv = {
        _id: 'conv1',
        user: { name: 'Test', email: 'test@test.com' },
        messages: [
          { id: 'm1', role: 'user', content: 'Hello', timestamp: new Date() },
          { id: 'm2', role: 'assistant', content: 'Hi', timestamp: new Date() },
        ],
      }
      mockConversationFindById.mockResolvedValue(conv)

      const req = createMockRequest({ params: { id: 'conv1' } })
      const res = createMockResponse()

      await adminGetConversation(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('returns null data when conversation not found', async () => {
      mockConversationFindById.mockResolvedValue(null)

      const req = createMockRequest({ params: { id: 'nonexistent' } })
      const res = createMockResponse()

      await adminGetConversation(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('adminDeleteConversation', () => {
    it('deletes conversation and returns result', async () => {
      mockConversationFindByIdAndDelete.mockResolvedValue({ _id: 'conv1' })

      const req = createMockRequest({ params: { id: 'conv1' } })
      const res = createMockResponse()

      await adminDeleteConversation(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('returns null data when conversation not found', async () => {
      mockConversationFindByIdAndDelete.mockResolvedValue(null)

      const req = createMockRequest({ params: { id: 'nonexistent' } })
      const res = createMockResponse()

      await adminDeleteConversation(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})
