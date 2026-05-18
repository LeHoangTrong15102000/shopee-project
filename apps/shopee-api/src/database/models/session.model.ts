import mongoose, { Schema } from 'mongoose'

export interface ISession {
  _id?: mongoose.Types.ObjectId
  user_id: mongoose.Types.ObjectId
  /** SHA-256 hash of refreshJti — used for efficient session lookup during token refresh */
  refreshTokenHash: string
  /** Access token JTI (plaintext) — used to identify the current session from req.jwtDecoded.jti */
  accessJti: string
  /** Refresh token JTI (plaintext) — used to find and delete the RefreshToken document on revocation */
  refreshJti: string
  device: string
  ip: string
  location: string
  lastActive: Date
  expiresAt: Date
  isRevoked: boolean
  createdAt?: Date
}

const SessionSchema = new Schema(
  {
    user_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'users', required: true },
    refreshTokenHash: { type: String, required: true },
    accessJti: { type: String, required: true },
    refreshJti: { type: String, required: true },
    device: { type: String, maxlength: 200, default: 'Unknown' },
    ip: { type: String, maxlength: 45, default: 'unknown' },
    location: { type: String, maxlength: 200, default: 'Unknown' },
    lastActive: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

// Index for per-user session listing
SessionSchema.index({ user_id: 1, isRevoked: 1 })

// Index for token refresh lookup (find session by refreshTokenHash)
SessionSchema.index({ refreshTokenHash: 1 })

// Index for identifying current session from access token JTI
SessionSchema.index({ accessJti: 1 })

// TTL-style index — MongoDB will automatically remove expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const SessionModel = mongoose.model<ISession>('sessions', SessionSchema)
