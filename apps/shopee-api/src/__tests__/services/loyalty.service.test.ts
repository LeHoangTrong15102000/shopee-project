/// <reference types="jest" />
import { Types } from 'mongoose'
import { LoyaltyService } from '@services/loyalty.service'
import {
  ILoyaltyRepository,
  LOYALTY_TIER,
} from '@repositories/interfaces/loyalty.repository.interface'
import { NotFoundError, BusinessError, ValidationError } from '@services/base.service'

const mockLoyaltyRepository = {
  findPointsByUser: jest.fn(),
  createPoints: jest.fn(),
  updatePoints: jest.fn(),
  getPendingPoints: jest.fn(),
  getExpiringSoon: jest.fn(),
  findTransactionsByUser: jest.fn(),
  createTransaction: jest.fn(),
  findRewardById: jest.fn(),
  findRewards: jest.fn(),
  updateRewardStock: jest.fn(),
} as unknown as jest.Mocked<ILoyaltyRepository>

const mockPoints = {
  _id: new Types.ObjectId(),
  user: new Types.ObjectId(),
  total_points: 5000,
  available_points: 3000,
  tier: LOYALTY_TIER.GOLD,
  lifetime_points: 8000,
}

const mockReward = {
  _id: new Types.ObjectId(),
  name: 'Test Reward',
  points_required: 1000,
  is_active: true,
  stock: 5,
  reward_type: 'voucher',
  reward_value: '50000',
}

describe('LoyaltyService', () => {
  let loyaltyService: LoyaltyService

  beforeEach(() => {
    jest.clearAllMocks()
    loyaltyService = new LoyaltyService(mockLoyaltyRepository)
  })

  describe('getPoints', () => {
    it('should return points with tier_info for existing user', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.getPendingPoints.mockResolvedValue(0)
      mockLoyaltyRepository.getExpiringSoon.mockResolvedValue(null)
      const result = await loyaltyService.getPoints(mockPoints.user.toString())
      expect(result).toHaveProperty('tier_info')
      expect(mockLoyaltyRepository.findPointsByUser).toHaveBeenCalledWith(
        mockPoints.user.toString(),
      )
    })

    it('should create points for new user', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(null)
      mockLoyaltyRepository.createPoints.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.getPendingPoints.mockResolvedValue(0)
      mockLoyaltyRepository.getExpiringSoon.mockResolvedValue(null)
      const userId = new Types.ObjectId().toString()
      await loyaltyService.getPoints(userId)
      expect(mockLoyaltyRepository.createPoints).toHaveBeenCalled()
    })

    it('should return pending_points: 0 and expiring_soon: null when no data', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.getPendingPoints.mockResolvedValue(0)
      mockLoyaltyRepository.getExpiringSoon.mockResolvedValue(null)
      const result = await loyaltyService.getPoints(mockPoints.user.toString())
      expect(result.pending_points).toBe(0)
      expect(result.expiring_soon).toBeNull()
    })

    it('should return expiring_soon object when repository returns one', async () => {
      const expiryData = {
        points: 50,
        expire_date: new Date(Date.now() + 5 * 86400000).toISOString(),
      }
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.getPendingPoints.mockResolvedValue(100)
      mockLoyaltyRepository.getExpiringSoon.mockResolvedValue(expiryData)
      const result = await loyaltyService.getPoints(mockPoints.user.toString())
      expect(result.pending_points).toBe(100)
      expect(result.expiring_soon).toEqual(expiryData)
    })
  })

  describe('getTransactions', () => {
    it('should return paginated results', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } }
      mockLoyaltyRepository.findTransactionsByUser.mockResolvedValue(mockResult as any)
      const result = await loyaltyService.getTransactions(
        mockPoints.user.toString(),
        {},
        { page: 1, limit: 10 },
      )
      expect(result).toHaveProperty('pagination')
    })
  })

  describe('getRewards', () => {
    it('should return paginated results', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } }
      mockLoyaltyRepository.findRewards.mockResolvedValue(mockResult as any)
      const result = await loyaltyService.getRewards({}, { page: 1, limit: 10 })
      expect(result).toHaveProperty('pagination')
    })
  })

  describe('redeemPoints', () => {
    it('should redeem points successfully', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue(mockReward as any)
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.updatePoints.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.updateRewardStock.mockResolvedValue(mockReward as any)
      mockLoyaltyRepository.createTransaction.mockResolvedValue({} as any)
      const result = await loyaltyService.redeemPoints(
        mockPoints.user.toString(),
        mockReward._id.toString(),
      )
      expect(result).toBeDefined()
    })

    it('should throw NotFoundError when reward not found', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue(null)
      await expect(
        loyaltyService.redeemPoints(mockPoints.user.toString(), new Types.ObjectId().toString()),
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw BusinessError when reward is inactive', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue({
        ...mockReward,
        is_active: false,
      } as any)
      await expect(
        loyaltyService.redeemPoints(mockPoints.user.toString(), mockReward._id.toString()),
      ).rejects.toThrow(BusinessError)
    })

    it('should throw BusinessError when reward is out of stock', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue({ ...mockReward, stock: 0 } as any)
      await expect(
        loyaltyService.redeemPoints(mockPoints.user.toString(), mockReward._id.toString()),
      ).rejects.toThrow(BusinessError)
    })

    it('should throw BusinessError when insufficient points', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue({
        ...mockReward,
        points_required: 10000,
      } as any)
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(mockPoints as any)
      await expect(
        loyaltyService.redeemPoints(mockPoints.user.toString(), mockReward._id.toString()),
      ).rejects.toThrow(BusinessError)
    })
  })

  describe('deductPoints', () => {
    it('should deduct points successfully', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.updatePoints.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.createTransaction.mockResolvedValue({} as any)
      const result = await loyaltyService.deductPoints(
        mockPoints.user.toString(),
        500,
        'Test deduction',
      )
      expect(result).toBeDefined()
    })

    it('should throw BusinessError when insufficient points', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue({
        ...mockPoints,
        available_points: 100,
      } as any)
      await expect(
        loyaltyService.deductPoints(mockPoints.user.toString(), 500, 'Test'),
      ).rejects.toThrow(BusinessError)
    })

    it('should throw ValidationError for invalid amount', async () => {
      await expect(
        loyaltyService.deductPoints(mockPoints.user.toString(), 0, 'Test'),
      ).rejects.toThrow(ValidationError)
      await expect(
        loyaltyService.deductPoints(mockPoints.user.toString(), -10, 'Test'),
      ).rejects.toThrow(ValidationError)
    })

    it('should create points when user has none', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(null)
      mockLoyaltyRepository.createPoints.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.updatePoints.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.createTransaction.mockResolvedValue({} as any)

      const result = await loyaltyService.deductPoints(mockPoints.user.toString(), 500, 'Test')
      expect(mockLoyaltyRepository.createPoints).toHaveBeenCalled()
    })
  })

  describe('getPoints - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(loyaltyService.getPoints('invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('getTransactions - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(
        loyaltyService.getTransactions('invalid-id', {}, { page: 1, limit: 10 }),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('redeemPoints - new points creation', () => {
    it('should create points when user has none and then check', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue(mockReward as any)
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(null)
      mockLoyaltyRepository.createPoints.mockResolvedValue({
        ...mockPoints,
        available_points: 500,
      } as any)

      await expect(
        loyaltyService.redeemPoints(mockPoints.user.toString(), mockReward._id.toString()),
      ).rejects.toThrow(BusinessError)
    })
  })

  describe('adminGetRewards', () => {
    it('should call findRewardsWithFilters', async () => {
      ;(mockLoyaltyRepository as any).findRewardsWithFilters = jest
        .fn()
        .mockResolvedValue({ data: [], pagination: {} })
      const result = await loyaltyService.adminGetRewards({}, { page: 1, limit: 10 })
      expect((mockLoyaltyRepository as any).findRewardsWithFilters).toHaveBeenCalled()
    })
  })

  describe('adminCreateReward', () => {
    it('should create reward', async () => {
      ;(mockLoyaltyRepository as any).createReward = jest.fn().mockResolvedValue(mockReward)
      const result = await loyaltyService.adminCreateReward({ name: 'New Reward' })
      expect((mockLoyaltyRepository as any).createReward).toHaveBeenCalled()
    })
  })

  describe('adminUpdateReward', () => {
    it('should update reward successfully', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue(mockReward as any)
      ;(mockLoyaltyRepository as any).updateReward = jest
        .fn()
        .mockResolvedValue({ ...mockReward, name: 'Updated' })

      const result = await loyaltyService.adminUpdateReward(mockReward._id.toString(), {
        name: 'Updated',
      })
      expect((mockLoyaltyRepository as any).updateReward).toHaveBeenCalled()
    })

    it('should throw NotFoundError when reward not found', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue(null)
      await expect(loyaltyService.adminUpdateReward(mockReward._id.toString(), {})).rejects.toThrow(
        NotFoundError,
      )
    })

    it('should throw ValidationError for invalid id', async () => {
      await expect(loyaltyService.adminUpdateReward('invalid', {})).rejects.toThrow(ValidationError)
    })
  })

  describe('adminDeleteReward', () => {
    it('should delete reward successfully', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue(mockReward as any)
      ;(mockLoyaltyRepository as any).deleteReward = jest.fn().mockResolvedValue(undefined)

      const result = await loyaltyService.adminDeleteReward(mockReward._id.toString())
      expect(result.deleted).toBe(true)
    })

    it('should throw NotFoundError when reward not found', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue(null)
      await expect(loyaltyService.adminDeleteReward(mockReward._id.toString())).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('adminToggleReward', () => {
    it('should toggle reward active status', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue(mockReward as any)
      ;(mockLoyaltyRepository as any).updateReward = jest
        .fn()
        .mockResolvedValue({ ...mockReward, is_active: false })

      const result = await loyaltyService.adminToggleReward(mockReward._id.toString())
      expect((mockLoyaltyRepository as any).updateReward).toHaveBeenCalledWith(
        mockReward._id.toString(),
        { is_active: false },
      )
    })

    it('should throw NotFoundError when reward not found', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue(null)
      await expect(loyaltyService.adminToggleReward(mockReward._id.toString())).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('adminAdjustPoints', () => {
    it('should add points and recalculate tier', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.updatePoints.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.createTransaction.mockResolvedValue({} as any)

      const result = await loyaltyService.adminAdjustPoints(
        mockPoints.user.toString(),
        1000,
        'earn',
        'Bonus',
      )
      expect(result).toHaveProperty('transaction')
      expect(result).toHaveProperty('new_available_points')
    })

    it('should throw BusinessError when deducting more than available', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue({
        ...mockPoints,
        available_points: 100,
      } as any)
      await expect(
        loyaltyService.adminAdjustPoints(mockPoints.user.toString(), -500, 'deduct', 'Deduction'),
      ).rejects.toThrow(BusinessError)
    })

    it('should create points if user has none', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(null)
      mockLoyaltyRepository.createPoints.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.updatePoints.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.createTransaction.mockResolvedValue({} as any)

      const result = await loyaltyService.adminAdjustPoints(
        mockPoints.user.toString(),
        500,
        'earn',
        'Bonus',
      )
      expect(mockLoyaltyRepository.createPoints).toHaveBeenCalled()
    })
  })

  describe('adminGetTransactions', () => {
    it('should call findAllTransactions', async () => {
      ;(mockLoyaltyRepository as any).findAllTransactions = jest
        .fn()
        .mockResolvedValue({ data: [], pagination: {} })
      await loyaltyService.adminGetTransactions({}, { page: 1, limit: 10 })
      expect((mockLoyaltyRepository as any).findAllTransactions).toHaveBeenCalled()
    })
  })

  describe('adminGetStats', () => {
    it('should call getLoyaltyStats', async () => {
      ;(mockLoyaltyRepository as any).getLoyaltyStats = jest
        .fn()
        .mockResolvedValue({ total_users: 100 })
      const result = await loyaltyService.adminGetStats()
      expect((mockLoyaltyRepository as any).getLoyaltyStats).toHaveBeenCalled()
    })
  })
})
