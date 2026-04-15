/// <reference types="jest" />
import { Request, Response } from 'express'

jest.mock('../../container', () => ({
  container: {
    services: {
      loyalty: {
        getPoints: jest.fn(),
        getTransactions: jest.fn(),
        getRewards: jest.fn(),
        redeemPoints: jest.fn(),
      },
    },
  },
}))

import { container } from '../../container'
import {
  getPoints,
  getTransactions,
  getRewards,
  redeemPoints,
} from '../../controllers/loyalty.controller'

const mockLoyaltyService = container.services.loyalty as jest.Mocked<
  typeof container.services.loyalty
>

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

describe('Loyalty Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPoints', () => {
    it('should return points and tier info successfully', async () => {
      const mockResult = {
        points: {
          _id: 'points-123',
          user: 'user123',
          total_points: 500,
          available_points: 500,
          tier: 'bronze',
          lifetime_points: 1000,
        },
        tier_info: { min: 0, max: 999, next_tier: 'silver', points_to_next: 0 },
      }
      mockLoyaltyService.getPoints.mockResolvedValue(mockResult as any)
      const req = createMockRequest()
      const res = createMockResponse()

      await getPoints(req as Request, res as Response)

      expect(mockLoyaltyService.getPoints).toHaveBeenCalledWith('user123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy thông tin điểm thành công',
        data: { ...mockResult.points, tier_info: mockResult.tier_info },
      })
    })

    it('should propagate service errors', async () => {
      const error = new Error('Service error')
      mockLoyaltyService.getPoints.mockRejectedValue(error)
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getPoints(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('getTransactions', () => {
    const mockTransactionsResult = {
      data: [
        {
          _id: 'tx1',
          user: 'user123',
          type: 'earn',
          points: 100,
          description: 'Purchase reward',
          created_at: new Date(),
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
    }

    it('should return transactions with default pagination', async () => {
      mockLoyaltyService.getTransactions.mockResolvedValue(mockTransactionsResult as any)
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getTransactions(req as Request, res as Response)

      expect(mockLoyaltyService.getTransactions).toHaveBeenCalledWith(
        'user123',
        { type: undefined },
        { page: 1, limit: 10 },
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy lịch sử giao dịch điểm thành công',
        data: {
          transactions: mockTransactionsResult.data,
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        },
      })
    })

    it('should handle custom pagination and type filter', async () => {
      mockLoyaltyService.getTransactions.mockResolvedValue(mockTransactionsResult as any)
      const req = createMockRequest({ query: { page: '2', limit: '20', type: 'earn' } })
      const res = createMockResponse()

      await getTransactions(req as Request, res as Response)

      expect(mockLoyaltyService.getTransactions).toHaveBeenCalledWith(
        'user123',
        { type: 'earn' },
        { page: 2, limit: 20 },
      )
    })

    it('should propagate service errors', async () => {
      mockLoyaltyService.getTransactions.mockRejectedValue(new Error('Transaction error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getTransactions(req as Request, res as Response)).rejects.toThrow(
        'Transaction error',
      )
    })
  })

  describe('getRewards', () => {
    const mockRewardsResult = {
      data: [
        {
          _id: 'reward1',
          name: 'Discount',
          description: '10% off',
          points_required: 100,
          reward_type: 'discount',
          reward_value: 10,
          stock: 100,
          is_active: true,
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
    }

    it('should return rewards with default pagination', async () => {
      mockLoyaltyService.getRewards.mockResolvedValue(mockRewardsResult as any)
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getRewards(req as Request, res as Response)

      expect(mockLoyaltyService.getRewards).toHaveBeenCalledWith(
        { reward_type: undefined },
        { page: 1, limit: 10 },
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách phần thưởng thành công',
        data: {
          rewards: mockRewardsResult.data,
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        },
      })
    })

    it('should handle custom pagination and reward_type filter', async () => {
      mockLoyaltyService.getRewards.mockResolvedValue(mockRewardsResult as any)
      const req = createMockRequest({ query: { page: '3', limit: '5', reward_type: 'voucher' } })
      const res = createMockResponse()

      await getRewards(req as Request, res as Response)

      expect(mockLoyaltyService.getRewards).toHaveBeenCalledWith(
        { reward_type: 'voucher' },
        { page: 3, limit: 5 },
      )
    })

    it('should propagate service errors', async () => {
      mockLoyaltyService.getRewards.mockRejectedValue(new Error('Rewards error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getRewards(req as Request, res as Response)).rejects.toThrow('Rewards error')
    })
  })

  describe('redeemPoints', () => {
    it('should redeem points successfully', async () => {
      const mockResult = {
        _id: 'tx-red1',
        user: 'user123',
        type: 'redeem',
        points: -100,
        description: 'Redeemed reward: Discount',
        reward_id: 'reward1',
        created_at: new Date(),
      }
      mockLoyaltyService.redeemPoints.mockResolvedValue(mockResult as any)
      const req = createMockRequest({ params: { rewardId: 'reward1' } })
      const res = createMockResponse()

      await redeemPoints(req as Request, res as Response)

      expect(mockLoyaltyService.redeemPoints).toHaveBeenCalledWith('user123', 'reward1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Đổi điểm thành công', data: mockResult })
    })

    it('should propagate service errors', async () => {
      mockLoyaltyService.redeemPoints.mockRejectedValue(new Error('Insufficient points'))
      const req = createMockRequest({ params: { rewardId: 'reward1' } })
      const res = createMockResponse()

      await expect(redeemPoints(req as Request, res as Response)).rejects.toThrow(
        'Insufficient points',
      )
    })
  })
})
