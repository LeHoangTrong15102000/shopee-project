/// <reference types="jest" />
import { Types } from 'mongoose'
import { LoyaltyService } from '@services/loyalty.service'
import { ILoyaltyRepository, LOYALTY_TIER } from '@repositories/interfaces/loyalty.repository.interface'
import { NotFoundError, BusinessError, ValidationError } from '@services/base.service'

const mockLoyaltyRepository = {
  findPointsByUser: jest.fn(),
  createPoints: jest.fn(),
  updatePoints: jest.fn(),
  findTransactionsByUser: jest.fn(),
  createTransaction: jest.fn(),
  findRewardById: jest.fn(),
  findRewards: jest.fn(),
  updateRewardStock: jest.fn()
} as unknown as jest.Mocked<ILoyaltyRepository>

const mockPoints = {
  _id: new Types.ObjectId(),
  user: new Types.ObjectId(),
  total_points: 5000,
  available_points: 3000,
  tier: LOYALTY_TIER.GOLD,
  lifetime_points: 8000
}

const mockReward = {
  _id: new Types.ObjectId(),
  name: 'Test Reward',
  points_required: 1000,
  is_active: true,
  stock: 5,
  reward_type: 'voucher',
  reward_value: '50000'
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
      const result = await loyaltyService.getPoints(mockPoints.user.toString())
      expect(result).toHaveProperty('tier_info')
      expect(mockLoyaltyRepository.findPointsByUser).toHaveBeenCalledWith(mockPoints.user.toString())
    })

    it('should create points for new user', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(null)
      mockLoyaltyRepository.createPoints.mockResolvedValue(mockPoints as any)
      const userId = new Types.ObjectId().toString()
      await loyaltyService.getPoints(userId)
      expect(mockLoyaltyRepository.createPoints).toHaveBeenCalled()
    })
  })

  describe('getTransactions', () => {
    it('should return paginated results', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } }
      mockLoyaltyRepository.findTransactionsByUser.mockResolvedValue(mockResult as any)
      const result = await loyaltyService.getTransactions(mockPoints.user.toString(), {}, { page: 1, limit: 10 })
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
      const result = await loyaltyService.redeemPoints(mockPoints.user.toString(), mockReward._id.toString())
      expect(result).toBeDefined()
    })

    it('should throw NotFoundError when reward not found', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue(null)
      await expect(loyaltyService.redeemPoints(mockPoints.user.toString(), new Types.ObjectId().toString()))
        .rejects.toThrow(NotFoundError)
    })

    it('should throw BusinessError when reward is inactive', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue({ ...mockReward, is_active: false } as any)
      await expect(loyaltyService.redeemPoints(mockPoints.user.toString(), mockReward._id.toString()))
        .rejects.toThrow(BusinessError)
    })

    it('should throw BusinessError when reward is out of stock', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue({ ...mockReward, stock: 0 } as any)
      await expect(loyaltyService.redeemPoints(mockPoints.user.toString(), mockReward._id.toString()))
        .rejects.toThrow(BusinessError)
    })

    it('should throw BusinessError when insufficient points', async () => {
      mockLoyaltyRepository.findRewardById.mockResolvedValue({ ...mockReward, points_required: 10000 } as any)
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(mockPoints as any)
      await expect(loyaltyService.redeemPoints(mockPoints.user.toString(), mockReward._id.toString()))
        .rejects.toThrow(BusinessError)
    })
  })

  describe('deductPoints', () => {
    it('should deduct points successfully', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.updatePoints.mockResolvedValue(mockPoints as any)
      mockLoyaltyRepository.createTransaction.mockResolvedValue({} as any)
      const result = await loyaltyService.deductPoints(mockPoints.user.toString(), 500, 'Test deduction')
      expect(result).toBeDefined()
    })

    it('should throw BusinessError when insufficient points', async () => {
      mockLoyaltyRepository.findPointsByUser.mockResolvedValue({ ...mockPoints, available_points: 100 } as any)
      await expect(loyaltyService.deductPoints(mockPoints.user.toString(), 500, 'Test'))
        .rejects.toThrow(BusinessError)
    })

    it('should throw ValidationError for invalid amount', async () => {
      await expect(loyaltyService.deductPoints(mockPoints.user.toString(), 0, 'Test'))
        .rejects.toThrow(ValidationError)
      await expect(loyaltyService.deductPoints(mockPoints.user.toString(), -10, 'Test'))
        .rejects.toThrow(ValidationError)
    })
  })
})

