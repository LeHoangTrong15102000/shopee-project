/// <reference types="jest" />
import { Types } from 'mongoose'
import { QAService } from '@services/qa.service'
import { IQARepository } from '@repositories/interfaces/qa.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { IUserRepository } from '@repositories/interfaces/user.repository.interface'
import { NotFoundError, ValidationError } from '@services/base.service'

const mockQARepository = {
  findQuestionsByProduct: jest.fn(),
  findQuestionById: jest.fn(),
  createQuestion: jest.fn(),
  addAnswer: jest.fn(),
  findAnswerById: jest.fn(),
  toggleQuestionLike: jest.fn(),
  toggleAnswerLike: jest.fn(),
  countUnansweredQuestions: jest.fn(),
} as unknown as jest.Mocked<IQARepository>

const mockProductRepository = { findById: jest.fn() } as unknown as jest.Mocked<IProductRepository>
const mockUserRepository = { findById: jest.fn() } as unknown as jest.Mocked<IUserRepository>

describe('QAService', () => {
  let service: QAService
  const validObjectId = new Types.ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
    service = new QAService(mockQARepository, mockProductRepository, mockUserRepository)
  })

  const mockQuestion = {
    _id: new Types.ObjectId(validObjectId),
    product_id: new Types.ObjectId(validObjectId),
    question: 'Test?',
    liked_by: [],
    answers: [{ _id: new Types.ObjectId(validObjectId), answer: 'Yes', liked_by: [] }],
  }

  describe('getQuestions', () => {
    it('should return questions with is_liked false when no userId', async () => {
      ;(mockQARepository.findQuestionsByProduct as jest.Mock).mockResolvedValue({
        data: [mockQuestion],
        pagination: { page: 1, limit: 10, total_pages: 1, page_size: 10 },
      })

      const result = await service.getQuestions(validObjectId, undefined, 'newest', {
        page: 1,
        limit: 10,
      })

      expect(result.data[0].is_liked).toBe(false)
    })

    it('should return questions with is_liked based on userId', async () => {
      const questionWithLike = { ...mockQuestion, liked_by: [new Types.ObjectId(validObjectId)] }
      ;(mockQARepository.findQuestionsByProduct as jest.Mock).mockResolvedValue({
        data: [questionWithLike],
        pagination: { page: 1, limit: 10, total_pages: 1, page_size: 10 },
      })

      const result = await service.getQuestions(validObjectId, validObjectId, 'newest', {
        page: 1,
        limit: 10,
      })

      expect(result.data[0].is_liked).toBe(true)
    })
  })

  describe('askQuestion', () => {
    it('should create question when product exists', async () => {
      const mockProduct = { _id: validObjectId, name: 'Test Product' }
      const mockUser = { _id: validObjectId, name: 'User' }
      ;(mockProductRepository.findById as jest.Mock).mockResolvedValue(mockProduct)
      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue(mockUser)
      ;(mockQARepository.createQuestion as jest.Mock).mockResolvedValue(mockQuestion)

      const result = await service.askQuestion(validObjectId, validObjectId, 'Test?')

      expect(result.product.name).toBe('Test Product')
    })

    it('should throw NotFoundError when product not found', async () => {
      ;(mockProductRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(service.askQuestion(validObjectId, validObjectId, 'Test?')).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('answerQuestion', () => {
    it('should add answer when question exists', async () => {
      const mockUser = { _id: validObjectId, name: 'User' }
      const mockAnswer = { _id: validObjectId, answer: 'Answer' }
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion)
      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue(mockUser)
      ;(mockQARepository.addAnswer as jest.Mock).mockResolvedValue(mockAnswer)

      const result = await service.answerQuestion(validObjectId, validObjectId, 'Answer')

      expect(result.answer).toEqual(mockAnswer)
    })

    it('should throw NotFoundError when question not found', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(null)

      await expect(service.answerQuestion(validObjectId, validObjectId, 'Answer')).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('likeQuestion', () => {
    it('should toggle like when question exists', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion)
      ;(mockQARepository.toggleQuestionLike as jest.Mock).mockResolvedValue({
        is_liked: true,
        likes_count: 1,
      })

      const result = await service.likeQuestion(validObjectId, validObjectId)

      expect(result.is_liked).toBe(true)
    })

    it('should throw NotFoundError when question not found', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(null)

      await expect(service.likeQuestion(validObjectId, validObjectId)).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('likeAnswer', () => {
    it('should toggle like when answer exists', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion)
      ;(mockQARepository.toggleAnswerLike as jest.Mock).mockResolvedValue({
        is_liked: true,
        likes_count: 1,
      })

      const result = await service.likeAnswer(validObjectId, validObjectId, validObjectId)

      expect(result.is_liked).toBe(true)
    })

    it('should throw NotFoundError when answer not found', async () => {
      const questionNoAnswer = { ...mockQuestion, answers: [] }
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(questionNoAnswer)

      await expect(service.likeAnswer(validObjectId, validObjectId, validObjectId)).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('countUnansweredQuestions', () => {
    it('should return count from repository', async () => {
      ;(mockQARepository.countUnansweredQuestions as jest.Mock).mockResolvedValue(5)

      const result = await service.countUnansweredQuestions()

      expect(result).toBe(5)
    })
  })

  describe('askQuestion - validation errors', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.askQuestion('invalid', validObjectId, 'Q?')).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw ValidationError for invalid productId', async () => {
      await expect(service.askQuestion(validObjectId, 'invalid', 'Q?')).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw NotFoundError when product not found', async () => {
      ;(mockProductRepository.findById as jest.Mock).mockResolvedValue(null)
      await expect(service.askQuestion(validObjectId, validObjectId, 'Q?')).rejects.toThrow(
        NotFoundError,
      )
    })

    it('should throw NotFoundError when user not found', async () => {
      ;(mockProductRepository.findById as jest.Mock).mockResolvedValue({ name: 'Test' })
      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue(null)
      await expect(service.askQuestion(validObjectId, validObjectId, 'Q?')).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('answerQuestion - validation errors', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.answerQuestion('invalid', validObjectId, 'A')).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw ValidationError for invalid questionId', async () => {
      await expect(service.answerQuestion(validObjectId, 'invalid', 'A')).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw NotFoundError when question not found', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(null)
      await expect(service.answerQuestion(validObjectId, validObjectId, 'A')).rejects.toThrow(
        NotFoundError,
      )
    })

    it('should throw NotFoundError when user not found', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion)
      ;(mockUserRepository.findById as jest.Mock).mockResolvedValue(null)
      await expect(service.answerQuestion(validObjectId, validObjectId, 'A')).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('likeQuestion - validation errors', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.likeQuestion('invalid', validObjectId)).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid questionId', async () => {
      await expect(service.likeQuestion(validObjectId, 'invalid')).rejects.toThrow(ValidationError)
    })
  })

  describe('likeAnswer - validation errors', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.likeAnswer('invalid', validObjectId, validObjectId)).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw ValidationError for invalid questionId', async () => {
      await expect(service.likeAnswer(validObjectId, 'invalid', validObjectId)).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw ValidationError for invalid answerId', async () => {
      await expect(service.likeAnswer(validObjectId, validObjectId, 'invalid')).rejects.toThrow(
        ValidationError,
      )
    })

    it('should throw NotFoundError when question not found', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(null)
      await expect(service.likeAnswer(validObjectId, validObjectId, validObjectId)).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('adminGetQuestions', () => {
    it('should call findQuestionsWithFilters', async () => {
      ;(mockQARepository as any).findQuestionsWithFilters = jest
        .fn()
        .mockResolvedValue({ data: [], pagination: {} })
      await service.adminGetQuestions({}, { page: 1, limit: 10 })
      expect((mockQARepository as any).findQuestionsWithFilters).toHaveBeenCalled()
    })
  })

  describe('adminDeleteQuestion', () => {
    it('should delete question', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion)
      ;(mockQARepository as any).deleteQuestionById = jest.fn().mockResolvedValue(undefined)

      const result = await service.adminDeleteQuestion(validObjectId)
      expect(result.deleted).toBe(true)
    })

    it('should throw NotFoundError when question not found', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(null)
      await expect(service.adminDeleteQuestion(validObjectId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError for invalid id', async () => {
      await expect(service.adminDeleteQuestion('invalid')).rejects.toThrow(ValidationError)
    })
  })

  describe('adminDeleteAnswer', () => {
    it('should delete answer successfully', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion)
      ;(mockQARepository as any).removeAnswer = jest.fn().mockResolvedValue(undefined)

      const result = await service.adminDeleteAnswer(validObjectId, validObjectId)
      expect(result.deleted).toBe(true)
    })

    it('should throw NotFoundError when question not found', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue(null)
      await expect(service.adminDeleteAnswer(validObjectId, validObjectId)).rejects.toThrow(
        NotFoundError,
      )
    })

    it('should throw NotFoundError when answer not found in question', async () => {
      ;(mockQARepository.findQuestionById as jest.Mock).mockResolvedValue({
        ...mockQuestion,
        answers: [],
      })
      await expect(service.adminDeleteAnswer(validObjectId, validObjectId)).rejects.toThrow(
        NotFoundError,
      )
    })

    it('should throw ValidationError for invalid questionId', async () => {
      await expect(service.adminDeleteAnswer('invalid', validObjectId)).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe('adminGetStats', () => {
    it('should call getQAStats', async () => {
      ;(mockQARepository as any).getQAStats = jest.fn().mockResolvedValue({ total: 10 })
      await service.adminGetStats()
      expect((mockQARepository as any).getQAStats).toHaveBeenCalled()
    })
  })

  describe('getQuestions - with userId for like status', () => {
    it('should add is_liked status for user', async () => {
      const mockResult = {
        data: [{ ...mockQuestion, liked_by: [new Types.ObjectId(validObjectId)] }],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      }
      ;(mockQARepository.findQuestionsByProduct as jest.Mock).mockResolvedValue(mockResult as any)

      const result = await service.getQuestions(validObjectId, validObjectId, 'newest', {
        page: 1,
        limit: 10,
      })
      expect(result.data[0].is_liked).toBe(true)
    })

    it('should throw ValidationError when productId is empty', async () => {
      await expect(
        service.getQuestions('', undefined, 'newest', { page: 1, limit: 10 }),
      ).rejects.toThrow(ValidationError)
    })
  })
})
