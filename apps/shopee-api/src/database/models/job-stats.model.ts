import mongoose, { Schema } from 'mongoose'

export interface IJobStats {
  _id: mongoose.Types.ObjectId
  queue: string
  date: Date
  completed: number
  failed: number
  avgDurationMs: number
  p95DurationMs: number
  createdAt: Date
  updatedAt: Date
}

const JobStatsSchema = new Schema<IJobStats>(
  {
    queue: { type: String, required: true },
    date: { type: Date, required: true },
    completed: { type: Number, required: true, default: 0 },
    failed: { type: Number, required: true, default: 0 },
    avgDurationMs: { type: Number, required: true, default: 0 },
    p95DurationMs: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
)

// Unique compound index — one document per queue per day
JobStatsSchema.index({ queue: 1, date: 1 }, { unique: true })

export const JobStatsModel = mongoose.model<IJobStats>('job_stats', JobStatsSchema)
