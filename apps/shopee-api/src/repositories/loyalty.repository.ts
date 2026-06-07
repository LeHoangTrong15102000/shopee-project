import { Types, FilterQuery } from 'mongoose'
import {
  LoyaltyPointsModel,
  PointsTransactionModel,
  PointsRewardModel,
  ILoyaltyPoints,
  IPointsTransaction,
  IPointsReward,
  LOYALTY_TIER,
} from '@database/models/loyalty.model'
import {
  ILoyaltyRepository,
  ILoyaltyPointsItem,
  IPointsTransactionItem,
  IPointsRewardItem,
  CreateTransactionDTO,
  TransactionFilterOptions,
  RewardFilterOptions,
} from './interfaces/loyalty.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class LoyaltyRepository implements ILoyaltyRepository {
  // Loyalty Points
  async findPointsByUser(userId: string | Types.ObjectId): Promise<ILoyaltyPointsItem | null> {
    return LoyaltyPointsModel.findOne({ user: new Types.ObjectId(userId.toString()) })
      .select({ __v: 0 })
      .lean<ILoyaltyPointsItem | null>()
  }

  async createPoints(userId: string | Types.ObjectId): Promise<ILoyaltyPointsItem> {
    const points = new LoyaltyPointsModel({
      user: new Types.ObjectId(userId.toString()),
      total_points: 0,
      available_points: 0,
      tier: LOYALTY_TIER.BRONZE,
      lifetime_points: 0,
    })
    try {
      const saved = await points.save()
      return saved.toObject() as ILoyaltyPointsItem
    } catch (err: unknown) {
      // E11000 duplicate-key: concurrent creation race — re-fetch the existing document
      if (typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000) {
        const existing = await LoyaltyPointsModel.findOne({
          user: new Types.ObjectId(userId.toString()),
        })
          .select({ __v: 0 })
          .lean<ILoyaltyPointsItem | null>()
        if (existing) {
          return existing
        }
      }
      throw err
    }
  }

  async updatePoints(
    userId: string | Types.ObjectId,
    data: Partial<ILoyaltyPointsItem>,
  ): Promise<ILoyaltyPointsItem | null> {
    return LoyaltyPointsModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId.toString()) },
      data,
      { new: true },
    ).lean<ILoyaltyPointsItem | null>()
  }

  // Transactions
  async findTransactionsByUser(
    userId: string | Types.ObjectId,
    filters: TransactionFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IPointsTransactionItem>> {
    const { page, limit, sort } = pagination
    const skip = (page - 1) * limit

    const filter: FilterQuery<IPointsTransaction> = { user: new Types.ObjectId(userId.toString()) }
    if (filters.type) {
      filter.type = filters.type
    }

    const [data, total] = await Promise.all([
      PointsTransactionModel.find(filter)
        .select({ __v: 0 })
        .sort(sort || { created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IPointsTransactionItem[]>(),
      PointsTransactionModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        page_size: Math.ceil(total / limit) || 1,
        total,
      },
    }
  }

  async createTransaction(data: CreateTransactionDTO): Promise<IPointsTransactionItem> {
    const transaction = new PointsTransactionModel({
      ...data,
      user: new Types.ObjectId(data.user.toString()),
      order_id: data.order_id ? new Types.ObjectId(data.order_id.toString()) : undefined,
      reward_id: data.reward_id ? new Types.ObjectId(data.reward_id.toString()) : undefined,
    })
    const saved = await transaction.save()
    return saved.toObject() as IPointsTransactionItem
  }

  // Rewards
  async findRewardById(rewardId: string | Types.ObjectId): Promise<IPointsRewardItem | null> {
    return PointsRewardModel.findById(rewardId).lean<IPointsRewardItem | null>()
  }

  async findRewards(
    filters: RewardFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IPointsRewardItem>> {
    const { page, limit, sort } = pagination
    const skip = (page - 1) * limit

    const filter: FilterQuery<IPointsReward> = {}
    if (filters.is_active !== undefined) {
      filter.is_active = filters.is_active
    }
    if (filters.in_stock) {
      filter.stock = { $gt: 0 }
    }
    if (filters.reward_type) {
      filter.reward_type = filters.reward_type
    }

    const [data, total] = await Promise.all([
      PointsRewardModel.find(filter)
        .select({ __v: 0 })
        .sort(sort || { points_required: 1 })
        .skip(skip)
        .limit(limit)
        .lean<IPointsRewardItem[]>(),
      PointsRewardModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        page_size: Math.ceil(total / limit) || 1,
        total,
      },
    }
  }

  async updateRewardStock(
    rewardId: string | Types.ObjectId,
    decrement: number,
  ): Promise<IPointsRewardItem | null> {
    return PointsRewardModel.findByIdAndUpdate(
      rewardId,
      { $inc: { stock: -decrement } },
      { new: true },
    ).lean<IPointsRewardItem | null>()
  }

  // ─── Admin Methods ─────────────────────────────────────────────

  async findRewardsWithFilters(
    filters: { reward_type?: string; is_active?: string },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' },
  ): Promise<PaginatedResult<IPointsRewardItem>> {
    const { page, limit, sort_by = 'createdAt', order = 'desc' } = pagination
    const skip = (page - 1) * limit

    const query: FilterQuery<IPointsReward> = {}
    if (filters.reward_type) query.reward_type = filters.reward_type
    if (filters.is_active !== undefined) query.is_active = filters.is_active === 'true'

    const sortObj: Record<string, 1 | -1> = { [sort_by]: order === 'asc' ? 1 : -1 }

    const [data, total] = await Promise.all([
      PointsRewardModel.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean<IPointsRewardItem[]>(),
      PointsRewardModel.countDocuments(query),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async createReward(data: Partial<IPointsReward>): Promise<IPointsRewardItem> {
    const reward = new PointsRewardModel({ ...data, is_active: true })
    const saved = await reward.save()
    return saved.toObject() as IPointsRewardItem
  }

  async updateReward(id: string, data: Partial<IPointsReward>): Promise<IPointsRewardItem | null> {
    return PointsRewardModel.findByIdAndUpdate(id, data, {
      new: true,
    }).lean<IPointsRewardItem | null>()
  }

  async deleteReward(id: string): Promise<void> {
    await PointsRewardModel.findByIdAndDelete(id)
  }

  async findAllTransactions(
    filters: { type?: string; user_id?: string },
    pagination: { page: number; limit: number; sort_by?: string; order?: 'asc' | 'desc' },
  ): Promise<PaginatedResult<IPointsTransactionItem>> {
    const { page, limit, sort_by = 'created_at', order = 'desc' } = pagination
    const skip = (page - 1) * limit

    const query: FilterQuery<IPointsTransaction> = {}
    if (filters.type) query.type = filters.type
    if (filters.user_id) query.user = new Types.ObjectId(filters.user_id)

    const sortObj: Record<string, 1 | -1> = { [sort_by]: order === 'asc' ? 1 : -1 }

    const [data, total] = await Promise.all([
      PointsTransactionModel.find(query)
        .populate('user', 'name email avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean<IPointsTransactionItem[]>(),
      PointsTransactionModel.countDocuments(query),
    ])

    return {
      data,
      pagination: { page, limit, page_size: Math.ceil(total / limit) || 1, total },
    }
  }

  async getLoyaltyStats() {
    const [totalIssued, totalRedeemed, activeUsers, tierDist] = await Promise.all([
      PointsTransactionModel.aggregate([
        { $match: { points: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$points' } } },
      ]),
      PointsTransactionModel.aggregate([
        { $match: { points: { $lt: 0 } } },
        { $group: { _id: null, total: { $sum: { $abs: '$points' } } } },
      ]),
      LoyaltyPointsModel.countDocuments({ available_points: { $gt: 0 } }),
      LoyaltyPointsModel.aggregate([{ $group: { _id: '$tier', count: { $sum: 1 } } }]),
    ])

    const tier_distribution: Record<string, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 }
    for (const t of tierDist) tier_distribution[t._id] = t.count

    return {
      total_points_issued: totalIssued[0]?.total || 0,
      total_points_redeemed: totalRedeemed[0]?.total || 0,
      total_active_users: activeUsers,
      tier_distribution,
    }
  }
}
