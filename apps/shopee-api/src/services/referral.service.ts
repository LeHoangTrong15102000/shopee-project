/**
 * ReferralService — manages referral codes and rewards.
 *
 * Generates unique 8-char alphanumeric codes, validates code application,
 * tracks referral stats, and processes rewards when orders complete.
 */
import mongoose from 'mongoose'
import { ReferralCodeModel, IReferralCode } from '@database/models/referral-code.model'
import { ReferralRewardModel, IReferralReward } from '@database/models/referral-reward.model'
import {
  BaseService,
  NotFoundError,
  ValidationError,
  BusinessError,
  ConflictError,
} from './base.service'
import { Logger } from '@utils/logger'

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const CODE_LENGTH = 8
const MAX_USAGES_DEFAULT = 50
const REWARD_VALUE_DEFAULT = 50000 // 50,000 VND voucher

function generateRandomCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

export interface ReferralStats {
  code: string
  totalReferrals: number
  pendingRewards: number
  earnedRewards: number
}

export interface AdminReferralAnalytics {
  totalCodes: number
  totalReferrals: number
  totalPendingRewards: number
  totalRewardedReferrals: number
  topReferrers: Array<{ userId: string; referralCount: number }>
}

export class ReferralService extends BaseService {
  /**
   * Get or generate a referral code for a user.
   * Retries up to 5 times on code collision.
   */
  async generateCode(userId: string): Promise<IReferralCode> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    // Return existing code if present
    const existing = await ReferralCodeModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean()

    if (existing) return existing as IReferralCode

    // Generate a unique code with retry
    let attempts = 0
    while (attempts < 5) {
      const code = generateRandomCode()
      try {
        const created = await ReferralCodeModel.create({
          userId: new mongoose.Types.ObjectId(userId),
          code,
          usageCount: 0,
          maxUsages: MAX_USAGES_DEFAULT,
          rewardPerReferral: REWARD_VALUE_DEFAULT,
          isActive: true,
        })
        Logger.apiInfo('[ReferralService] Generated referral code', { userId, code })
        return created.toObject() as IReferralCode
      } catch (err: unknown) {
        const mongoErr = err as { code?: number }
        if (mongoErr?.code === 11000) {
          // Duplicate code — retry
          attempts++
          continue
        }
        throw err
      }
    }

    throw new BusinessError('Failed to generate a unique referral code after 5 attempts')
  }

  /**
   * Apply a referral code for a referee user.
   * Validates: code exists, is active, not maxed out, not self-referral, not already applied.
   */
  async applyCode(refereeId: string, code: string): Promise<IReferralReward> {
    if (!this.isValidObjectId(refereeId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!code || code.trim().length === 0) {
      throw new ValidationError('Referral code is required')
    }

    const referralCode = await ReferralCodeModel.findOne({
      code: code.toUpperCase().trim(),
    }).lean()

    if (!referralCode) {
      throw new NotFoundError('Referral code', code)
    }

    if (!referralCode.isActive) {
      throw new BusinessError('This referral code is no longer active')
    }

    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      throw new BusinessError('This referral code has expired')
    }

    if (referralCode.usageCount >= referralCode.maxUsages) {
      throw new BusinessError('This referral code has reached its maximum usage limit')
    }

    const referrerId = referralCode.userId.toString()

    if (referrerId === refereeId) {
      throw new BusinessError('You cannot apply your own referral code')
    }

    // Check if referee has already applied any referral code
    const existingReward = await ReferralRewardModel.findOne({
      refereeId: new mongoose.Types.ObjectId(refereeId),
    }).lean()

    if (existingReward) {
      throw new ConflictError('You have already applied a referral code')
    }

    // Create pending reward and increment usage count atomically
    const [reward] = await Promise.all([
      ReferralRewardModel.create({
        referrerId: referralCode.userId,
        refereeId: new mongoose.Types.ObjectId(refereeId),
        rewardType: 'voucher',
        rewardValue: referralCode.rewardPerReferral,
        status: 'pending',
      }),
      ReferralCodeModel.updateOne({ _id: referralCode._id }, { $inc: { usageCount: 1 } }),
    ])

    Logger.apiInfo('[ReferralService] Referral code applied', {
      refereeId,
      referrerId,
      code,
    })

    return reward.toObject() as IReferralReward
  }

  /**
   * Get referral stats for a user.
   */
  async getStats(userId: string): Promise<ReferralStats> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const userObjectId = new mongoose.Types.ObjectId(userId)

    const [referralCode, totalReferrals, pendingRewards, earnedRewards] = await Promise.all([
      ReferralCodeModel.findOne({ userId: userObjectId }).lean(),
      ReferralRewardModel.countDocuments({ referrerId: userObjectId }),
      ReferralRewardModel.countDocuments({ referrerId: userObjectId, status: 'pending' }),
      ReferralRewardModel.countDocuments({ referrerId: userObjectId, status: 'rewarded' }),
    ])

    // Auto-generate code if not present
    const code = referralCode ? referralCode.code : (await this.generateCode(userId)).code

    return {
      code,
      totalReferrals,
      pendingRewards,
      earnedRewards,
    }
  }

  /**
   * Process referral reward when an order is completed.
   * Finds the pending reward for the referee and marks it as rewarded.
   */
  async processReferralReward(refereeId: string, orderId: string): Promise<void> {
    if (!this.isValidObjectId(refereeId)) return

    const reward = await ReferralRewardModel.findOne({
      refereeId: new mongoose.Types.ObjectId(refereeId),
      status: 'pending',
    }).lean()

    if (!reward) return

    await ReferralRewardModel.updateOne(
      { _id: reward._id },
      {
        $set: {
          status: 'rewarded',
          orderId: new mongoose.Types.ObjectId(orderId),
        },
      },
    )

    Logger.apiInfo('[ReferralService] Referral reward processed', {
      refereeId,
      referrerId: reward.referrerId.toString(),
      orderId,
      rewardValue: reward.rewardValue,
    })
  }

  /**
   * Admin analytics for the referral system.
   */
  async getAdminAnalytics(): Promise<AdminReferralAnalytics> {
    const [totalCodes, totalReferrals, totalPendingRewards, totalRewardedReferrals, topReferrers] =
      await Promise.all([
        ReferralCodeModel.countDocuments(),
        ReferralRewardModel.countDocuments(),
        ReferralRewardModel.countDocuments({ status: 'pending' }),
        ReferralRewardModel.countDocuments({ status: 'rewarded' }),
        ReferralRewardModel.aggregate([
          { $group: { _id: '$referrerId', referralCount: { $sum: 1 } } },
          { $sort: { referralCount: -1 } },
          { $limit: 10 },
          { $project: { userId: { $toString: '$_id' }, referralCount: 1, _id: 0 } },
        ]),
      ])

    return {
      totalCodes,
      totalReferrals,
      totalPendingRewards,
      totalRewardedReferrals,
      topReferrers,
    }
  }
}
