/// <reference types="jest" />

import { Types } from 'mongoose'

const mockConversationId = '507f1f77bcf86cd799439011'
const mockUserId = '507f1f77bcf86cd799439012'
const mockMessage = {
  role: 'user' as const,
  content: 'Hello',
  timestamp: new Date(),
  id: 'msg-1',
}
const mockConversationData = {
  _id: mockConversationId,
  user: mockUserId,
  title: 'Test Conversation',
  messages: [mockMessage],
  status: 'active',
  lastActivity: new Date(),
  toObject: () => mockConversationData,
}

jest.mock('@database/models/conversation.model', () => {
  const mockModel: any = jest.fn()
  mockModel.findById = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.findOne = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn() }),
    lean: jest.fn(),
  })
  mockModel.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({ lean: jest.fn() }),
          lean: jest.fn(),
        }),
      }),
      lean: jest.fn(),
    }),
    lean: jest.fn(),
  })
  mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.findByIdAndDelete = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.countDocuments = jest.fn()
  mockModel.deleteMany = jest.fn()
  mockModel.deleteOne = jest.fn()
  mockModel.updateMany = jest.fn()
  mockModel.exists = jest.fn()
  return {
    ConversationModel: mockModel,
    CONVERSATION_STATUS: {
      ACTIVE: 'active',
      ARCHIVED: 'archived',
      DELETED: 'deleted',
    },
  }
})

import { ConversationModel, CONVERSATION_STATUS } from '@database/models/conversation.model'
import { ConversationRepository } from '@repositories/conversation.repository'

describe('ConversationRepository', () => {
  let repository: ConversationRepository
  const mockConversation = {
    _id: mockConversationId,
    user: mockUserId,
    title: 'Test Conversation',
    messages: [mockMessage],
    status: 'active',
    lastActivity: new Date(),
  }
  const mockConversationListItem = {
    _id: mockConversationId,
    user: mockUserId,
    title: 'Test Conversation',
    status: 'active',
    lastActivity: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Re-setup constructor mock after clearAllMocks
    ;(ConversationModel as any).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ toObject: () => mockConversationData }),
    }))
    repository = new ConversationRepository()
  })

  describe('findByUser', () => {
    it('should find conversations by user with pagination', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockConversationListItem])
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      const mockLimit = jest.fn().mockReturnValue({ select: mockSelect })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      ;(ConversationModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(ConversationModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findByUser(mockUserId, {}, { page: 1, limit: 10 })
      expect(ConversationModel.find).toHaveBeenCalled()
      expect(result.data).toEqual([mockConversationListItem])
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by status', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockConversationListItem])
      const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
      const mockLimit = jest.fn().mockReturnValue({ select: mockSelect })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      ;(ConversationModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(ConversationModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findByUser(
        mockUserId,
        { status: 'active' },
        { page: 1, limit: 10 },
      )
      expect(result.data).toEqual([mockConversationListItem])
    })
  })

  describe('findByIdAndUser', () => {
    it('should find conversation by id and user', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockConversation)
      ;(ConversationModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.findByIdAndUser(mockConversationId, mockUserId)
      expect(ConversationModel.findOne).toHaveBeenCalledWith({
        _id: mockConversationId,
        user: mockUserId,
      })
      expect(result).toEqual(mockConversation)
    })

    it('should return null if not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(ConversationModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.findByIdAndUser(mockConversationId, mockUserId)
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a conversation', async () => {
      const result = await repository.create({
        user: mockUserId,
        title: 'Test Conversation',
        messages: [mockMessage],
      })
      expect(result).toEqual(mockConversationData)
    })

    it('should create with default status', async () => {
      const result = await repository.create({
        user: mockUserId,
        title: 'Test Conversation',
        messages: [],
        status: CONVERSATION_STATUS.ACTIVE,
      })
      expect(result).toEqual(mockConversationData)
    })
  })

  describe('addMessages', () => {
    it('should add messages to conversation', async () => {
      const mockDoc = {
        ...mockConversation,
        messages: [...mockConversation.messages],
        lastActivity: new Date(),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue(mockConversation),
      }
      ;(ConversationModel.findOne as jest.Mock).mockResolvedValue(mockDoc)
      const newMessage = {
        role: 'assistant' as const,
        content: 'Hi',
        timestamp: new Date(),
        id: 'msg-2',
      }
      const result = await repository.addMessages(mockConversationId, mockUserId, [newMessage])
      expect(mockDoc.save).toHaveBeenCalled()
      expect(result).toEqual(mockConversation)
    })

    it('should return null if conversation not found', async () => {
      ;(ConversationModel.findOne as jest.Mock).mockResolvedValue(null)
      const result = await repository.addMessages(mockConversationId, mockUserId, [mockMessage])
      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update conversation title', async () => {
      const mockDoc = {
        ...mockConversation,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ ...mockConversation, title: 'Updated Title' }),
      }
      ;(ConversationModel.findOne as jest.Mock).mockResolvedValue(mockDoc)
      const result = await repository.update(mockConversationId, mockUserId, {
        title: 'Updated Title',
      })
      expect(mockDoc.save).toHaveBeenCalled()
      expect(result?.title).toBe('Updated Title')
    })

    it('should update conversation status', async () => {
      const mockDoc = {
        ...mockConversation,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ ...mockConversation, status: 'archived' }),
      }
      ;(ConversationModel.findOne as jest.Mock).mockResolvedValue(mockDoc)
      const result = await repository.update(mockConversationId, mockUserId, { status: 'archived' })
      expect(result?.status).toBe('archived')
    })

    it('should return null if conversation not found', async () => {
      ;(ConversationModel.findOne as jest.Mock).mockResolvedValue(null)
      const result = await repository.update(mockConversationId, mockUserId, { title: 'New Title' })
      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete conversation', async () => {
      ;(ConversationModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 })
      const result = await repository.delete(mockConversationId, mockUserId)
      expect(ConversationModel.deleteOne).toHaveBeenCalledWith({
        _id: mockConversationId,
        user: mockUserId,
      })
      expect(result).toBe(true)
    })

    it('should return false if conversation not found', async () => {
      ;(ConversationModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 })
      const result = await repository.delete(mockConversationId, mockUserId)
      expect(result).toBe(false)
    })
  })
})
