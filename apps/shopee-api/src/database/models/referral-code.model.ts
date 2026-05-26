import mongoose, { Schema } from 'mongoose'

export type ReferralCodeStatus = 'active' | 'inactive' | 'expired'

export interface IReferralCode {
  _id?: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  code: string
  usageCount: number
  maxUsages: number
  rewardPerReferral: number
  isActive: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ReferralCodeSchema = new Schema<IReferralCode>(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      maxlength: 20,
      index: true,
    },
    usageCount: { type: Number, default: 0, min: 0 },
    maxUsages: { type: Number, default: 50, min: 1 },
    rewardPerReferral: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  },
)

export const ReferralCodeModel = mongoose.model<IReferralCode>('referral_codes', ReferralCodeSchema)
