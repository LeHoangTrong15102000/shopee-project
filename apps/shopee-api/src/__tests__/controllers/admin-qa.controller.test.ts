/// <reference types="jest" />
import { Request, Response } from 'express'
import { ValidationError, NotFoundError } from '@services/base.service'
import {
  adminGetQuestions,
  adminDeleteQuestion,
  adminDeleteAnswer,
  adminGetQAStats,
} from '../../controllers/admin-qa.controller'

jest.mock('../../container', () => ({
  qaService: {
    adminGetQuestions: jest.fn(),
    adminDeleteQuestion: jest.fn(),
    adminDeleteAnswer: jest.fn(),
    adminGetStats: jest.fn(),
  },
}))

import { qaService } from '../../container'

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

describe('Admin QA Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('adminGetQuestions', () => {
    it('should get questions with filters and pagination', async () => {
      const req = createMockRequest({
        query: {
          page: '2',
          limit: '15',
          sort_by: 'created_at',
          order: 'desc',
          product_id: 'prod123',
          unanswered: 'true',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
      })
      const res = createMockResponse()
      const mockData = { items: [], total: 0 }

      ;(qaService.adminGetQuestions as jest.Mock).mockResolvedValue(mockData)

      await adminGetQuestions(req as Request, res as Response)

      expect(qaService.adminGetQuestions).toHaveBeenCalledWith(
        {
          product_id: 'prod123',
          unanswered: 'true',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
        { page: 2, limit: 15, sort_by: 'created_at', order: 'desc' },
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith({
        message: 'Lấy danh sách câu hỏi thành công',
        data: mockData,
      })
    })

    it('should use default pagination values', async () => {
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()
      const mockData = { items: [], total: 0 }

      ;(qaService.adminGetQuestions as jest.Mock).mockResolvedValue(mockData)

      await adminGetQuestions(req as Request, res as Response)

      expect(qaService.adminGetQuestions).toHaveBeenCalledWith(
        {
          product_id: undefined,
          unanswered: undefined,
          start_date: undefined,
          end_date: undefined,
        },
        { page: 1, limit: 20, sort_by: undefined, order: undefined },
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('adminDeleteQuestion', () => {
    it('should delete a question successfully', async () => {
      const req = createMockRequest({ params: { id: 'q123' } })
      const res = createMockResponse()
      const mockData = { success: true }

      ;(qaService.adminDeleteQuestion as jest.Mock).mockResolvedValue(mockData)

      await adminDeleteQuestion(req as any, res as Response)

      expect(qaService.adminDeleteQuestion).toHaveBeenCalledWith('q123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith({
        message: 'Xóa câu hỏi thành công',
        data: mockData,
      })
    })

    it('should handle NotFoundError', async () => {
      const req = createMockRequest({ params: { id: 'q999' } })
      const res = createMockResponse()

      ;(qaService.adminDeleteQuestion as jest.Mock).mockRejectedValue(
        new NotFoundError('Question not found'),
      )

      await expect(adminDeleteQuestion(req as any, res as Response)).rejects.toThrow()
    })
  })

  describe('adminDeleteAnswer', () => {
    it('should delete an answer successfully', async () => {
      const req = createMockRequest({ params: { question_id: 'q123', answer_id: 'a456' } })
      const res = createMockResponse()
      const mockData = { success: true }

      ;(qaService.adminDeleteAnswer as jest.Mock).mockResolvedValue(mockData)

      await adminDeleteAnswer(req as any, res as Response)

      expect(qaService.adminDeleteAnswer).toHaveBeenCalledWith('q123', 'a456')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith({
        message: 'Xóa câu trả lời thành công',
        data: mockData,
      })
    })

    it('should handle ValidationError', async () => {
      const req = createMockRequest({ params: { question_id: 'q123', answer_id: 'a456' } })
      const res = createMockResponse()

      ;(qaService.adminDeleteAnswer as jest.Mock).mockRejectedValue(
        new ValidationError('Invalid answer'),
      )

      await expect(adminDeleteAnswer(req as any, res as Response)).rejects.toThrow()
    })
  })

  describe('adminGetQAStats', () => {
    it('should get QA statistics', async () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const mockData = { total_questions: 100, total_answers: 80, unanswered: 20 }

      ;(qaService.adminGetStats as jest.Mock).mockResolvedValue(mockData)

      await adminGetQAStats(req as Request, res as Response)

      expect(qaService.adminGetStats).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith({
        message: 'Lấy thống kê Q&A thành công',
        data: mockData,
      })
    })
  })
})
