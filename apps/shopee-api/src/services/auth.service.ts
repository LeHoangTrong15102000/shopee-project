import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { IUser, IPayloadToken } from '../@types/models.type'
import { IAuthRepository } from '@repositories/interfaces/auth.repository.interface'
import { IUserRepository } from '@repositories/interfaces/user.repository.interface'
import { BaseService, ValidationError, UnauthorizedError, ConflictError } from './base.service'
import { hashValue, compareValue } from '@utils/crypt'
import { signToken } from '@utils/jwt'
import { config } from '@constants/config'
import { ROLE } from '@constants/role.enum'
import { omit } from 'lodash'
import { Logger } from '@utils/logger'
import type { EventBus } from '../events/event-bus'

const googleOAuthClient = new OAuth2Client()

export interface RegisterDTO {
  email: string
  password: string
}

export interface LoginDTO {
  email: string
  password: string
}

export interface TokenConfig {
  expireAccessToken: number
  expireRefreshToken: number
}

export interface AuthResult {
  access_token: string
  expires: number
  refresh_token: string
  expires_refresh_token: number
  user: Omit<IUser, 'password'>
  /** Access token JTI — passed to sessionService.createSession() by the controller */
  accessJti: string
  /** Refresh token JTI — passed to sessionService.createSession() by the controller */
  refreshJti: string
}

/** Returned by login() when the user has 2FA enabled — caller must complete via /auth/2fa/complete */
export interface TwoFactorRequiredResult {
  requires2FA: true
  partial_token: string
}

export class AuthService extends BaseService {
  eventBus?: EventBus

  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly userRepository: IUserRepository,
  ) {
    super()
  }

  /** Generate a unique JWT ID for token reuse detection */
  private generateJti(): string {
    return crypto.randomUUID()
  }

  private async generateTokens(
    payload: IPayloadToken,
    tokenConfig: TokenConfig,
  ): Promise<{ accessToken: string; refreshToken: string; accessJti: string; refreshJti: string }> {
    const accessJti = this.generateJti()
    const refreshJti = this.generateJti()

    const accessPayload: IPayloadToken = { ...payload, jti: accessJti }
    const refreshPayload: IPayloadToken = { ...payload, jti: refreshJti }

    const [accessToken, refreshToken] = await Promise.all([
      signToken(accessPayload, config.SECRET_KEY, tokenConfig.expireAccessToken),
      signToken(refreshPayload, config.SECRET_KEY, tokenConfig.expireRefreshToken),
    ])
    return {
      accessToken: accessToken as string,
      refreshToken: refreshToken as string,
      accessJti,
      refreshJti,
    }
  }

  async register(data: RegisterDTO, tokenConfig: TokenConfig): Promise<AuthResult> {
    const emailExists = await this.userRepository.emailExists(data.email)
    if (emailExists) {
      throw new ConflictError('Email đã tồn tại')
    }

    const hashedPassword = hashValue(data.password)
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      roles: [ROLE.USER],
    })

    const payload: IPayloadToken = {
      id: user._id!.toString(),
      email: user.email,
      roles: user.roles || [ROLE.USER],
      created_at: new Date().toISOString(),
    }

    const { accessToken, refreshToken, accessJti, refreshJti } = await this.generateTokens(
      payload,
      tokenConfig,
    )

    const expiresAt = new Date(Date.now() + tokenConfig.expireRefreshToken * 1000)

    // Persist refresh token with jti for rotation tracking
    await this.authRepository.createRefreshTokenWithJti(
      user._id!,
      refreshToken,
      refreshJti,
      expiresAt,
    )

    Logger.apiInfo('auth.refresh.rotation', { event: 'register', userId: user._id!.toString() })

    // Emit domain event
    this.eventBus?.emit({
      type: 'user.registered',
      payload: {
        userId: user._id!.toString(),
        email: user.email,
        registeredAt: new Date(),
      },
    })

    return {
      access_token: 'Bearer ' + accessToken,
      expires: tokenConfig.expireAccessToken,
      refresh_token: refreshToken,
      expires_refresh_token: tokenConfig.expireRefreshToken,
      user: omit(user, ['password']) as Omit<IUser, 'password'>,
      accessJti,
      refreshJti,
    }
  }

  async login(
    data: LoginDTO,
    tokenConfig: TokenConfig,
  ): Promise<AuthResult | TwoFactorRequiredResult> {
    const user = await this.userRepository.findByEmailWithPassword(data.email)
    if (!user) {
      throw new ValidationError('Email hoặc password không đúng', 'password')
    }

    const isPasswordValid = compareValue(data.password, user.password)
    if (!isPasswordValid) {
      throw new ValidationError('Email hoặc password không đúng', 'password')
    }

    // If 2FA is enabled, issue a short-lived partial token instead of full tokens
    if (user.twoFactorEnabled) {
      const partialPayload: IPayloadToken = {
        id: user._id!.toString(),
        email: user.email,
        roles: user.roles || [ROLE.USER],
        created_at: new Date().toISOString(),
        jti: this.generateJti(),
        scope: '2fa_pending',
      }
      // 5-minute expiry for partial token
      const partialToken = (await signToken(partialPayload, config.SECRET_KEY, 300)) as string

      Logger.apiInfo('auth.login.2fa_required', { userId: user._id!.toString() })

      return { requires2FA: true, partial_token: partialToken }
    }

    const payload: IPayloadToken = {
      id: user._id!.toString(),
      email: user.email,
      roles: user.roles || [ROLE.USER],
      created_at: new Date().toISOString(),
    }

    const { accessToken, refreshToken, accessJti, refreshJti } = await this.generateTokens(
      payload,
      tokenConfig,
    )

    const expiresAt = new Date(Date.now() + tokenConfig.expireRefreshToken * 1000)

    // Persist refresh token with jti for rotation tracking
    await this.authRepository.createRefreshTokenWithJti(
      user._id!,
      refreshToken,
      refreshJti,
      expiresAt,
    )

    Logger.apiInfo('auth.refresh.rotation', { event: 'login', userId: user._id!.toString() })

    return {
      access_token: 'Bearer ' + accessToken,
      expires: tokenConfig.expireAccessToken,
      refresh_token: refreshToken,
      expires_refresh_token: tokenConfig.expireRefreshToken,
      user: omit(user, ['password']) as Omit<IUser, 'password'>,
      accessJti,
      refreshJti,
    }
  }

  /**
   * Refresh token rotation with reuse detection.
   *
   * Flow:
   * 1. The caller (middleware) already verified the JWT signature.
   * 2. We look up the token's jti in the DB.
   * 3. If jti is missing or already revoked → reuse detected → revoke ALL user tokens → 401.
   * 4. Otherwise: revoke old token, issue new access + refresh pair with new jti.
   */
  async refreshTokenWithRotation(
    userId: string,
    oldRefreshToken: string,
    oldJti: string | undefined,
    tokenConfig: TokenConfig,
  ): Promise<{
    access_token: string
    refresh_token: string
    expires: number
    expires_refresh_token: number
    accessJti: string
    refreshJti: string
  }> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new UnauthorizedError('User không tồn tại')
    }

    if (!oldJti) {
      // Legacy token without jti — fall back to old token-based lookup
      const tokenDoc = await this.authRepository.findRefreshToken(oldRefreshToken)
      if (!tokenDoc) {
        throw new UnauthorizedError('Refresh token không tồn tại')
      }
      // Delete the old (legacy) token
      await this.authRepository.deleteRefreshToken(oldRefreshToken)
    } else {
      // New flow: look up by jti
      const tokenDoc = await this.authRepository.findRefreshTokenByJti(oldJti)

      if (!tokenDoc) {
        // jti not found at all — this is a reuse of a rotated-away token
        Logger.apiWarn('auth.refresh.reuse_detected', {
          userId,
          jti: oldJti,
          reason: 'jti not found',
        })
        // Security: revoke ALL tokens for this user (token theft assumed)
        await this.authRepository.revokeAllUserTokens(userId)
        throw new UnauthorizedError('Refresh token không hợp lệ — toàn bộ session đã bị thu hồi')
      }

      if (tokenDoc.revokedAt) {
        // jti exists but already revoked — reuse detected
        Logger.apiWarn('auth.refresh.reuse_detected', {
          userId,
          jti: oldJti,
          revokedAt: tokenDoc.revokedAt,
        })
        // Security: revoke ALL tokens for this user (token theft assumed)
        await this.authRepository.revokeAllUserTokens(userId)
        throw new UnauthorizedError('Refresh token đã hết hạn — toàn bộ session đã bị thu hồi')
      }

      // Revoke the old token (soft delete) before issuing new one
      await this.authRepository.revokeRefreshTokenByJti(oldJti)
    }

    const payload: IPayloadToken = {
      id: user._id!.toString(),
      email: user.email,
      roles: user.roles || [ROLE.USER],
      created_at: new Date().toISOString(),
    }

    const { accessToken, refreshToken, accessJti, refreshJti } = await this.generateTokens(
      payload,
      tokenConfig,
    )

    const expiresAt = new Date(Date.now() + tokenConfig.expireRefreshToken * 1000)

    // Persist new refresh token
    await this.authRepository.createRefreshTokenWithJti(
      user._id!,
      refreshToken,
      refreshJti,
      expiresAt,
      oldJti, // rotatedFromJti for audit trail
    )

    Logger.apiInfo('auth.refresh.rotation', {
      userId,
      oldJti,
      newJti: refreshJti,
    })

    return {
      access_token: 'Bearer ' + accessToken,
      refresh_token: refreshToken,
      expires: tokenConfig.expireAccessToken,
      expires_refresh_token: tokenConfig.expireRefreshToken,
      accessJti,
      refreshJti,
    }
  }

  /**
   * Legacy refreshToken — kept for backward compatibility.
   * Issues new access token only (no refresh token rotation).
   * @deprecated Use refreshTokenWithRotation instead.
   */
  async refreshToken(userId: string, expireAccessToken: number): Promise<{ access_token: string }> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new UnauthorizedError('Refresh token không tồn tại')
    }

    const payload: IPayloadToken = {
      id: user._id!.toString(),
      email: user.email,
      roles: user.roles || [ROLE.USER],
      created_at: new Date().toISOString(),
      jti: this.generateJti(),
    }

    // Generate new stateless access token — no database storage
    const accessToken = (await signToken(payload, config.SECRET_KEY, expireAccessToken)) as string

    return { access_token: 'Bearer ' + accessToken }
  }

  async googleLogin(idToken: string, tokenConfig: TokenConfig): Promise<AuthResult> {
    let payload
    try {
      const ticket = await googleOAuthClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      payload = ticket.getPayload()
    } catch {
      throw new UnauthorizedError('Google token verification failed')
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedError('Google token verification failed')
    }

    const email = payload.email
    const name = payload.name || email.split('@')[0]
    const avatar = payload.picture

    let user = await this.userRepository.findByEmail(email)
    if (!user) {
      // Create new user with Google profile info (random password since they use OAuth)
      const randomPassword = crypto.randomBytes(32).toString('hex')
      user = await this.userRepository.create({
        email,
        password: hashValue(randomPassword),
        name,
        avatar,
        roles: [ROLE.USER],
      })
    }

    const tokenPayload: IPayloadToken = {
      id: user._id!.toString(),
      email: user.email,
      roles: user.roles || [ROLE.USER],
      created_at: new Date().toISOString(),
    }

    const { accessToken, refreshToken, accessJti, refreshJti } = await this.generateTokens(
      tokenPayload,
      tokenConfig,
    )

    const expiresAt = new Date(Date.now() + tokenConfig.expireRefreshToken * 1000)
    await this.authRepository.createRefreshTokenWithJti(
      user._id!,
      refreshToken,
      refreshJti,
      expiresAt,
    )

    Logger.apiInfo('auth.google.login', { userId: user._id!.toString(), email })

    return {
      access_token: 'Bearer ' + accessToken,
      expires: tokenConfig.expireAccessToken,
      refresh_token: refreshToken,
      expires_refresh_token: tokenConfig.expireRefreshToken,
      user: omit(user, ['password']) as Omit<IUser, 'password'>,
      accessJti,
      refreshJti,
    }
  }

  async logout(refreshToken: string): Promise<void> {
    // Delete refresh token to prevent new access tokens from being issued
    await this.authRepository.deleteRefreshToken(refreshToken)
  }

  /**
   * Persist a refresh token for a session — used by the 2FA complete flow
   * where the token pair is generated inside TotpService.
   */
  async createRefreshTokenForSession(
    userId: string,
    refreshToken: string,
    refreshJti: string,
    expiresAt: Date,
  ): Promise<void> {
    const { Types } = await import('mongoose')
    await this.authRepository.createRefreshTokenWithJti(
      new Types.ObjectId(userId),
      refreshToken,
      refreshJti,
      expiresAt,
    )
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepository.deleteAllUserTokens(userId)
  }

  async validateRefreshToken(token: string): Promise<boolean> {
    return this.authRepository.isRefreshTokenValid(token)
  }
}
