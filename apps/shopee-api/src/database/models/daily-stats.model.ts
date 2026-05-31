import mongoose, { Schema } from 'mongoose'

export interface IDailyStats {
  _id: mongoose.Types.ObjectId
  date: Date
  totalOrders: number
  totalRevenue: number
  topProductIds: string[]
  newUsers: number
  createdAt: Date
  updatedAt: Date
}

const DailyStatsSchema = new Schema<IDailyStats>(
  {
    date: { type: Date, required: true, unique: true },
    totalOrders: { type: Number, required: true, default: 0 },
    totalRevenue: { type: Number, required: true, default: 0 },
    topProductIds: { type: [String], required: true, default: [] },
    newUsers: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
)

DailyStatsSchema.index({ date: -1 })

export const DailyStatsModel = mongoose.model<IDailyStats>('daily_stats', DailyStatsSchema)
