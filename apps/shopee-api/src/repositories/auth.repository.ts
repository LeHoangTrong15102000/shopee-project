import { Types } from 'mongoose'
import { RefreshTokenModel } from '@database/models/refresh-token.model'
import { IAuthRepository, IRefreshToken } from './interfaces/auth.repository.interface'

export class AuthRepository implements IAuthRepository {
  async createRefreshToken(userId: string | Types.ObjectId, token: string): Promise<IRefreshToken> {
    const refreshToken = new RefreshTokenModel({
      user_id: new Types.ObjectId(userId.toString()),
      token,
    })
    const saved = await refreshToken.save()
    return saved.toObject() as IRefreshToken
  }

  async createRefreshTokenWithJti(
    userId: string | Types.ObjectId,
    token: string,
    jti: string,
    expiresAt?: Date,
    rotatedFromJti?: string,
  ): Promise<IRefreshToken> {
    const refreshToken = new RefreshTokenModel({
      user_id: new Types.ObjectId(userId.toString()),
      token,
      jti,
      rotatedFromJti: rotatedFromJti || null,
      expiresAt: expiresAt || null,
      revokedAt: null,
    })
    const saved = await refreshToken.save()
    return saved.toObject() as IRefreshToken
  }

  async findRefreshToken(token: string): Promise<IRefreshToken | null> {
    return RefreshTokenModel.findOne({ token }).lean<IRefreshToken | null>()
  }

  async findRefreshTokenByJti(jti: string): Promise<IRefreshToken | null> {
    return RefreshTokenModel.findOne({ jti }).lean<IRefreshToken | null>()
  }

  async deleteRefreshToken(token: string): Promise<boolean> {
    const result = await RefreshTokenModel.deleteOne({ token })
    return result.deletedCount > 0
  }

  async revokeRefreshTokenByJti(jti: string): Promise<boolean> {
    const result = await RefreshTokenModel.updateOne(
      { jti, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    )
    return result.modifiedCount > 0
  }

  async deleteAllUserTokens(userId: string | Types.ObjectId): Promise<void> {
    const userObjectId = new Types.ObjectId(userId.toString())
    await RefreshTokenModel.deleteMany({ user_id: userObjectId })
  }

  async revokeAllUserTokens(userId: string | Types.ObjectId): Promise<void> {
    const userObjectId = new Types.ObjectId(userId.toString())
    await RefreshTokenModel.updateMany(
      { user_id: userObjectId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    )
  }

  async deleteExpiredTokens(): Promise<number> {
    const now = new Date()
    const result = await RefreshTokenModel.deleteMany({ expiresAt: { $lt: now } })
    return result.deletedCount
  }

  async isRefreshTokenValid(token: string): Promise<boolean> {
    const tokenDoc = await RefreshTokenModel.findOne({ token }).lean()
    if (!tokenDoc) return false
    if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt) < new Date()) return false
    return true
  }

  async rotateRefreshToken(
    oldToken: string,
    newToken: string,
    userId: string | Types.ObjectId,
  ): Promise<IRefreshToken | null> {
    const deleted = await this.deleteRefreshToken(oldToken)
    if (!deleted) return null
    return this.createRefreshToken(userId, newToken)
  }
}
