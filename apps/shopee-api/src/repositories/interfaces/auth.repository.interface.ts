import { Types } from 'mongoose'

/**
 * Refresh token document interface
 */
export interface IRefreshToken {
  _id?: Types.ObjectId
  token: string
  user_id: Types.ObjectId | string
  /** JWT ID for rotation tracking */
  jti?: string
  /** jti of prior token (audit trail) */
  rotatedFromJti?: string | null
  createdAt?: Date
  expiresAt?: Date
  /** Set when token is revoked (rotation, logout, or reuse detection) */
  revokedAt?: Date | null
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
   * Create and store a refresh token with jti for rotation tracking
   */
  createRefreshTokenWithJti(
    userId: string | Types.ObjectId,
    token: string,
    jti: string,
    expiresAt?: Date,
    rotatedFromJti?: string,
  ): Promise<IRefreshToken>

  /**
   * Find refresh token by token string
   */
  findRefreshToken(token: string): Promise<IRefreshToken | null>

  /**
   * Find refresh token by jti
   */
  findRefreshTokenByJti(jti: string): Promise<IRefreshToken | null>

  /**
   * Delete refresh token
   */
  deleteRefreshToken(token: string): Promise<boolean>

  /**
   * Revoke refresh token by jti (soft delete — sets revokedAt)
   */
  revokeRefreshTokenByJti(jti: string): Promise<boolean>

  /**
   * Delete all refresh tokens for a user (logout from all devices)
   */
  deleteAllUserTokens(userId: string | Types.ObjectId): Promise<void>

  /**
   * Revoke all tokens for a user — used when token reuse is detected
   */
  revokeAllUserTokens(userId: string | Types.ObjectId): Promise<void>

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
