import { Types } from 'mongoose'
import {
  ILoyaltyRepository,
  ILoyaltyPointsItem,
  IPointsTransactionItem,
  IPointsRewardItem,
  TransactionFilterOptions,
  RewardFilterOptions,
  LoyaltyTier,
  LOYALTY_TIER,
} from '@repositories/interfaces/loyalty.repository.interface'
import {
  PaginatedResult,
  PaginationOptions,
} from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError, BusinessError } from './base.service'

const TIER_THRESHOLDS = {
  [LOYALTY_TIER.BRONZE]: {
    min: 0,
    max: 999,
    next_tier: LOYALTY_TIER.SILVER as LoyaltyTier,
    next_threshold: 1000,
  },
  [LOYALTY_TIER.SILVER]: {
    min: 1000,
    max: 4999,
    next_tier: LOYALTY_TIER.GOLD as LoyaltyTier,
    next_threshold: 5000,
  },
  [LOYALTY_TIER.GOLD]: {
    min: 5000,
    max: 19999,
    next_tier: LOYALTY_TIER.PLATINUM as LoyaltyTier,
    next_threshold: 20000,
  },
  [LOYALTY_TIER.PLATINUM]: { min: 20000, max: null, next_tier: null, next_threshold: null },
}

interface TierInfo {
  min: number
  max: number | null
  next_tier: LoyaltyTier | null
  points_to_next: number
}

export class LoyaltyService extends BaseService {
  constructor(private readonly loyaltyRepository: ILoyaltyRepository) {
    super()
  }

  private calculateTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= 20000) return LOYALTY_TIER.PLATINUM
    if (lifetimePoints >= 5000) return LOYALTY_TIER.GOLD
    if (lifetimePoints >= 1000) return LOYALTY_TIER.SILVER
    return LOYALTY_TIER.BRONZE
  }

  private getTierInfo(tier: LoyaltyTier, lifetimePoints: number): TierInfo {
    const info = TIER_THRESHOLDS[tier]
    return {
      min: info.min,
      max: info.max,
      next_tier: info.next_tier,
      points_to_next: info.next_threshold ? Math.max(0, info.next_threshold - lifetimePoints) : 0,
    }
  }

  async getPoints(userId: string): Promise<{ points: ILoyaltyPointsItem; tier_info: TierInfo }> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    let points = await this.loyaltyRepository.findPointsByUser(userId)
    if (!points) {
      points = await this.loyaltyRepository.createPoints(userId)
    }

    return {
      points,
      tier_info: this.getTierInfo(points.tier, points.lifetime_points),
    }
  }

  async getTransactions(
    userId: string,
    filters: TransactionFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IPointsTransactionItem>> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    return this.loyaltyRepository.findTransactionsByUser(
      userId,
      filters,
      this.normalizePagination(pagination),
    )
  }

  async getRewards(
    filters: RewardFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IPointsRewardItem>> {
    return this.loyaltyRepository.findRewards(
      { ...filters, is_active: true, in_stock: true },
      this.normalizePagination(pagination),
    )
  }

  async redeemPoints(
    userId: string,
    rewardId: string,
  ): Promise<{
    reward: Partial<IPointsRewardItem>
    points_used: number
    remaining_points: number
    transaction: IPointsTransactionItem
  }> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(rewardId)) {
      throw new ValidationError('Invalid reward ID format')
    }

    const reward = await this.loyaltyRepository.findRewardById(rewardId)
    if (!reward) {
      throw new NotFoundError('Reward', rewardId)
    }
    if (!reward.is_active) {
      throw new BusinessError('Phần thưởng không còn hoạt động')
    }
    if (reward.stock <= 0) {
      throw new BusinessError('Phần thưởng đã hết')
    }

    let points = await this.loyaltyRepository.findPointsByUser(userId)
    if (!points) {
      points = await this.loyaltyRepository.createPoints(userId)
    }

    if (points.available_points < reward.points_required) {
      throw new BusinessError(
        `Bạn cần ${reward.points_required} điểm để đổi phần thưởng này. Hiện tại bạn có ${points.available_points} điểm`,
      )
    }

    // Update points
    const updatedPoints = await this.loyaltyRepository.updatePoints(userId, {
      available_points: points.available_points - reward.points_required,
      total_points: points.total_points - reward.points_required,
    })

    // Update reward stock
    await this.loyaltyRepository.updateRewardStock(rewardId, 1)

    // Create transaction
    const transaction = await this.loyaltyRepository.createTransaction({
      user: new Types.ObjectId(userId),
      type: 'redeem',
      points: -reward.points_required,
      description: `Đổi điểm lấy phần thưởng: ${reward.name}`,
      reward_id: new Types.ObjectId(rewardId),
    })

    return {
      reward: {
        _id: reward._id,
        name: reward.name,
        reward_type: reward.reward_type,
        reward_value: reward.reward_value,
      },
      points_used: reward.points_required,
      remaining_points: updatedPoints?.available_points || 0,
      transaction,
    }
  }

  async deductPoints(
    userId: string,
    points: number,
    description: string,
  ): Promise<IPointsTransactionItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (points <= 0) {
      throw new ValidationError('Points must be positive')
    }

    let userPoints = await this.loyaltyRepository.findPointsByUser(userId)
    if (!userPoints) {
      userPoints = await this.loyaltyRepository.createPoints(userId)
    }

    if (userPoints.available_points < points) {
      throw new BusinessError(`Không đủ điểm. Bạn có ${userPoints.available_points} điểm`)
    }

    await this.loyaltyRepository.updatePoints(userId, {
      available_points: userPoints.available_points - points,
    })

    return this.loyaltyRepository.createTransaction({
      user: new Types.ObjectId(userId),
      type: 'redeem',
      points: -points,
      description,
    })
  }

  // ─── Admin Methods ─────────────────────────────────────────────

  async adminGetRewards(
    filters: { reward_type?: string; is_active?: string },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' },
  ) {
    return (this.loyaltyRepository as any).findRewardsWithFilters(filters, pagination)
  }

  async adminCreateReward(data: Partial<IPointsRewardItem>) {
    return (this.loyaltyRepository as any).createReward(data)
  }

  async adminUpdateReward(id: string, data: Partial<IPointsRewardItem>) {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid reward ID')
    const reward = await this.loyaltyRepository.findRewardById(id)
    if (!reward) throw new NotFoundError('Reward', id)
    return (this.loyaltyRepository as any).updateReward(id, data)
  }

  async adminDeleteReward(id: string) {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid reward ID')
    const reward = await this.loyaltyRepository.findRewardById(id)
    if (!reward) throw new NotFoundError('Reward', id)
    await (this.loyaltyRepository as any).deleteReward(id)
    return { deleted: true }
  }

  async adminToggleReward(id: string) {
    if (!this.isValidObjectId(id)) throw new ValidationError('Invalid reward ID')
    const reward = await this.loyaltyRepository.findRewardById(id)
    if (!reward) throw new NotFoundError('Reward', id)
    return (this.loyaltyRepository as any).updateReward(id, { is_active: !reward.is_active })
  }

  async adminAdjustPoints(userId: string, points: number, type: string, description: string) {
    if (!this.isValidObjectId(userId)) throw new ValidationError('Invalid user ID')

    let userPoints = await this.loyaltyRepository.findPointsByUser(userId)
    if (!userPoints) {
      userPoints = await this.loyaltyRepository.createPoints(userId)
    }

    // If deducting, check sufficient balance
    if (points < 0 && userPoints.available_points < Math.abs(points)) {
      throw new BusinessError('Không đủ điểm để trừ')
    }

    const newAvailable = userPoints.available_points + points
    const newTotal = userPoints.total_points + points
    const newLifetime =
      points > 0 ? userPoints.lifetime_points + points : userPoints.lifetime_points

    // Recalculate tier
    const newTier = this.calculateTier(newLifetime)

    await this.loyaltyRepository.updatePoints(userId, {
      available_points: newAvailable,
      total_points: newTotal,
      lifetime_points: newLifetime,
      tier: newTier,
    })

    const transaction = await this.loyaltyRepository.createTransaction({
      user: new Types.ObjectId(userId),
      type: type as any,
      points,
      description,
    })

    return { transaction, new_available_points: newAvailable, new_tier: newTier }
  }

  async adminGetTransactions(
    filters: { type?: string; user_id?: string },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' },
  ) {
    return (this.loyaltyRepository as any).findAllTransactions(filters, pagination)
  }

  async adminGetStats() {
    return (this.loyaltyRepository as any).getLoyaltyStats()
  }
}
