import mongoose, { Schema } from 'mongoose'

export interface IFeatureFlagConditions {
  userIds?: string[]
  userRoles?: string[]
  platform?: string[]
  startDate?: Date
  endDate?: Date
}

export interface IFeatureFlag {
  _id: mongoose.Types.ObjectId
  key: string
  name: string
  description?: string
  enabled: boolean
  rolloutPercentage: number
  conditions?: IFeatureFlagConditions
  createdAt: Date
  updatedAt: Date
}

const FeatureFlagConditionsSchema = new Schema<IFeatureFlagConditions>(
  {
    userIds: { type: [String], default: undefined },
    userRoles: { type: [String], default: undefined },
    platform: { type: [String], default: undefined },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { _id: false },
)

const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, maxlength: 200 },
    name: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    enabled: { type: Boolean, required: true, default: false },
    rolloutPercentage: { type: Number, required: true, default: 100, min: 0, max: 100 },
    conditions: { type: FeatureFlagConditionsSchema, default: undefined },
  },
  { timestamps: true },
)

FeatureFlagSchema.index({ key: 1 }, { unique: true })

export const FeatureFlagModel = mongoose.model<IFeatureFlag>('feature_flags', FeatureFlagSchema)
