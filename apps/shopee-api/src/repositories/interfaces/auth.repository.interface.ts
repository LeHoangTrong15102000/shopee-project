import { Types } from 'mongoose'

/**
 * Refresh token document interface
 */
export interface IRefreshToken {
  _id?: Types.ObjectId
  token: string
  user_id: Types.ObjectId | string
  createdAt?: Date
  expiresAt?: Date
}

/**
 * Token pair for authentication
 */
export interface TokenPair {
  access_token: string
  refresh_token: string
}

/**
 * Auth repository interface for token management
 * Note: Access tokens are stateless JWTs — only refresh tokens are persisted
 */
export interface IAuthRepository {
  /**
   * Create and store a refresh token
   */
  createRefreshToken(userId: string | Types.ObjectId, token: string): Promise<IRefreshToken>

  /**
   * Find refresh token by token string
   */
  findRefreshToken(token: string): Promise<IRefreshToken | null>

  /**
   * Delete refresh token
   */
  deleteRefreshToken(token: string): Promise<boolean>

  /**
   * Delete all refresh tokens for a user (logout from all devices)
   */
  deleteAllUserTokens(userId: string | Types.ObjectId): Promise<void>

  /**
   * Delete expired refresh tokens (cleanup)
   */
  deleteExpiredTokens(): Promise<number>

  /**
   * Check if refresh token exists and is valid
   */
  isRefreshTokenValid(token: string): Promise<boolean>

  /**
   * Rotate refresh token (delete old, create new)
   */
  rotateRefreshToken(
    oldToken: string,
    newToken: string,
    userId: string | Types.ObjectId,
  ): Promise<IRefreshToken | null>
}
