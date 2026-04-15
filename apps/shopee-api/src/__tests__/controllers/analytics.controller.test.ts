/// <reference types="jest" />
import { Request, Response } from 'express'

jest.mock('../../database/models/conversation.model', () => ({
  ConversationModel: {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}))

jest.mock('../../utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

jest.mock('../../middleware/rateLimiter.middleware', () => ({
  getRateLimitStats: jest.fn(),
}))

import { ConversationModel } from '../../database/models/conversation.model'
import { getRateLimitStats } from '../../middleware/rateLimiter.middleware'
import {
  getChatbotOverview,
  getChatbotPerformance,
  getHealthCheck,
} from '../../controllers/analytics.controller'

const mockConversationModel = ConversationModel as jest.Mocked<typeof ConversationModel>
const mockGetRateLimitStats = getRateLimitStats as jest.MockedFunction<typeof getRateLimitStats>

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

describe('Analytics Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getChatbotOverview', () => {
    it('should return overview data successfully', async () => {
      mockConversationModel.countDocuments
        .mockResolvedValueOnce(100 as any)
        .mockResolvedValueOnce(10 as any)
        .mockResolvedValueOnce(50 as any)
        .mockResolvedValueOnce(80 as any)
        .mockResolvedValueOnce(70 as any)
        .mockResolvedValueOnce(30 as any)

      mockConversationModel.aggregate
        .mockResolvedValueOnce([
          {
            totalMessages: 500,
            totalUserMessages: 250,
            totalAssistantMessages: 250,
            avgMessagesPerConversation: 5,
            maxMessagesInConversation: 20,
          },
        ] as any)
        .mockResolvedValueOnce([
          {
            userId: 'user1',
            userName: 'Test User',
            userEmail: 'test@test.com',
            conversationCount: 5,
            totalMessages: 25,
            lastActivity: new Date(),
          },
        ] as any)

      mockGetRateLimitStats.mockReturnValue({
        totalRequests: 1000,
        blockedRequests: 10,
      } as any)

      const req = createMockRequest()
      const res = createMockResponse()

      await getChatbotOverview(req as Request, res as Response)

      expect(mockConversationModel.countDocuments).toHaveBeenCalledTimes(6)
      expect(mockConversationModel.aggregate).toHaveBeenCalledTimes(2)
      expect(mockGetRateLimitStats).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Lấy thống kê chatbot thành công',
          data: expect.objectContaining({
            conversations: expect.any(Object),
            messages: expect.any(Object),
            topUsers: expect.any(Array),
            rateLimiting: expect.any(Object),
            systemHealth: expect.any(Object),
          }),
        }),
      )
    })

    it('should return 500 on error', async () => {
      mockConversationModel.countDocuments.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest()
      const res = createMockResponse()

      await getChatbotOverview(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Lỗi server khi lấy thống kê chatbot',
          error: 'Database error',
        }),
      )
    })
  })

  describe('getChatbotPerformance', () => {
    const mockPerformanceData = [
      {
        date: { year: 2024, month: 1, day: 15 },
        conversationCount: 10,
        totalMessages: 50,
        uniqueUserCount: 5,
        avgResponseTime: 2.5,
      },
    ]

    it('should return performance data with default period (7d)', async () => {
      mockConversationModel.aggregate.mockResolvedValue(mockPerformanceData as any)

      const req = createMockRequest()
      const res = createMockResponse()

      await getChatbotPerformance(req as Request, res as Response)

      expect(mockConversationModel.aggregate).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Lấy thống kê performance thành công',
          data: expect.objectContaining({
            period: '7d',
            performance: mockPerformanceData,
          }),
        }),
      )
    })

    it('should return performance data with 24h period', async () => {
      mockConversationModel.aggregate.mockResolvedValue(mockPerformanceData as any)

      const req = createMockRequest({ query: { period: '24h' } })
      const res = createMockResponse()

      await getChatbotPerformance(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ period: '24h' }),
        }),
      )
    })

    it('should return performance data with 30d period', async () => {
      mockConversationModel.aggregate.mockResolvedValue(mockPerformanceData as any)

      const req = createMockRequest({ query: { period: '30d' } })
      const res = createMockResponse()

      await getChatbotPerformance(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ period: '30d' }),
        }),
      )
    })

    it('should return 500 on error', async () => {
      mockConversationModel.aggregate.mockRejectedValue(new Error('Aggregation error'))

      const req = createMockRequest()
      const res = createMockResponse()

      await getChatbotPerformance(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Lỗi server khi lấy thống kê performance',
          error: 'Aggregation error',
        }),
      )
    })
  })

  describe('getHealthCheck', () => {
    it('should return health data successfully', async () => {
      const req = createMockRequest()
      const res = createMockResponse()

      await getHealthCheck(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          memory: expect.any(Object),
          services: expect.objectContaining({
            chatbot: 'operational',
            database: 'operational',
            rateLimit: 'operational',
          }),
        }),
      )
    })

    it('should return 503 on error', async () => {
      const originalUptime = process.uptime
      process.uptime = jest.fn().mockImplementation(() => {
        throw new Error('System error')
      })

      const req = createMockRequest()
      const res = createMockResponse()

      await getHealthCheck(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(503)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          error: 'System error',
          timestamp: expect.any(String),
        }),
      )

      process.uptime = originalUptime
    })
  })
})
