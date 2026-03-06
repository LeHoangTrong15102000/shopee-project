import mongoose, { Schema } from 'mongoose'

export const LOYALTY_TIER = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const

export type LoyaltyTier = (typeof LOYALTY_TIER)[keyof typeof LOYALTY_TIER]

export const POINTS_TRANSACTION_TYPE = {
  EARN: 'earn',
  REDEEM: 'redeem',
  EXPIRE: 'expire',
  BONUS: 'bonus',
} as const

export type PointsTransactionType = (typeof POINTS_TRANSACTION_TYPE)[keyof typeof POINTS_TRANSACTION_TYPE]

export const REWARD_TYPE = {
  VOUCHER: 'voucher',
  GIFT: 'gift',
  DISCOUNT: 'discount',
} as const

export type RewardType = (typeof REWARD_TYPE)[keyof typeof REWARD_TYPE]

export interface ILoyaltyPoints {
  _id: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  total_points: number
  available_points: number
  tier: LoyaltyTier
  lifetime_points: number
  created_at: Date
  updated_at: Date
}

export interface IPointsTransaction {
  _id: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  type: PointsTransactionType
  points: number
  description: string
  order_id?: mongoose.Types.ObjectId
  reward_id?: mongoose.Types.ObjectId
  created_at: Date
}

export interface IPointsReward {
  _id: mongoose.Types.ObjectId
  name: string
  description: string
  points_required: number
  reward_type: RewardType
  reward_value: number
  stock: number
  is_active: boolean
  image?: string
  created_at: Date
  updated_at: Date
}

const LoyaltyPointsSchema = new Schema<ILoyaltyPoints>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      unique: true,
      index: true,
    },
    total_points: {
      type: Number,
      default: 0,
      min: 0,
    },
    available_points: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: Object.values(LOYALTY_TIER),
      default: LOYALTY_TIER.BRONZE,
      index: true,
    },
    lifetime_points: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)

const PointsTransactionSchema = new Schema<IPointsTransaction>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(POINTS_TRANSACTION_TYPE),
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    order_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'purchases',
    },
    reward_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'points_rewards',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
)

PointsTransactionSchema.index({ user: 1, created_at: -1 })

const PointsRewardSchema = new Schema<IPointsReward>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    points_required: {
      type: Number,
      required: true,
      min: 0,
    },
    reward_type: {
      type: String,
      enum: Object.values(REWARD_TYPE),
      required: true,
      index: true,
    },
    reward_value: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    image: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)

export const LoyaltyPointsModel = mongoose.model<ILoyaltyPoints>('loyalty_points', LoyaltyPointsSchema)
export const PointsTransactionModel = mongoose.model<IPointsTransaction>('points_transactions', PointsTransactionSchema)
export const PointsRewardModel = mongoose.model<IPointsReward>('points_rewards', PointsRewardSchema)

