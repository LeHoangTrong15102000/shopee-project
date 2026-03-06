import mongoose, { Schema } from 'mongoose'

const RefreshTokenSchema = new Schema(
  {
    user_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'users', required: true },
    // Token gốc (backward compatible - sẽ deprecated trong tương lai)
    token: { type: String, unique: true, sparse: true },
    // Hash của token để lưu an toàn hơn (khuyến nghị sử dụng)
    tokenHash: { type: String, unique: true, sparse: true, index: true },
    // Thông tin thiết bị để track session
    userAgent: { type: String, maxlength: 500 },
    // IP address của client
    ipAddress: { type: String, maxlength: 45 },
    // Thời điểm token hết hạn (auto-expire)
    expiresAt: { type: Date, index: true },
  },
  {
    timestamps: true,
  }
)

// Index compound để query nhanh theo user và thời gian hết hạn
RefreshTokenSchema.index({ user_id: 1, expiresAt: 1 })

// TTL index để tự động xóa token hết hạn (MongoDB sẽ tự xóa sau khi expiresAt qua)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshTokenModel = mongoose.model(
  'refresh_tokens',
  RefreshTokenSchema
)
