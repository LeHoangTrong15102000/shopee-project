import mongoose, { Schema } from 'mongoose'

export type LoginStatus = 'success' | 'failed' | 'blocked'
export type LoginMethod = 'password' | '2fa' | 'backup-code' | 'google'

export interface ILoginHistory {
  _id?: mongoose.Types.ObjectId
  /** null for blocked attempts where user cannot be identified */
  user_id: mongoose.Types.ObjectId | null
  ip: string
  userAgent: string
  device: string
  location: string
  status: LoginStatus
  method: LoginMethod
  timestamp: Date
}

const LoginHistorySchema = new Schema(
  {
    user_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'users', default: null },
    ip: { type: String, maxlength: 45 },
    userAgent: { type: String, maxlength: 500 },
    device: { type: String, maxlength: 200 },
    location: { type: String, maxlength: 200 },
    status: {
      type: String,
      enum: ['success', 'failed', 'blocked'],
      required: true,
    },
    method: {
      type: String,
      enum: ['password', '2fa', 'backup-code', 'google'],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  },
)

// Compound index for per-user history queries sorted by time
LoginHistorySchema.index({ user_id: 1, timestamp: -1 })

// Index for admin queries by status
LoginHistorySchema.index({ status: 1, timestamp: -1 })

export const LoginHistoryModel = mongoose.model<ILoginHistory>(
  'login_histories',
  LoginHistorySchema,
)
