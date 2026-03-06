import { Types } from 'mongoose'
import { AccessTokenModel } from '@database/models/access-token.model'
import { RefreshTokenModel } from '@database/models/refresh-token.model'
import {
  IAuthRepository,
  IAccessToken,
  IRefreshToken,
} from './interfaces/auth.repository.interface'

export class AuthRepository implements IAuthRepository {
  async createAccessToken(userId: string | Types.ObjectId, token: string): Promise<IAccessToken> {
    const accessToken = new AccessTokenModel({
      user_id: new Types.ObjectId(userId.toString()),
      token,
    })
    const saved = await accessToken.save()
    return saved.toObject() as IAccessToken
  }

  async createRefreshToken(userId: string | Types.ObjectId, token: string): Promise<IRefreshToken> {
    const refreshToken = new RefreshTokenModel({
      user_id: new Types.ObjectId(userId.toString()),
      token,
    })
    const saved = await refreshToken.save()
    return saved.toObject() as IRefreshToken
  }

  async findAccessToken(token: string): Promise<IAccessToken | null> {
    return AccessTokenModel.findOne({ token }).lean<IAccessToken | null>()
  }

  async findRefreshToken(token: string): Promise<IRefreshToken | null> {
    return RefreshTokenModel.findOne({ token }).lean<IRefreshToken | null>()
  }

  async deleteAccessToken(token: string): Promise<boolean> {
    const result = await AccessTokenModel.deleteOne({ token })
    return result.deletedCount > 0
  }

  async deleteRefreshToken(token: string): Promise<boolean> {
    const result = await RefreshTokenModel.deleteOne({ token })
    return result.deletedCount > 0
  }

  async deleteAllUserTokens(userId: string | Types.ObjectId): Promise<void> {
    const userObjectId = new Types.ObjectId(userId.toString())
    await Promise.all([
      AccessTokenModel.deleteMany({ user_id: userObjectId }),
      RefreshTokenModel.deleteMany({ user_id: userObjectId }),
    ])
  }

  async deleteExpiredTokens(): Promise<number> {
    const now = new Date()
    const [accessResult, refreshResult] = await Promise.all([
      AccessTokenModel.deleteMany({ expiresAt: { $lt: now } }),
      RefreshTokenModel.deleteMany({ expiresAt: { $lt: now } }),
    ])
    return accessResult.deletedCount + refreshResult.deletedCount
  }

  async isAccessTokenValid(token: string): Promise<boolean> {
    const tokenDoc = await AccessTokenModel.findOne({ token }).lean()
    if (!tokenDoc) return false
    if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt) < new Date()) return false
    return true
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
    userId: string | Types.ObjectId
  ): Promise<IRefreshToken | null> {
    const deleted = await this.deleteRefreshToken(oldToken)
    if (!deleted) return null
    return this.createRefreshToken(userId, newToken)
  }
}

