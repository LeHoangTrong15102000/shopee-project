import mongoose, { Schema } from 'mongoose'

export interface ICheckIn {
  _id: mongoose.Types.ObjectId
  user_id: mongoose.Types.ObjectId
  date: string // YYYY-MM-DD
  streak_day: number
  reward_type: string
  reward_value: number
  created_at: Date
  updated_at: Date
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    streak_day: {
      type: Number,
      required: true,
      min: 1,
    },
    reward_type: {
      type: String,
      required: true,
      default: 'coins',
    },
    reward_value: {
      type: Number,
      required: true,
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

// Unique compound index to prevent duplicate check-ins
CheckInSchema.index({ user_id: 1, date: 1 }, { unique: true })

export const CheckInModel = mongoose.model<ICheckIn>('checkins', CheckInSchema)

