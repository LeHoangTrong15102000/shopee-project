import { Types } from 'mongoose'
import { IBaseRepository, PaginatedResult, PaginationOptions } from './base.repository.interface'

import type { LoyaltyTier, PointsTransactionType, RewardType } from '@database/models/loyalty.model'
export type { LoyaltyTier, PointsTransactionType, RewardType }
export { LOYALTY_TIER, POINTS_TRANSACTION_TYPE, REWARD_TYPE } from '@database/models/loyalty.model'

/**
 * Loyalty points interface
 */
export interface ILoyaltyPointsItem {
  _id?: Types.ObjectId
  user: Types.ObjectId
  total_points: number
  available_points: number
  tier: LoyaltyTier
  lifetime_points: number
  created_at?: Date
  updated_at?: Date
}

/**
 * Points transaction interface
 */
export interface IPointsTransactionItem {
  _id?: Types.ObjectId
  user: Types.ObjectId
  type: PointsTransactionType
  points: number
  description: string
  order_id?: Types.ObjectId
  reward_id?: Types.ObjectId
  created_at?: Date
}

/**
 * Points reward interface
 */
export interface IPointsRewardItem {
  _id?: Types.ObjectId
  name: string
  description: string
  points_required: number
  reward_type: RewardType
  reward_value: number
  stock: number
  is_active: boolean
  image?: string
  created_at?: Date
  updated_at?: Date
}

/**
 * Create transaction DTO
 */
export interface CreateTransactionDTO {
  user: Types.ObjectId | string
  type: PointsTransactionType
  points: number
  description: string
  order_id?: Types.ObjectId | string
  reward_id?: Types.ObjectId | string
}

/**
 * Transaction filter options
 */
export interface TransactionFilterOptions {
  type?: PointsTransactionType
}

/**
 * Reward filter options
 */
export interface RewardFilterOptions {
  reward_type?: RewardType
  is_active?: boolean
  in_stock?: boolean
}

/**
 * Loyalty repository interface
 */
export interface ILoyaltyRepository {
  // Loyalty Points
  findPointsByUser(userId: string | Types.ObjectId): Promise<ILoyaltyPointsItem | null>
  createPoints(userId: string | Types.ObjectId): Promise<ILoyaltyPointsItem>
  updatePoints(
    userId: string | Types.ObjectId,
    data: Partial<ILoyaltyPointsItem>,
  ): Promise<ILoyaltyPointsItem | null>

  // Transactions
  findTransactionsByUser(
    userId: string | Types.ObjectId,
    filters: TransactionFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IPointsTransactionItem>>
  createTransaction(data: CreateTransactionDTO): Promise<IPointsTransactionItem>

  // Rewards
  findRewardById(rewardId: string | Types.ObjectId): Promise<IPointsRewardItem | null>
  findRewards(
    filters: RewardFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IPointsRewardItem>>
  updateRewardStock(
    rewardId: string | Types.ObjectId,
    decrement: number,
  ): Promise<IPointsRewardItem | null>
}
