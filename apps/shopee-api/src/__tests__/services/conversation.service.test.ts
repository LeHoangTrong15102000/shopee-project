/// <reference types="jest" />
import { Types } from 'mongoose'
import { ConversationService } from '@services/conversation.service'
import {
  IConversationRepository,
  CONVERSATION_STATUS,
} from '@repositories/interfaces/conversation.repository.interface'
import { NotFoundError, ValidationError, BusinessError } from '@services/base.service'

jest.mock('@utils/chatbot.service', () => ({
  chatBotService: {
    generateResponse: jest.fn().mockResolvedValue('AI response'),
    generateConversationTitle: jest.fn().mockResolvedValue('Generated Title'),
  },
}))
jest.mock('nanoid', () => ({ nanoid: jest.fn().mockReturnValue('mock-id') }))

const mockConversationRepository = {
  findByUser: jest.fn(),
  findByIdAndUser: jest.fn(),
  create: jest.fn(),
  addMessages: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<IConversationRepository>

describe('ConversationService', () => {
  let service: ConversationService
  const validObjectId = new Types.ObjectId()
  const mockConversation = {
    _id: validObjectId,
    user: validObjectId,
    title: 'Test',
    messages: [],
    status: CONVERSATION_STATUS.ACTIVE,
    lastActivity: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ConversationService(mockConversationRepository)
  })

  describe('getConversations', () => {
    it('returns paginated results', async () => {
      const paginatedResult = {
        data: [mockConversation],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      }
      mockConversationRepository.findByUser.mockResolvedValue(paginatedResult)
      const result = await service.getConversations(
        validObjectId.toString(),
        {},
        { page: 1, limit: 10 },
      )
      expect(result).toEqual(paginatedResult)
      expect(mockConversationRepository.findByUser).toHaveBeenCalled()
    })
  })

  describe('getConversation', () => {
    it('returns conversation when found', async () => {
      mockConversationRepository.findByIdAndUser.mockResolvedValue(mockConversation)
      const result = await service.getConversation(
        validObjectId.toString(),
        validObjectId.toString(),
      )
      expect(result).toEqual(mockConversation)
    })

    it('throws NotFoundError when not found', async () => {
      mockConversationRepository.findByIdAndUser.mockResolvedValue(null)
      await expect(
        service.getConversation(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('createConversation', () => {
    it('creates conversation with user message and AI response', async () => {
      mockConversationRepository.create.mockResolvedValue(mockConversation)
      const result = await service.createConversation(validObjectId.toString(), 'Hello')
      expect(result.conversation).toEqual(mockConversation)
      expect(result.aiMessage).toBeDefined()
      expect(mockConversationRepository.create).toHaveBeenCalled()
    })

    it('throws ValidationError for empty message', async () => {
      await expect(service.createConversation(validObjectId.toString(), '')).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe('sendMessage', () => {
    it('sends message and returns AI response', async () => {
      mockConversationRepository.findByIdAndUser.mockResolvedValue(mockConversation)
      mockConversationRepository.addMessages.mockResolvedValue(mockConversation)
      const result = await service.sendMessage(
        validObjectId.toString(),
        validObjectId.toString(),
        'Hello',
      )
      expect(result.conversation).toEqual(mockConversation)
      expect(result.aiMessage).toBeDefined()
    })

    it('throws BusinessError for archived conversation', async () => {
      const archivedConversation = { ...mockConversation, status: CONVERSATION_STATUS.ARCHIVED }
      mockConversationRepository.findByIdAndUser.mockResolvedValue(archivedConversation)
      await expect(
        service.sendMessage(validObjectId.toString(), validObjectId.toString(), 'Hello'),
      ).rejects.toThrow(BusinessError)
    })
  })

  describe('updateConversation', () => {
    it('updates conversation successfully', async () => {
      mockConversationRepository.update.mockResolvedValue(mockConversation)
      const result = await service.updateConversation(
        validObjectId.toString(),
        validObjectId.toString(),
        { title: 'New Title' },
      )
      expect(result).toEqual(mockConversation)
    })
  })

  describe('deleteConversation', () => {
    it('deletes conversation when found', async () => {
      mockConversationRepository.delete.mockResolvedValue(true)
      await expect(
        service.deleteConversation(validObjectId.toString(), validObjectId.toString()),
      ).resolves.toBeUndefined()
    })

    it('throws NotFoundError when not found', async () => {
      mockConversationRepository.delete.mockResolvedValue(false)
      await expect(
        service.deleteConversation(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('testChatbot', () => {
    it('returns AI response', async () => {
      const result = await service.testChatbot('Hello')
      expect(result).toBe('AI response')
    })

    it('throws ValidationError when message is empty', async () => {
      await expect(service.testChatbot('')).rejects.toThrow(ValidationError)
    })
  })

  describe('getConversations - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.getConversations('invalid', {}, { page: 1, limit: 10 })).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe('getConversation - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.getConversation('invalid', validObjectId.toString())).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw ValidationError for invalid conversationId', async () => {
      await expect(service.getConversation(validObjectId.toString(), 'invalid')).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe('createConversation - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.createConversation('invalid', 'Hello')).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for empty message', async () => {
      await expect(service.createConversation(validObjectId.toString(), '')).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe('sendMessage - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.sendMessage('invalid', validObjectId.toString(), 'hi')).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw ValidationError for invalid conversationId', async () => {
      await expect(service.sendMessage(validObjectId.toString(), 'invalid', 'hi')).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw ValidationError for empty message', async () => {
      await expect(
        service.sendMessage(validObjectId.toString(), validObjectId.toString(), ''),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw BusinessError when conversation is archived', async () => {
      mockConversationRepository.findByIdAndUser.mockResolvedValue({
        ...mockConversation,
        status: 'archived',
      } as any)
      const { BusinessError } = await import('@services/base.service')
      await expect(
        service.sendMessage(validObjectId.toString(), validObjectId.toString(), 'hi'),
      ).rejects.toThrow(BusinessError)
    })
  })

  describe('updateConversation - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(
        service.updateConversation('invalid', validObjectId.toString(), {}),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid conversationId', async () => {
      await expect(
        service.updateConversation(validObjectId.toString(), 'invalid', {}),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError when conversation not found', async () => {
      mockConversationRepository.update.mockResolvedValue(null)
      await expect(
        service.updateConversation(validObjectId.toString(), validObjectId.toString(), {}),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('deleteConversation - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.deleteConversation('invalid', validObjectId.toString())).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw ValidationError for invalid conversationId', async () => {
      await expect(service.deleteConversation(validObjectId.toString(), 'invalid')).rejects.toThrow(
        ValidationError,
      )
    })
  })
})
