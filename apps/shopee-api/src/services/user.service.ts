import crypto from 'crypto'
import { IUser, IPayloadToken } from '../@types/models.type'
import {
  IUserRepository,
  CreateUserDTO,
  UpdateUserDTO,
} from '@repositories/interfaces/user.repository.interface'
import {
  PaginatedResult,
  PaginationOptions,
} from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError, ConflictError } from './base.service'
import { hashValue, compareValue } from '@utils/crypt'
import { omitBy } from 'lodash'
import { SessionService } from './session.service'
import { signToken } from '@utils/jwt'
import { config } from '@constants/config'
import { AuthService } from './auth.service'

export interface ReissuedTokens {
  access_token: string
  expires: number
  refresh_token: string
  expires_refresh_token: number
  accessJti: string
  refreshJti: string
}

export interface UpdateProfileDTO {
  email?: string
  password?: string
  new_password?: string
  address?: string
  date_of_birth?: Date
  name?: string
  phone?: string
  avatar?: string
}

// User profile cache with 5-minute TTL
const userProfileCache = new Map<string, { data: Omit<IUser, 'password'>; expiry: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedProfile(userId: string): Omit<IUser, 'password'> | null {
  const cached = userProfileCache.get(userId)
  if (cached && cached.expiry > Date.now()) {
    return cached.data
  }
  userProfileCache.delete(userId)
  return null
}

function setCachedProfile(userId: string, data: Omit<IUser, 'password'>): void {
  userProfileCache.set(userId, { data, expiry: Date.now() + CACHE_TTL })
}

function invalidateProfileCache(userId: string): void {
  userProfileCache.delete(userId)
}

/**
 * Exported so auth middleware and other services can invalidate the profile cache
 * without importing the full UserService class. Used by:
 * - PasswordResetService.resetPassword
 * - auth.middleware verifyAccessToken (cache miss re-population)
 */
export {
  userProfileCache,
  getCachedProfile,
  setCachedProfile,
  invalidateProfileCache as invalidateUserProfileCache,
  CACHE_TTL,
}

export class UserService extends BaseService {
  /** Wired post-construction (see container.ts) to avoid circular instantiation order */
  sessionService: SessionService | undefined
  /** Wired post-construction (see container.ts) to re-issue tokens on password change */
  authService: AuthService | undefined

  constructor(private readonly userRepository: IUserRepository) {
    super()
  }

  /**
   * Re-issue a fresh access/refresh token pair for the session identified by
   * currentAccessJti, using the same generateTokens → createRefreshTokenWithJti
   * → updateSessionOnRefresh sequence as the refresh-token controller.
   *
   * Returns the new token pair, or null if authService / sessionService is not wired.
   */
  private async reissueTokensForCurrentSession(
    userId: string,
    currentAccessJti: string,
    userPayload: IPayloadToken,
  ): Promise<ReissuedTokens | null> {
    if (!this.authService || !this.sessionService) {
      return null
    }

    // Find the spared session so we can get its refreshJti (needed for updateSessionOnRefresh)
    const sparedSession = await this.sessionService.findActiveSessionByAccessJti(
      userId,
      currentAccessJti,
    )
    if (!sparedSession) {
      return null
    }
    const oldRefreshJti = sparedSession.refreshJti

    // Generate new JTIs
    const newAccessJti = crypto.randomUUID()
    const newRefreshJti = crypto.randomUUID()

    const accessPayload: IPayloadToken = { ...userPayload, jti: newAccessJti }
    const refreshPayload: IPayloadToken = { ...userPayload, jti: newRefreshJti }

    const [accessToken, refreshToken] = (await Promise.all([
      signToken(accessPayload, config.SECRET_KEY, config.EXPIRE_ACCESS_TOKEN),
      signToken(refreshPayload, config.SECRET_KEY, config.EXPIRE_REFRESH_TOKEN),
    ])) as [string, string]

    const expiresAt = new Date(Date.now() + config.EXPIRE_REFRESH_TOKEN * 1000)

    // Persist the new refresh token and revoke the old one (prevent old RT replay)
    await Promise.all([
      this.authService.createRefreshTokenForSession(userId, refreshToken, newRefreshJti, expiresAt),
      this.authService.revokeSessionRefreshToken(oldRefreshJti),
    ])

    // Update the spared session's JTIs
    await this.sessionService.updateSessionOnRefresh(oldRefreshJti, newAccessJti, newRefreshJti)

    return {
      access_token: 'Bearer ' + accessToken,
      expires: config.EXPIRE_ACCESS_TOKEN,
      refresh_token: refreshToken,
      expires_refresh_token: config.EXPIRE_REFRESH_TOKEN,
      accessJti: newAccessJti,
      refreshJti: newRefreshJti,
    }
  }

  async createUser(data: CreateUserDTO): Promise<IUser> {
    const emailExists = await this.userRepository.emailExists(data.email)
    if (emailExists) {
      throw new ConflictError('Email đã tồn tại')
    }

    const hashedPassword = hashValue(data.password)
    return this.userRepository.create({
      ...data,
      password: hashedPassword,
    })
  }

  async getUsers(pagination?: PaginationOptions): Promise<IUser[] | PaginatedResult<IUser>> {
    if (pagination) {
      return this.userRepository.findPaginated({}, this.normalizePagination(pagination))
    }
    return this.userRepository.find({})
  }

  async getUserById(userId: string): Promise<IUser> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundError('User', userId)
    }
    return user
  }

  async getProfile(userId: string): Promise<Omit<IUser, 'password'>> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    // Check cache first
    const cachedProfile = getCachedProfile(userId)
    if (cachedProfile) {
      return cachedProfile
    }

    const profile = await this.userRepository.getProfile(userId)
    if (!profile) {
      throw new NotFoundError('User', userId)
    }

    // Store in cache
    setCachedProfile(userId, profile)
    return profile
  }

  async updateUser(userId: string, data: UpdateUserDTO): Promise<IUser> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const cleanData = omitBy(data, (value) => value === undefined || value === '')
    const user = await this.userRepository.updateById(userId, cleanData as UpdateUserDTO)
    if (!user) {
      throw new NotFoundError('User', userId)
    }
    invalidateProfileCache(userId)
    return user
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDTO,
    currentAccessJti?: string,
  ): Promise<{ user: IUser; tokens: ReissuedTokens | null }> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const cleanData = omitBy(
      data,
      (value) => value === undefined || value === '',
    ) as UpdateProfileDTO

    // Handle password change
    if (cleanData.password) {
      const user = await this.userRepository.findByEmailWithPassword(
        (await this.userRepository.findById(userId))?.email || '',
      )
      if (!user) {
        throw new NotFoundError('User', userId)
      }

      const isPasswordValid = compareValue(cleanData.password, user.password)
      if (!isPasswordValid) {
        throw new ValidationError('Password không đúng', 'password')
      }

      if (!cleanData.new_password) {
        throw new ValidationError('New password is required', 'new_password')
      }

      cleanData.password = hashValue(cleanData.new_password)
      delete cleanData.new_password
    }

    const updateData: UpdateUserDTO = { ...cleanData }
    delete (updateData as UpdateProfileDTO).new_password

    // Stamp passwordChangedAt when the password is being changed
    const isPasswordChange = updateData.password !== undefined
    if (isPasswordChange) {
      updateData.passwordChangedAt = new Date()
    }

    const updatedUser = await this.userRepository.updateById(userId, updateData)
    if (!updatedUser) {
      throw new NotFoundError('User', userId)
    }
    invalidateProfileCache(userId)

    let tokens: ReissuedTokens | null = null

    // Revoke other sessions (spare current) after password change, then re-issue tokens
    if (isPasswordChange && this.sessionService) {
      await this.sessionService.revokeAllSessions(userId, currentAccessJti)

      if (currentAccessJti) {
        const payload: IPayloadToken = {
          id: updatedUser._id!.toString(),
          email: updatedUser.email,
          roles: updatedUser.roles || [],
          created_at: new Date().toISOString(),
        }
        tokens = await this.reissueTokensForCurrentSession(userId, currentAccessJti, payload)
      }
    }

    return { user: updatedUser, tokens }
  }

  async updateAvatar(userId: string, avatarPath: string): Promise<IUser> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const user = await this.userRepository.updateAvatar(userId, avatarPath)
    if (!user) {
      throw new NotFoundError('User', userId)
    }
    invalidateProfileCache(userId)
    return user
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const user = await this.userRepository.deleteById(userId)
    if (!user) {
      throw new NotFoundError('User', userId)
    }
    invalidateProfileCache(userId)
  }

  invalidateProfileCache(userId: string): void {
    invalidateProfileCache(userId)
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmail(email)
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmailWithPassword(email)
  }

  /**
   * Set a new password for a user who has no user-chosen password (e.g. Google-OAuth accounts).
   * Does NOT compare against any current password — the active session is proof of identity.
   * Hashes the new password, persists it (also stamps passwordChangedAt and flips hasPassword to true),
   * revokes other sessions (spares current), re-issues tokens for current session, and invalidates
   * the profile cache.
   */
  async setPassword(
    userId: string,
    newPassword: string,
    currentAccessJti?: string,
  ): Promise<ReissuedTokens | null> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    const hashedPassword = hashValue(newPassword)
    // Fetch user before updating so we have the data for the token payload
    const userDoc = await this.userRepository.findById(userId)
    if (!userDoc) {
      throw new NotFoundError('User', userId)
    }
    const updated = await this.userRepository.updatePassword(userId, hashedPassword, true)
    if (!updated) {
      throw new NotFoundError('User', userId)
    }
    invalidateProfileCache(userId)

    let tokens: ReissuedTokens | null = null

    // Revoke other sessions (spare current) and delete their refresh tokens
    if (this.sessionService) {
      await this.sessionService.revokeAllSessions(userId, currentAccessJti)

      if (currentAccessJti) {
        const payload: IPayloadToken = {
          id: userDoc._id!.toString(),
          email: userDoc.email,
          roles: userDoc.roles || [],
          created_at: new Date().toISOString(),
        }
        tokens = await this.reissueTokensForCurrentSession(userId, currentAccessJti, payload)
      }
    }

    return tokens
  }

  async searchUsers(query: string, pagination: PaginationOptions): Promise<PaginatedResult<IUser>> {
    return this.userRepository.search(query, this.normalizePagination(pagination))
  }
}
