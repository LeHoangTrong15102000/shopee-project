/// <reference types="jest" />

import { Types } from 'mongoose'

const mockQuestionId = '507f1f77bcf86cd799439011'
const mockAnswerId = new Types.ObjectId()
const mockUserId = '507f1f77bcf86cd799439012'
const mockProductId = '507f1f77bcf86cd799439013'
const mockAnswer = {
  _id: mockAnswerId,
  user_id: new Types.ObjectId(mockUserId),
  user_name: 'Test User',
  user_avatar: 'avatar.jpg',
  is_seller: false,
  answer: 'Test answer',
  likes_count: 0,
  liked_by: [],
  created_at: new Date(),
}
const mockQuestionData = {
  _id: mockQuestionId,
  product_id: mockProductId,
  user_id: mockUserId,
  user_name: 'Test User',
  question: 'Test question?',
  answers: [mockAnswer],
  likes_count: 5,
  liked_by: [],
  toObject: () => mockQuestionData,
}

jest.mock('@database/models/question.model', () => {
  const mockModel: any = jest.fn()
  mockModel.findById = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.findOne = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({ lean: jest.fn() }),
      }),
      lean: jest.fn(),
    }),
    lean: jest.fn(),
  })
  mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.findByIdAndDelete = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.countDocuments = jest.fn()
  mockModel.deleteMany = jest.fn()
  mockModel.updateMany = jest.fn()
  mockModel.exists = jest.fn()
  return { QuestionModel: mockModel }
})

import { QuestionModel } from '@database/models/question.model'
import { QARepository } from '@repositories/qa.repository'

describe('QARepository', () => {
  let repository: QARepository
  const mockQuestion = {
    _id: mockQuestionId,
    product_id: mockProductId,
    user_id: mockUserId,
    user_name: 'Test User',
    question: 'Test question?',
    answers: [mockAnswer],
    likes_count: 5,
    liked_by: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Re-setup constructor mock after clearAllMocks
    ;(QuestionModel as any).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ toObject: () => mockQuestionData }),
    }))
    repository = new QARepository()
  })

  describe('findQuestionsByProduct', () => {
    it('should find questions by product with pagination', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockQuestion])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      ;(QuestionModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(QuestionModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findQuestionsByProduct(
        { product_id: mockProductId },
        { page: 1, limit: 10 }
      )
      expect(QuestionModel.find).toHaveBeenCalled()
      expect(result.data).toEqual([mockQuestion])
      expect(result.pagination.total).toBe(1)
    })

    it('should sort by oldest', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockQuestion])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      ;(QuestionModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(QuestionModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findQuestionsByProduct(
        { product_id: mockProductId, sort: 'oldest' },
        { page: 1, limit: 10 }
      )
      expect(result.data).toEqual([mockQuestion])
    })

    it('should sort by most_liked', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockQuestion])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      ;(QuestionModel.find as jest.Mock).mockReturnValue({ sort: mockSort })
      ;(QuestionModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findQuestionsByProduct(
        { product_id: mockProductId, sort: 'most_liked' },
        { page: 1, limit: 10 }
      )
      expect(result.data).toEqual([mockQuestion])
    })
  })

  describe('findQuestionById', () => {
    it('should find question by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockQuestion)
      ;(QuestionModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.findQuestionById(mockQuestionId)
      expect(QuestionModel.findById).toHaveBeenCalledWith(mockQuestionId)
      expect(result).toEqual(mockQuestion)
    })

    it('should return null if not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(QuestionModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.findQuestionById(mockQuestionId)
      expect(result).toBeNull()
    })
  })

  describe('createQuestion', () => {
    it('should create a question', async () => {
      const result = await repository.createQuestion({
        product_id: mockProductId,
        user_id: mockUserId,
        user_name: 'Test User',
        question: 'Test question?',
      })
      expect(result).toEqual(mockQuestionData)
    })
  })

  describe('addAnswer', () => {
    it('should add answer to question', async () => {
      ;(QuestionModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockQuestion)
      const result = await repository.addAnswer(mockQuestionId, {
        user_id: mockUserId,
        user_name: 'Test User',
        is_seller: false,
        answer: 'Test answer',
      })
      expect(QuestionModel.findByIdAndUpdate).toHaveBeenCalled()
      expect(result.answer).toBe('Test answer')
    })
  })

  describe('findAnswerById', () => {
    it('should find answer by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockQuestion)
      ;(QuestionModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.findAnswerById(mockQuestionId, mockAnswerId.toString())
      expect(result).toEqual(mockAnswer)
    })

    it('should return null if question not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(QuestionModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.findAnswerById(mockQuestionId, mockAnswerId.toString())
      expect(result).toBeNull()
    })

    it('should return null if answer not found', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockQuestion, answers: [] })
      ;(QuestionModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })
      const result = await repository.findAnswerById(mockQuestionId, new Types.ObjectId().toString())
      expect(result).toBeNull()
    })
  })

  describe('toggleQuestionLike', () => {
    it('should add like to question', async () => {
      const mockDoc = {
        ...mockQuestion,
        liked_by: [],
        likes_count: 0,
        save: jest.fn().mockResolvedValue(true),
      }
      ;(QuestionModel.findById as jest.Mock).mockResolvedValue(mockDoc)
      const result = await repository.toggleQuestionLike(mockQuestionId, mockUserId)
      expect(result.is_liked).toBe(true)
      expect(mockDoc.save).toHaveBeenCalled()
    })

    it('should remove like from question', async () => {
      const mockDoc = {
        ...mockQuestion,
        liked_by: [new Types.ObjectId(mockUserId)],
        likes_count: 1,
        save: jest.fn().mockResolvedValue(true),
      }
      ;(QuestionModel.findById as jest.Mock).mockResolvedValue(mockDoc)
      const result = await repository.toggleQuestionLike(mockQuestionId, mockUserId)
      expect(result.is_liked).toBe(false)
      expect(mockDoc.save).toHaveBeenCalled()
    })

    it('should throw if question not found', async () => {
      ;(QuestionModel.findById as jest.Mock).mockResolvedValue(null)
      await expect(repository.toggleQuestionLike(mockQuestionId, mockUserId)).rejects.toThrow('Question not found')
    })
  })

  describe('toggleAnswerLike', () => {
    it('should add like to answer', async () => {
      const mockDoc = {
        ...mockQuestion,
        answers: [{ ...mockAnswer, liked_by: [], likes_count: 0 }],
        save: jest.fn().mockResolvedValue(true),
      }
      ;(QuestionModel.findById as jest.Mock).mockResolvedValue(mockDoc)
      const result = await repository.toggleAnswerLike(mockQuestionId, mockAnswerId.toString(), mockUserId)
      expect(result.is_liked).toBe(true)
      expect(mockDoc.save).toHaveBeenCalled()
    })

    it('should remove like from answer', async () => {
      const mockDoc = {
        ...mockQuestion,
        answers: [{ ...mockAnswer, liked_by: [new Types.ObjectId(mockUserId)], likes_count: 1 }],
        save: jest.fn().mockResolvedValue(true),
      }
      ;(QuestionModel.findById as jest.Mock).mockResolvedValue(mockDoc)
      const result = await repository.toggleAnswerLike(mockQuestionId, mockAnswerId.toString(), mockUserId)
      expect(result.is_liked).toBe(false)
      expect(mockDoc.save).toHaveBeenCalled()
    })

    it('should throw if question not found', async () => {
      ;(QuestionModel.findById as jest.Mock).mockResolvedValue(null)
      await expect(repository.toggleAnswerLike(mockQuestionId, mockAnswerId.toString(), mockUserId)).rejects.toThrow('Question not found')
    })

    it('should throw if answer not found', async () => {
      const mockDoc = { ...mockQuestion, answers: [] }
      ;(QuestionModel.findById as jest.Mock).mockResolvedValue(mockDoc)
      await expect(repository.toggleAnswerLike(mockQuestionId, mockAnswerId.toString(), mockUserId)).rejects.toThrow('Answer not found')
    })
  })

  describe('countUnansweredQuestions', () => {
    it('should count unanswered questions', async () => {
      ;(QuestionModel.countDocuments as jest.Mock).mockResolvedValue(5)
      const result = await repository.countUnansweredQuestions()
      expect(QuestionModel.countDocuments).toHaveBeenCalledWith({ answers: { $size: 0 } })
      expect(result).toBe(5)
    })
  })
})

