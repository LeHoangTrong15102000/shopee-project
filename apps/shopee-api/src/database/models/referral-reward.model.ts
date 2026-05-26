import mongoose, { Schema } from 'mongoose'

export type ReferralRewardStatus = 'pending' | 'rewarded' | 'cancelled'
export type ReferralRewardType = 'voucher' | 'coins' | 'cash'

export interface IReferralReward {
  _id?: mongoose.Types.ObjectId
  referrerId: mongoose.Types.ObjectId
  refereeId: mongoose.Types.ObjectId
  orderId?: mongoose.Types.ObjectId
  rewardType: ReferralRewardType
  rewardValue: number
  status: ReferralRewardStatus
  createdAt: Date
  updatedAt: Date
}

const ReferralRewardSchema = new Schema<IReferralReward>(
  {
    referrerId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    refereeId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'orders',
    },
    rewardType: {
      type: String,
      required: true,
      enum: ['voucher', 'coins', 'cash'],
      default: 'voucher',
    },
    rewardValue: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'rewarded', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Prevent a referee from applying more than one referral code
ReferralRewardSchema.index({ refereeId: 1 }, { unique: true })

export const ReferralRewardModel = mongoose.model<IReferralReward>(
  'referral_rewards',
  ReferralRewardSchema,
)
