/// <reference types="jest" />
import { Request, Response } from 'express'

const mockAdminGetUsers = jest.fn()
const mockAdminGetLeaderboard = jest.fn()
const mockAdminGetDailyStats = jest.fn()

jest.mock('../../container', () => ({
  container: {
    services: {
      checkin: {
        adminGetUsers: mockAdminGetUsers,
        adminGetLeaderboard: mockAdminGetLeaderboard,
        adminGetDailyStats: mockAdminGetDailyStats,
      },
      price: {},
    },
  },
}))

jest.mock('@utils/response', () => ({
  responseSuccess: jest.fn((res: any, { data }: any = {}) => {
    res.status(200).send({ data })
  }),
}))

import {
  adminGetCheckinUsers,
  adminGetCheckinLeaderboard,
  adminGetCheckinDailyStats,
} from '../../controllers/admin-checkin.controller'

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

describe('AdminCheckinController', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('adminGetCheckinUsers', () => {
    it('forwards pagination and search params to service', async () => {
      mockAdminGetUsers.mockResolvedValue({ data: [], pagination: {} })

      const req = createMockRequest({
        query: { page: '2', limit: '10', search: 'john' },
      })
      const res = createMockResponse()

      await adminGetCheckinUsers(req as Request, res as Response)

      expect(mockAdminGetUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'john',
      })
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('uses default page 1 and limit 20 when not provided', async () => {
      mockAdminGetUsers.mockResolvedValue({ data: [], pagination: {} })

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await adminGetCheckinUsers(req as Request, res as Response)

      expect(mockAdminGetUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      )
    })
  })

  describe('adminGetCheckinLeaderboard', () => {
    it('calls service and returns 200', async () => {
      mockAdminGetLeaderboard.mockResolvedValue([{ user_id: 'u1', streak: 30, total_points: 500 }])

      const req = createMockRequest()
      const res = createMockResponse()

      await adminGetCheckinLeaderboard(req as Request, res as Response)

      expect(mockAdminGetLeaderboard).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('adminGetCheckinDailyStats', () => {
    it('calls service and returns 200', async () => {
      mockAdminGetDailyStats.mockResolvedValue([
        { date: '2026-05-01', count: 150 },
        { date: '2026-05-02', count: 200 },
      ])

      const req = createMockRequest()
      const res = createMockResponse()

      await adminGetCheckinDailyStats(req as Request, res as Response)

      expect(mockAdminGetDailyStats).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})
