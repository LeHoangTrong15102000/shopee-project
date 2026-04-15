/// <reference types="jest" />

import { Types } from 'mongoose'

const mockUserId = new Types.ObjectId().toString()
const mockRewardId = new Types.ObjectId().toString()
const mockPoints = {
  _id: new Types.ObjectId(),
  user: mockUserId,
  total_points: 100,
  available_points: 50,
  tier: 'BRONZE',
}
const mockTransaction = { _id: new Types.ObjectId(), user: mockUserId, points: 10, type: 'EARN' }
const mockReward = { _id: mockRewardId, name: 'Discount', points_required: 100, stock: 10 }

const chainMock = (resolvedValue: any) => ({
  populate: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(resolvedValue),
  exec: jest.fn().mockResolvedValue(resolvedValue),
})

jest.mock('@database/models/loyalty.model', () => {
  const mockLoyaltyPointsModel: any = jest.fn()
  mockLoyaltyPointsModel.findOne = jest.fn()
  mockLoyaltyPointsModel.findOneAndUpdate = jest.fn()

  const mockPointsTransactionModel: any = jest.fn()
  mockPointsTransactionModel.find = jest.fn()
  mockPointsTransactionModel.countDocuments = jest.fn()

  const mockPointsRewardModel: any = jest.fn()
  mockPointsRewardModel.findById = jest.fn()
  mockPointsRewardModel.find = jest.fn()
  mockPointsRewardModel.findByIdAndUpdate = jest.fn()
  mockPointsRewardModel.countDocuments = jest.fn()

  return {
    LoyaltyPointsModel: mockLoyaltyPointsModel,
    PointsTransactionModel: mockPointsTransactionModel,
    PointsRewardModel: mockPointsRewardModel,
    LOYALTY_TIER: { BRONZE: 'bronze', SILVER: 'silver', GOLD: 'gold', PLATINUM: 'platinum' },
    POINTS_TRANSACTION_TYPE: { EARN: 'earn', REDEEM: 'redeem', EXPIRE: 'expire', BONUS: 'bonus' },
    REWARD_TYPE: { VOUCHER: 'voucher', GIFT: 'gift', DISCOUNT: 'discount' },
  }
})

import {
  LoyaltyPointsModel,
  PointsTransactionModel,
  PointsRewardModel,
} from '@database/models/loyalty.model'
import { LoyaltyRepository } from '@repositories/loyalty.repository'

describe('LoyaltyRepository', () => {
  let repository: LoyaltyRepository

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup constructor mocks for create operations
    ;(LoyaltyPointsModel as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ toObject: () => mockPoints }),
    }))
    ;(PointsTransactionModel as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ toObject: () => mockTransaction }),
    }))
    ;(PointsRewardModel as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ toObject: () => mockReward }),
    }))
    repository = new LoyaltyRepository()
  })

  describe('findPointsByUser', () => {
    it('should find points by user', async () => {
      ;(LoyaltyPointsModel.findOne as jest.Mock).mockReturnValue(chainMock(mockPoints))
      const result = await repository.findPointsByUser(mockUserId)
      expect(LoyaltyPointsModel.findOne).toHaveBeenCalled()
      expect(result).toEqual(mockPoints)
    })
  })

  describe('createPoints', () => {
    it('should create points for user', async () => {
      const result = await repository.createPoints(mockUserId)
      expect(result).toEqual(mockPoints)
    })
  })

  describe('updatePoints', () => {
    it('should update points', async () => {
      ;(LoyaltyPointsModel.findOneAndUpdate as jest.Mock).mockReturnValue(chainMock(mockPoints))
      const result = await repository.updatePoints(mockUserId, { total_points: 200 })
      expect(LoyaltyPointsModel.findOneAndUpdate).toHaveBeenCalled()
      expect(result).toEqual(mockPoints)
    })
  })

  describe('findTransactionsByUser', () => {
    it('should find transactions by user', async () => {
      ;(PointsTransactionModel.find as jest.Mock).mockReturnValue(chainMock([mockTransaction]))
      ;(PointsTransactionModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findTransactionsByUser(mockUserId, {}, { page: 1, limit: 10 })
      expect(result.data).toEqual([mockTransaction])
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by type', async () => {
      ;(PointsTransactionModel.find as jest.Mock).mockReturnValue(chainMock([mockTransaction]))
      ;(PointsTransactionModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findTransactionsByUser(
        mockUserId,
        { type: 'earn' },
        { page: 1, limit: 10 },
      )
      expect(result.data).toEqual([mockTransaction])
    })
  })

  describe('createTransaction', () => {
    it('should create transaction', async () => {
      const result = await repository.createTransaction({
        user: mockUserId,
        points: 10,
        type: 'earn',
      } as any)
      expect(result).toEqual(mockTransaction)
    })
  })

  describe('findRewardById', () => {
    it('should find reward by id', async () => {
      ;(PointsRewardModel.findById as jest.Mock).mockReturnValue(chainMock(mockReward))
      const result = await repository.findRewardById(mockRewardId)
      expect(PointsRewardModel.findById).toHaveBeenCalledWith(mockRewardId)
      expect(result).toEqual(mockReward)
    })
  })

  describe('findRewards', () => {
    it('should find rewards with filters', async () => {
      ;(PointsRewardModel.find as jest.Mock).mockReturnValue(chainMock([mockReward]))
      ;(PointsRewardModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findRewards({ is_active: true }, { page: 1, limit: 10 })
      expect(result.data).toEqual([mockReward])
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by in_stock', async () => {
      ;(PointsRewardModel.find as jest.Mock).mockReturnValue(chainMock([mockReward]))
      ;(PointsRewardModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findRewards({ in_stock: true }, { page: 1, limit: 10 })
      expect(result.data).toEqual([mockReward])
    })

    it('should filter by reward_type', async () => {
      ;(PointsRewardModel.find as jest.Mock).mockReturnValue(chainMock([mockReward]))
      ;(PointsRewardModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findRewards(
        { reward_type: 'discount' },
        { page: 1, limit: 10 },
      )
      expect(result.data).toEqual([mockReward])
    })
  })

  describe('updateRewardStock', () => {
    it('should update reward stock', async () => {
      ;(PointsRewardModel.findByIdAndUpdate as jest.Mock).mockReturnValue(
        chainMock({ ...mockReward, stock: 9 }),
      )
      const result = await repository.updateRewardStock(mockRewardId, 1)
      expect(PointsRewardModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockRewardId,
        { $inc: { stock: -1 } },
        { new: true },
      )
      expect(result?.stock).toBe(9)
    })
  })
})
