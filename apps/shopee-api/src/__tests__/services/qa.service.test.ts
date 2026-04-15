/// <reference types="jest" />
import { Types } from 'mongoose'
import { QAService } from '@services/qa.service'
import { IQARepository } from '@repositories/interfaces/qa.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { IUserRepository } from '@repositories/interfaces/user.repository.interface'
import { NotFoundError } from '@services/base.service'

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
})
