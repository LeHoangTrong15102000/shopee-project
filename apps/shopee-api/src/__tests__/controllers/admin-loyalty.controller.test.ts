/// <reference types="jest" />
import { Request, Response } from 'express'
import {
  adminGetRewards,
  adminCreateReward,
  adminUpdateReward,
  adminDeleteReward,
  adminToggleReward,
  adminAdjustPoints,
  adminGetTransactions,
  adminGetLoyaltyStats,
} from '../../controllers/admin-loyalty.controller'
import { loyaltyService } from '../../container'
import { ValidationError, NotFoundError, BusinessError } from '@services/base.service'

jest.mock('../../container', () => ({
  loyaltyService: {
    adminGetRewards: jest.fn(),
    adminCreateReward: jest.fn(),
    adminUpdateReward: jest.fn(),
    adminDeleteReward: jest.fn(),
    adminToggleReward: jest.fn(),
    adminAdjustPoints: jest.fn(),
    adminGetTransactions: jest.fn(),
    adminGetStats: jest.fn(),
  },
}))

const createMockRequest = (overrides = {}): Partial<Request> => ({
  query: {},
  params: {},
  body: {},
  ...overrides,
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }
  return res
}

describe('Admin Loyalty Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('adminGetRewards', () => {
    it('should get rewards with filters and pagination', async () => {
      const req = createMockRequest({
        query: {
          page: '1',
          limit: '10',
          sort_by: 'created_at',
          order: 'desc',
          reward_type: 'discount',
          is_active: 'true',
        },
      })
      const res = createMockResponse()

      const mockData = {
        rewards: [{ id: 1, name: 'Test Reward', points: 100 }],
        total: 1,
      }
      ;(loyaltyService.adminGetRewards as jest.Mock).mockResolvedValue(mockData)

      await adminGetRewards(req as Request, res as Response)

      expect(loyaltyService.adminGetRewards).toHaveBeenCalledWith(
        {
          reward_type: 'discount',
          is_active: 'true',
        },
        {
          page: 1,
          limit: 10,
          sort_by: 'created_at',
          order: 'desc',
        }
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalled()
    })
  })

  describe('adminCreateReward', () => {
    it('should create a reward successfully', async () => {
      const req = createMockRequest({
        body: {
          name: 'New Reward',
          points: 100,
          reward_type: 'discount',
        },
      })
      const res = createMockResponse()

      const mockReward = { id: 1, name: 'New Reward', points: 100 }
      ;(loyaltyService.adminCreateReward as jest.Mock).mockResolvedValue(mockReward)

      await adminCreateReward(req as Request, res as Response)

      expect(loyaltyService.adminCreateReward).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalled()
    })

    it('should handle validation error', async () => {
      const req = createMockRequest({
        body: { name: '' },
      })
      const res = createMockResponse()

      ;(loyaltyService.adminCreateReward as jest.Mock).mockRejectedValue(
        new ValidationError('Name is required')
      )

      await expect(adminCreateReward(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminUpdateReward', () => {
    it('should update a reward successfully', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        body: { name: 'Updated Reward', points: 150 },
      })
      const res = createMockResponse()

      const mockReward = { id: 1, name: 'Updated Reward', points: 150 }
      ;(loyaltyService.adminUpdateReward as jest.Mock).mockResolvedValue(mockReward)

      await adminUpdateReward(req as Request, res as Response)

      expect(loyaltyService.adminUpdateReward).toHaveBeenCalledWith('1', req.body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalled()
    })

    it('should handle not found error', async () => {
      const req = createMockRequest({
        params: { id: '999' },
        body: { name: 'Updated Reward' },
      })
      const res = createMockResponse()

      ;(loyaltyService.adminUpdateReward as jest.Mock).mockRejectedValue(
        new NotFoundError('Reward not found')
      )

      await expect(adminUpdateReward(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminDeleteReward', () => {
    it('should delete a reward successfully', async () => {
      const req = createMockRequest({
        params: { id: '1' },
      })
      const res = createMockResponse()

      ;(loyaltyService.adminDeleteReward as jest.Mock).mockResolvedValue({ success: true })

      await adminDeleteReward(req as Request, res as Response)

      expect(loyaltyService.adminDeleteReward).toHaveBeenCalledWith('1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalled()
    })

    it('should handle not found error', async () => {
      const req = createMockRequest({
        params: { id: '999' },
      })
      const res = createMockResponse()

      ;(loyaltyService.adminDeleteReward as jest.Mock).mockRejectedValue(
        new NotFoundError('Reward not found')
      )

      await expect(adminDeleteReward(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminToggleReward', () => {
    it('should toggle reward status successfully', async () => {
      const req = createMockRequest({
        params: { id: '1' },
      })
      const res = createMockResponse()

      const mockReward = { id: 1, is_active: false }
      ;(loyaltyService.adminToggleReward as jest.Mock).mockResolvedValue(mockReward)

      await adminToggleReward(req as Request, res as Response)

      expect(loyaltyService.adminToggleReward).toHaveBeenCalledWith('1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalled()
    })

    it('should handle business error', async () => {
      const req = createMockRequest({
        params: { id: '1' },
      })
      const res = createMockResponse()

      ;(loyaltyService.adminToggleReward as jest.Mock).mockRejectedValue(
        new BusinessError('Cannot toggle reward')
      )

      await expect(adminToggleReward(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminAdjustPoints', () => {
    it('should adjust user points successfully', async () => {
      const req = createMockRequest({
        body: {
          user_id: 1,
          points: 100,
          type: 'add',
          description: 'Bonus points',
        },
      })
      const res = createMockResponse()

      const mockTransaction = { id: 1, user_id: 1, points: 100, type: 'add' }
      ;(loyaltyService.adminAdjustPoints as jest.Mock).mockResolvedValue(mockTransaction)

      await adminAdjustPoints(req as Request, res as Response)

      expect(loyaltyService.adminAdjustPoints).toHaveBeenCalledWith(1, 100, 'add', 'Bonus points')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalled()
    })

    it('should handle validation error', async () => {
      const req = createMockRequest({
        body: {
          user_id: 1,
          points: -100,
          type: 'invalid',
        },
      })
      const res = createMockResponse()

      ;(loyaltyService.adminAdjustPoints as jest.Mock).mockRejectedValue(
        new ValidationError('Invalid adjustment type')
      )

      await expect(adminAdjustPoints(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminGetTransactions', () => {
    it('should get transactions with filters and pagination', async () => {
      const req = createMockRequest({
        query: {
          page: '1',
          limit: '20',
          sort_by: 'created_at',
          order: 'desc',
          type: 'earn',
          user_id: '5',
        },
      })
      const res = createMockResponse()

      const mockData = {
        transactions: [{ id: 1, user_id: 5, points: 50, type: 'earn' }],
        total: 1,
      }
      ;(loyaltyService.adminGetTransactions as jest.Mock).mockResolvedValue(mockData)

      await adminGetTransactions(req as Request, res as Response)

      expect(loyaltyService.adminGetTransactions).toHaveBeenCalledWith(
        {
          type: 'earn',
          user_id: '5',
        },
        {
          page: 1,
          limit: 20,
          sort_by: 'created_at',
          order: 'desc',
        }
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalled()
    })
  })

  describe('adminGetLoyaltyStats', () => {
    it('should get loyalty statistics successfully', async () => {
      const req = createMockRequest()
      const res = createMockResponse()

      const mockStats = {
        total_users: 100,
        total_points_issued: 5000,
        total_rewards_redeemed: 50,
      }
      ;(loyaltyService.adminGetStats as jest.Mock).mockResolvedValue(mockStats)

      await adminGetLoyaltyStats(req as Request, res as Response)

      expect(loyaltyService.adminGetStats).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalled()
    })
  })
})
