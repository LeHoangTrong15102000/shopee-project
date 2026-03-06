import { Types } from 'mongoose'

/**
 * Access token document interface
 */
export interface IAccessToken {
  _id?: Types.ObjectId
  token: string
  user_id: Types.ObjectId | string
  createdAt?: Date
  expiresAt?: Date
}

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
 */
export interface IAuthRepository {
  /**
   * Create and store an access token
   */
  createAccessToken(userId: string | Types.ObjectId, token: string): Promise<IAccessToken>

  /**
   * Create and store a refresh token
   */
  createRefreshToken(userId: string | Types.ObjectId, token: string): Promise<IRefreshToken>

  /**
   * Find access token by token string
   */
  findAccessToken(token: string): Promise<IAccessToken | null>

  /**
   * Find refresh token by token string
   */
  findRefreshToken(token: string): Promise<IRefreshToken | null>

  /**
   * Delete access token
   */
  deleteAccessToken(token: string): Promise<boolean>

  /**
   * Delete refresh token
   */
  deleteRefreshToken(token: string): Promise<boolean>

  /**
   * Delete all tokens for a user (logout from all devices)
   */
  deleteAllUserTokens(userId: string | Types.ObjectId): Promise<void>

  /**
   * Delete expired tokens (cleanup)
   */
  deleteExpiredTokens(): Promise<number>

  /**
   * Check if access token exists and is valid
   */
  isAccessTokenValid(token: string): Promise<boolean>

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
    userId: string | Types.ObjectId
  ): Promise<IRefreshToken | null>
}

