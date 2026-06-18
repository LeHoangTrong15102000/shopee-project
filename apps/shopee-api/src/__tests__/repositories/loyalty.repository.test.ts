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
  mockLoyaltyPointsModel.countDocuments = jest.fn()
  mockLoyaltyPointsModel.aggregate = jest.fn()

  const mockPointsTransactionModel: any = jest.fn()
  mockPointsTransactionModel.find = jest.fn()
  mockPointsTransactionModel.countDocuments = jest.fn()
  mockPointsTransactionModel.aggregate = jest.fn()

  const mockPointsRewardModel: any = jest.fn()
  mockPointsRewardModel.findById = jest.fn()
  mockPointsRewardModel.find = jest.fn()
  mockPointsRewardModel.findByIdAndUpdate = jest.fn()
  mockPointsRewardModel.findByIdAndDelete = jest.fn()
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

  // ─── Basic Points ──────────────────────────────────────────────

  describe('findPointsByUser', () => {
    it('should find points by user', async () => {
      ;(LoyaltyPointsModel.findOne as jest.Mock).mockReturnValue(chainMock(mockPoints))
      const result = await repository.findPointsByUser(mockUserId)
      expect(LoyaltyPointsModel.findOne).toHaveBeenCalled()
      expect(result).toEqual(mockPoints)
    })

    it('should accept a Types.ObjectId', async () => {
      ;(LoyaltyPointsModel.findOne as jest.Mock).mockReturnValue(chainMock(null))
      const result = await repository.findPointsByUser(new Types.ObjectId(mockUserId))
      expect(result).toBeNull()
    })
  })

  describe('createPoints', () => {
    it('should create points for user', async () => {
      const result = await repository.createPoints(mockUserId)
      expect(result).toEqual(mockPoints)
    })

    it('should accept a Types.ObjectId as userId', async () => {
      const result = await repository.createPoints(new Types.ObjectId())
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

    it('should return null when user points not found', async () => {
      ;(LoyaltyPointsModel.findOneAndUpdate as jest.Mock).mockReturnValue(chainMock(null))
      const result = await repository.updatePoints(mockUserId, { available_points: 0 })
      expect(result).toBeNull()
    })
  })

  // ─── Transactions ──────────────────────────────────────────────

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

    it('should use custom sort when provided', async () => {
      ;(PointsTransactionModel.find as jest.Mock).mockReturnValue(chainMock([]))
      ;(PointsTransactionModel.countDocuments as jest.Mock).mockResolvedValue(0)
      const result = await repository.findTransactionsByUser(
        mockUserId,
        {},
        { page: 2, limit: 5, sort: { created_at: 1 } },
      )
      expect(result.pagination.page).toBe(2)
      expect(result.pagination.limit).toBe(5)
    })

    it('should calculate page_size correctly', async () => {
      ;(PointsTransactionModel.find as jest.Mock).mockReturnValue(chainMock([]))
      ;(PointsTransactionModel.countDocuments as jest.Mock).mockResolvedValue(0)
      const result = await repository.findTransactionsByUser(mockUserId, {}, { page: 1, limit: 10 })
      expect(result.pagination.page_size).toBe(1) // fallback for 0 total
    })

    it('should accept Types.ObjectId as userId', async () => {
      ;(PointsTransactionModel.find as jest.Mock).mockReturnValue(chainMock([]))
      ;(PointsTransactionModel.countDocuments as jest.Mock).mockResolvedValue(0)
      const result = await repository.findTransactionsByUser(
        new Types.ObjectId(),
        {},
        { page: 1, limit: 10 },
      )
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('createTransaction', () => {
    it('should create transaction without order_id or reward_id', async () => {
      const result = await repository.createTransaction({
        user: mockUserId,
        points: 10,
        type: 'earn',
      } as any)
      expect(result).toEqual(mockTransaction)
    })

    it('should create transaction with order_id and reward_id', async () => {
      const result = await repository.createTransaction({
        user: mockUserId,
        points: 10,
        type: 'earn',
        order_id: new Types.ObjectId().toString(),
        reward_id: new Types.ObjectId().toString(),
      } as any)
      expect(result).toEqual(mockTransaction)
    })
  })

  // ─── Rewards ──────────────────────────────────────────────────

  describe('findRewardById', () => {
    it('should find reward by id', async () => {
      ;(PointsRewardModel.findById as jest.Mock).mockReturnValue(chainMock(mockReward))
      const result = await repository.findRewardById(mockRewardId)
      expect(PointsRewardModel.findById).toHaveBeenCalledWith(mockRewardId)
      expect(result).toEqual(mockReward)
    })

    it('should return null when reward not found', async () => {
      ;(PointsRewardModel.findById as jest.Mock).mockReturnValue(chainMock(null))
      const result = await repository.findRewardById(mockRewardId)
      expect(result).toBeNull()
    })
  })

  describe('findRewards', () => {
    it('should find rewards with no filters', async () => {
      ;(PointsRewardModel.find as jest.Mock).mockReturnValue(chainMock([mockReward]))
      ;(PointsRewardModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findRewards({}, { page: 1, limit: 10 })
      expect(result.data).toEqual([mockReward])
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by is_active', async () => {
      ;(PointsRewardModel.find as jest.Mock).mockReturnValue(chainMock([mockReward]))
      ;(PointsRewardModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findRewards({ is_active: true }, { page: 1, limit: 10 })
      expect(result.data).toEqual([mockReward])
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

    it('should use custom sort when provided', async () => {
      ;(PointsRewardModel.find as jest.Mock).mockReturnValue(chainMock([]))
      ;(PointsRewardModel.countDocuments as jest.Mock).mockResolvedValue(0)
      const result = await repository.findRewards({}, { page: 1, limit: 5, sort: { name: 1 } })
      expect(result.pagination.page_size).toBe(1)
    })
  })

  describe('updateRewardStock', () => {
    it('should decrement reward stock', async () => {
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

    it('should return null when reward not found', async () => {
      ;(PointsRewardModel.findByIdAndUpdate as jest.Mock).mockReturnValue(chainMock(null))
      const result = await repository.updateRewardStock(mockRewardId, 1)
      expect(result).toBeNull()
    })
  })

  // ─── Admin Methods ─────────────────────────────────────────────

  describe('findRewardsWithFilters', () => {
    it('should return paginated rewards with no filters', async () => {
      ;(PointsRewardModel.find as jest.Mock).mockReturnValue(chainMock([mockReward]))
      ;(PointsRewardModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findRewardsWithFilters({}, { page: 1, limit: 10 })
      expect(result.data).toEqual([mockReward])
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by reward_type', async () => {
      ;(PointsRewardModel.find as jest.Mock).mockReturnValue(chainMock([mockReward]))
      ;(PointsRewardModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findRewardsWithFilters(
        { reward_type: 'voucher' },
        { page: 1, limit: 5 },
      )
      expect(result.data).toEqual([mockReward])
    })

    it('should filter by is_active=true', async () => {
      ;(PointsRewardModel.find as jest.Mock).mockReturnValue(chainMock([mockReward]))
      ;(PointsRewardModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findRewardsWithFilters(
        { is_active: 'true' },
        { page: 1, limit: 5 },
      )
      expect(result.data).toEqual([mockReward])
    })

    it('should sort ascending when order=asc', async () => {
      ;(PointsRewardModel.find as jest.Mock).mockReturnValue(chainMock([]))
      ;(PointsRewardModel.countDocuments as jest.Mock).mockResolvedValue(0)
      const result = await repository.findRewardsWithFilters(
        {},
        { page: 1, limit: 10, sort_by: 'name', order: 'asc' },
      )
      expect(result.pagination.page_size).toBe(1)
    })

    it('should default to desc order and createdAt sort', async () => {
      ;(PointsRewardModel.find as jest.Mock).mockReturnValue(chainMock([]))
      ;(PointsRewardModel.countDocuments as jest.Mock).mockResolvedValue(0)
      const result = await repository.findRewardsWithFilters({}, { page: 1, limit: 10 })
      expect(result.pagination).toBeDefined()
    })
  })

  describe('createReward', () => {
    it('should create a reward and set is_active to true', async () => {
      const result = await repository.createReward({
        name: 'Gift Card',
        points_required: 200,
      } as any)
      expect(result).toEqual(mockReward)
    })
  })

  describe('updateReward', () => {
    it('should update a reward by id', async () => {
      const updated = { ...mockReward, name: 'Updated Reward' }
      ;(PointsRewardModel.findByIdAndUpdate as jest.Mock).mockReturnValue(chainMock(updated))
      const result = await repository.updateReward(mockRewardId, { name: 'Updated Reward' } as any)
      expect(PointsRewardModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockRewardId,
        { name: 'Updated Reward' },
        { new: true },
      )
      expect(result?.name).toBe('Updated Reward')
    })

    it('should return null when reward not found', async () => {
      ;(PointsRewardModel.findByIdAndUpdate as jest.Mock).mockReturnValue(chainMock(null))
      const result = await repository.updateReward(mockRewardId, {} as any)
      expect(result).toBeNull()
    })
  })

  describe('deleteReward', () => {
    it('should delete a reward by id', async () => {
      ;(PointsRewardModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null)
      await expect(repository.deleteReward(mockRewardId)).resolves.toBeUndefined()
      expect(PointsRewardModel.findByIdAndDelete).toHaveBeenCalledWith(mockRewardId)
    })
  })

  describe('findAllTransactions', () => {
    it('should return paginated transactions with no filters', async () => {
      ;(PointsTransactionModel.find as jest.Mock).mockReturnValue(chainMock([mockTransaction]))
      ;(PointsTransactionModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findAllTransactions({}, { page: 1, limit: 10 })
      expect(result.data).toEqual([mockTransaction])
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by type', async () => {
      ;(PointsTransactionModel.find as jest.Mock).mockReturnValue(chainMock([mockTransaction]))
      ;(PointsTransactionModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findAllTransactions({ type: 'earn' }, { page: 1, limit: 10 })
      expect(result.data).toEqual([mockTransaction])
    })

    it('should filter by user_id', async () => {
      ;(PointsTransactionModel.find as jest.Mock).mockReturnValue(chainMock([mockTransaction]))
      ;(PointsTransactionModel.countDocuments as jest.Mock).mockResolvedValue(1)
      const result = await repository.findAllTransactions(
        { user_id: mockUserId },
        { page: 1, limit: 10 },
      )
      expect(result.data).toEqual([mockTransaction])
    })

    it('should sort ascending when order=asc', async () => {
      ;(PointsTransactionModel.find as jest.Mock).mockReturnValue(chainMock([]))
      ;(PointsTransactionModel.countDocuments as jest.Mock).mockResolvedValue(0)
      const result = await repository.findAllTransactions(
        {},
        { page: 1, limit: 5, sort_by: 'points', order: 'asc' },
      )
      expect(result.pagination.page_size).toBe(1)
    })
  })

  describe('getLoyaltyStats', () => {
    it('should return stats with tier distribution', async () => {
      ;(PointsTransactionModel.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ _id: null, total: 500 }]) // totalIssued
        .mockResolvedValueOnce([{ _id: null, total: 100 }]) // totalRedeemed
      ;(LoyaltyPointsModel.countDocuments as jest.Mock).mockResolvedValue(10)
      ;(LoyaltyPointsModel.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'bronze', count: 6 },
        { _id: 'silver', count: 3 },
        { _id: 'gold', count: 1 },
      ])

      const result = await repository.getLoyaltyStats()
      expect(result.total_points_issued).toBe(500)
      expect(result.total_points_redeemed).toBe(100)
      expect(result.total_active_users).toBe(10)
      expect(result.tier_distribution).toHaveProperty('bronze', 6)
      expect(result.tier_distribution).toHaveProperty('silver', 3)
      expect(result.tier_distribution).toHaveProperty('gold', 1)
      expect(result.tier_distribution).toHaveProperty('platinum', 0)
    })

    it('should return 0 when aggregation returns empty arrays', async () => {
      ;(PointsTransactionModel.aggregate as jest.Mock)
        .mockResolvedValueOnce([]) // totalIssued empty
        .mockResolvedValueOnce([]) // totalRedeemed empty
      ;(LoyaltyPointsModel.countDocuments as jest.Mock).mockResolvedValue(0)
      ;(LoyaltyPointsModel.aggregate as jest.Mock).mockResolvedValue([])

      const result = await repository.getLoyaltyStats()
      expect(result.total_points_issued).toBe(0)
      expect(result.total_points_redeemed).toBe(0)
      expect(result.total_active_users).toBe(0)
    })
  })

  // ─── Pending / Expiry helpers ───────────────────────────────────

  describe('getPendingPoints', () => {
    it('should return 0 when aggregation returns no results (no pending lifecycle)', async () => {
      ;(PointsTransactionModel.aggregate as jest.Mock).mockResolvedValue([])
      const result = await repository.getPendingPoints(mockUserId)
      expect(result).toBe(0)
    })

    it('should return 0 when aggregate result has no total', async () => {
      ;(PointsTransactionModel.aggregate as jest.Mock).mockResolvedValue([{ _id: null }])
      const result = await repository.getPendingPoints(mockUserId)
      expect(result).toBe(0)
    })

    it('should return the aggregated total when pending transactions exist', async () => {
      ;(PointsTransactionModel.aggregate as jest.Mock).mockResolvedValue([
        { _id: null, total: 150 },
      ])
      const result = await repository.getPendingPoints(mockUserId)
      expect(result).toBe(150)
    })

    it('should accept a Types.ObjectId as userId', async () => {
      ;(PointsTransactionModel.aggregate as jest.Mock).mockResolvedValue([])
      const result = await repository.getPendingPoints(new Types.ObjectId())
      expect(result).toBe(0)
    })
  })

  describe('getExpiringSoon', () => {
    it('should return null when aggregation returns no results (no expiry policy)', async () => {
      ;(PointsTransactionModel.aggregate as jest.Mock).mockResolvedValue([])
      const result = await repository.getExpiringSoon(mockUserId)
      expect(result).toBeNull()
    })

    it('should return an IExpiringSoon object when an expiring transaction exists', async () => {
      const futureDate = new Date(Date.now() + 5 * 86400000)
      ;(PointsTransactionModel.aggregate as jest.Mock).mockResolvedValue([
        { points: 50, expire_date: futureDate },
      ])
      const result = await repository.getExpiringSoon(mockUserId)
      expect(result).not.toBeNull()
      expect(result?.points).toBe(50)
      expect(result?.expire_date).toBe(futureDate.toISOString())
    })

    it('should accept a Types.ObjectId as userId', async () => {
      ;(PointsTransactionModel.aggregate as jest.Mock).mockResolvedValue([])
      const result = await repository.getExpiringSoon(new Types.ObjectId())
      expect(result).toBeNull()
    })
  })
})
