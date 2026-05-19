/// <reference types="jest" />
import { Request, Response } from 'express'
import { STATUS } from '@constants/status'

jest.mock('../../socket/utils/qa-emit', () => ({
  emitNewQuestion: jest.fn(),
  emitNewAnswer: jest.fn(),
  emitQuestionLiked: jest.fn(),
}))
jest.mock('../../socket/utils/seller-emit', () => ({
  emitSellerQANotification: jest.fn(),
}))
jest.mock('../../socket/utils/seller-metrics.service', () => ({
  emitCurrentSellerMetrics: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('../../socket/socket.init', () => ({
  getIO: jest.fn().mockReturnValue({
    sockets: {
      adapter: {
        rooms: new Map([['seller:seller123', { size: 1 }]]),
      },
    },
  }),
}))
jest.mock('../../container', () => ({
  container: {
    services: {
      qa: {
        getQuestions: jest.fn(),
        askQuestion: jest.fn(),
        answerQuestion: jest.fn(),
        likeQuestion: jest.fn(),
        likeAnswer: jest.fn(),
      },
    },
  },
}))

import { container } from '../../container'
import { emitNewQuestion, emitNewAnswer, emitQuestionLiked } from '../../socket/utils/qa-emit'
import { emitSellerQANotification } from '../../socket/utils/seller-emit'
import { emitCurrentSellerMetrics } from '../../socket/utils/seller-metrics.service'
import {
  getQuestions,
  askQuestion,
  answerQuestion,
  likeQuestion,
  likeAnswer,
} from '@controllers/qa.controller'

const mockQAService = container.services.qa as jest.Mocked<typeof container.services.qa>

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

describe('QA Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getQuestions', () => {
    it('should return questions with default pagination', async () => {
      const mockResult = {
        data: [{ _id: 'q1', question: 'Test question' }],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      }
      mockQAService.getQuestions.mockResolvedValue(mockResult as any)

      const req = createMockRequest({ query: { product_id: 'prod123' } })
      const res = createMockResponse()

      await getQuestions(req as any, res as Response)

      expect(mockQAService.getQuestions).toHaveBeenCalledWith('prod123', 'user123', 'newest', {
        page: 1,
        limit: 10,
      })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách câu hỏi thành công',
        data: {
          questions: mockResult.data,
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        },
      })
    })

    it('should pass custom query params correctly', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 2, limit: 5, total: 10, page_size: 2 },
      }
      mockQAService.getQuestions.mockResolvedValue(mockResult as any)

      const req = createMockRequest({
        query: { product_id: 'prod456', page: '2', limit: '5', sort: 'oldest' },
      })
      const res = createMockResponse()

      await getQuestions(req as any, res as Response)

      expect(mockQAService.getQuestions).toHaveBeenCalledWith('prod456', 'user123', 'oldest', {
        page: 2,
        limit: 5,
      })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })
  })

  describe('askQuestion', () => {
    it('should create question and emit socket events', async () => {
      const mockQuestion = {
        _id: 'q123',
        user_name: 'Test User',
        user_avatar: 'avatar.jpg',
        question: 'How does this work?',
        createdAt: new Date('2024-01-01'),
      }
      const mockProduct = { name: 'Test Product' }
      mockQAService.askQuestion.mockResolvedValue({
        question: mockQuestion,
        product: mockProduct,
      } as any)

      const req = createMockRequest({
        body: { product_id: 'prod123', question: 'How does this work?' },
      })
      const res = createMockResponse()

      await askQuestion(req as any, res as Response)

      expect(mockQAService.askQuestion).toHaveBeenCalledWith(
        'user123',
        'prod123',
        'How does this work?',
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Đặt câu hỏi thành công',
        data: mockQuestion,
      })

      await new Promise((r) => setTimeout(r, 10))
      expect(emitNewQuestion).toHaveBeenCalled()
      expect(emitSellerQANotification).toHaveBeenCalled()
      expect(emitCurrentSellerMetrics).toHaveBeenCalled()
    })
  })

  describe('answerQuestion', () => {
    it('should create answer and emit socket event', async () => {
      const mockAnswer = {
        user_name: 'Seller',
        user_avatar: 'seller.jpg',
        answer: 'This is the answer',
        is_seller: true,
        created_at: new Date('2024-01-02'),
      }
      mockQAService.answerQuestion.mockResolvedValue({
        answer: mockAnswer,
        productId: 'prod123',
      } as any)

      const req = createMockRequest({
        params: { questionId: 'q123' },
        body: { answer: 'This is the answer', is_seller: true },
      })
      const res = createMockResponse()

      await answerQuestion(req as any, res as Response)

      expect(mockQAService.answerQuestion).toHaveBeenCalledWith(
        'user123',
        'q123',
        'This is the answer',
        true,
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trả lời câu hỏi thành công',
        data: mockAnswer,
      })
      expect(emitNewAnswer).toHaveBeenCalled()
    })
  })

  describe('likeQuestion', () => {
    it('should return liked message when question is liked', async () => {
      mockQAService.likeQuestion.mockResolvedValue({
        is_liked: true,
        likes_count: 5,
        productId: 'prod123',
      } as any)

      const req = createMockRequest({ params: { questionId: 'q123' } })
      const res = createMockResponse()

      await likeQuestion(req as any, res as Response)

      expect(mockQAService.likeQuestion).toHaveBeenCalledWith('user123', 'q123')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Thích câu hỏi thành công',
        data: { is_liked: true, likes_count: 5 },
      })
      expect(emitQuestionLiked).toHaveBeenCalledWith('prod123', 'q123', 5)
    })

    it('should return unliked message when question is unliked', async () => {
      mockQAService.likeQuestion.mockResolvedValue({
        is_liked: false,
        likes_count: 4,
        productId: 'prod123',
      } as any)

      const req = createMockRequest({ params: { questionId: 'q123' } })
      const res = createMockResponse()

      await likeQuestion(req as any, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Bỏ thích câu hỏi thành công',
        data: { is_liked: false, likes_count: 4 },
      })
    })
  })

  describe('likeAnswer', () => {
    it('should return liked message when answer is liked', async () => {
      mockQAService.likeAnswer.mockResolvedValue({ is_liked: true, likes_count: 3 } as any)

      const req = createMockRequest({ params: { questionId: 'q123', answerId: 'a456' } })
      const res = createMockResponse()

      await likeAnswer(req as any, res as Response)

      expect(mockQAService.likeAnswer).toHaveBeenCalledWith('user123', 'q123', 'a456')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Thích câu trả lời thành công',
        data: { is_liked: true, likes_count: 3 },
      })
    })

    it('should return unliked message when answer is unliked', async () => {
      mockQAService.likeAnswer.mockResolvedValue({ is_liked: false, likes_count: 2 } as any)

      const req = createMockRequest({ params: { questionId: 'q123', answerId: 'a456' } })
      const res = createMockResponse()

      await likeAnswer(req as any, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Bỏ thích câu trả lời thành công',
        data: { is_liked: false, likes_count: 2 },
      })
    })
  })
})
