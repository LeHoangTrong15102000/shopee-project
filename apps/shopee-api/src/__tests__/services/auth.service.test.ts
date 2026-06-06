/**
 * Unit Tests for AuthService
 * Tests authentication operations: register, login, logout, token management
 * Note: Access tokens are stateless JWTs — only refresh tokens are persisted
 */

/// <reference types="jest" />
import { AuthService, TokenConfig } from '@services/auth.service'
import { ValidationError, ConflictError, UnauthorizedError } from '@services/base.service'
import { IAuthRepository } from '@repositories/interfaces/auth.repository.interface'
import { IUserRepository } from '@repositories/interfaces/user.repository.interface'
import { Types } from 'mongoose'

// Mock dependencies
jest.mock('@utils/crypt', () => ({
  hashValue: jest.fn((value: string) => `hashed_${value}`),
  compareValue: jest.fn(),
}))

jest.mock('@utils/jwt', () => ({
  signToken: jest.fn().mockResolvedValue('mock_token'),
}))

jest.mock('@constants/config', () => ({
  config: {
    SECRET_KEY: 'test-secret-key-that-is-at-least-32-chars',
    EXPIRE_ACCESS_TOKEN: 900, // 15 minutes — stateless JWT
    EXPIRE_REFRESH_TOKEN: 2592000, // 30 days
    AUTH_STRICT_MODE: false,
    GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
  },
}))

// Mock google-auth-library for googleLogin tests
// Use a shared mutable object so the mock factory closure captures it correctly
const googleAuthMock = {
  verifyIdToken: jest.fn(),
  getPayload: jest.fn(),
}
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: (...args: unknown[]) => googleAuthMock.verifyIdToken(...args),
  })),
}))

import { hashValue, compareValue } from '@utils/crypt'

describe('AuthService', () => {
  let authService: AuthService
  let mockAuthRepository: jest.Mocked<IAuthRepository>
  let mockUserRepository: jest.Mocked<IUserRepository>

  const validObjectId = new Types.ObjectId()
  const mockUser = {
    _id: validObjectId,
    email: 'test@example.com',
    password: 'hashed_password123',
    roles: ['User'],
    name: 'Test User',
  }

  const tokenConfig: TokenConfig = {
    expireAccessToken: 900,
    expireRefreshToken: 8640000,
  }

  beforeEach(() => {
    mockAuthRepository = {
      createRefreshToken: jest.fn(),
      createRefreshTokenWithJti: jest.fn(),
      deleteRefreshToken: jest.fn(),
      deleteAllUserTokens: jest.fn(),
      revokeAllUserTokens: jest.fn(),
      revokeRefreshTokenByJti: jest.fn(),
      isRefreshTokenValid: jest.fn(),
      rotateRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      findRefreshTokenByJti: jest.fn(),
      deleteExpiredTokens: jest.fn(),
    } as unknown as jest.Mocked<IAuthRepository>

    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findPaginated: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      emailExists: jest.fn(),
      updatePassword: jest.fn(),
      updateAvatar: jest.fn(),
      getProfile: jest.fn(),
      search: jest.fn(),
      findByRole: jest.fn(),
      updateMany: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>

    authService = new AuthService(mockAuthRepository, mockUserRepository)
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('should register new user successfully', async () => {
      mockUserRepository.emailExists.mockResolvedValue(false)
      mockUserRepository.create.mockResolvedValue(mockUser as any)
      mockAuthRepository.createRefreshTokenWithJti.mockResolvedValue({} as any)

      const result = await authService.register(
        { email: 'test@example.com', password: 'password123' },
        tokenConfig,
      )

      expect(mockUserRepository.emailExists).toHaveBeenCalledWith('test@example.com')
      expect(hashValue).toHaveBeenCalledWith('password123')
      expect(mockAuthRepository.createRefreshTokenWithJti).toHaveBeenCalled()
      expect(result.access_token).toContain('Bearer')
      expect(result.user.email).toBe('test@example.com')
    })

    it('should throw ConflictError if email already exists', async () => {
      mockUserRepository.emailExists.mockResolvedValue(true)

      await expect(
        authService.register(
          { email: 'existing@example.com', password: 'password123' },
          tokenConfig,
        ),
      ).rejects.toThrow(ConflictError)
    })
  })

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser as any)
      ;(compareValue as jest.Mock).mockReturnValue(true)
      mockAuthRepository.createRefreshTokenWithJti.mockResolvedValue({} as any)

      const result = await authService.login(
        { email: 'test@example.com', password: 'password123' },
        tokenConfig,
      )

      expect(mockAuthRepository.createRefreshTokenWithJti).toHaveBeenCalled()
      // Narrow to AuthResult — this user has no 2FA enabled
      expect('requires2FA' in result).toBe(false)
      if (!('requires2FA' in result)) {
        expect(result.access_token).toContain('Bearer')
        expect(result.user.email).toBe('test@example.com')
      }
    })

    it('should throw ValidationError with wrong password', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser as any)
      ;(compareValue as jest.Mock).mockReturnValue(false)

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrongpassword' }, tokenConfig),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError if user not found', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null)

      await expect(
        authService.login(
          { email: 'nonexistent@example.com', password: 'password123' },
          tokenConfig,
        ),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('logout', () => {
    it('should logout successfully by deleting refresh token', async () => {
      mockAuthRepository.deleteRefreshToken.mockResolvedValue(true)

      await authService.logout('mock_refresh_token')

      expect(mockAuthRepository.deleteRefreshToken).toHaveBeenCalledWith('mock_refresh_token')
    })
  })

  describe('refreshToken', () => {
    it('should refresh token successfully (stateless AT, no DB storage)', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser as any)

      const result = await authService.refreshToken(validObjectId.toString(), 900)

      expect(result.access_token).toContain('Bearer')
      // No createAccessToken call — AT is stateless
    })

    it('should throw UnauthorizedError if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      await expect(authService.refreshToken(validObjectId.toString(), 900)).rejects.toThrow(
        UnauthorizedError,
      )
    })
  })

  describe('logoutAll', () => {
    it('should delete all refresh tokens for user', async () => {
      mockAuthRepository.deleteAllUserTokens.mockResolvedValue()

      await authService.logoutAll(validObjectId.toString())

      expect(mockAuthRepository.deleteAllUserTokens).toHaveBeenCalledWith(validObjectId.toString())
    })
  })

  describe('validateRefreshToken', () => {
    it('should return true for valid refresh token', async () => {
      mockAuthRepository.isRefreshTokenValid.mockResolvedValue(true)

      const result = await authService.validateRefreshToken('valid_refresh_token')

      expect(result).toBe(true)
      expect(mockAuthRepository.isRefreshTokenValid).toHaveBeenCalledWith('valid_refresh_token')
    })

    it('should return false for invalid refresh token', async () => {
      mockAuthRepository.isRefreshTokenValid.mockResolvedValue(false)

      const result = await authService.validateRefreshToken('invalid_refresh_token')

      expect(result).toBe(false)
    })
  })

  // =================== Task 6.2: googleLogin security tests ===================

  describe('googleLogin', () => {
    const tokenConfig: TokenConfig = {
      expireAccessToken: 900,
      expireRefreshToken: 2592000,
    }

    const basePayload = {
      email: 'user@example.com',
      email_verified: true,
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
    }

    beforeEach(() => {
      googleAuthMock.verifyIdToken.mockResolvedValue({ getPayload: googleAuthMock.getPayload })
    })

    it('6.2 — should return full tokens for a valid existing user without 2FA', async () => {
      googleAuthMock.getPayload.mockReturnValue(basePayload)
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any)
      mockAuthRepository.createRefreshTokenWithJti.mockResolvedValue({} as any)

      const result = await authService.googleLogin('valid_id_token', tokenConfig)

      expect('requires2FA' in result).toBe(false)
      if (!('requires2FA' in result)) {
        expect(result.access_token).toContain('Bearer')
        expect(result.user.email).toBe('test@example.com')
      }
    })

    it('6.2 — should return requires2FA + partial_token when user has twoFactorEnabled=true', async () => {
      googleAuthMock.getPayload.mockReturnValue(basePayload)
      const userWith2FA = { ...mockUser, email: 'user@example.com', twoFactorEnabled: true }
      mockUserRepository.findByEmail.mockResolvedValue(userWith2FA as any)

      const result = await authService.googleLogin('valid_id_token', tokenConfig)

      expect('requires2FA' in result).toBe(true)
      if ('requires2FA' in result) {
        expect(result.requires2FA).toBe(true)
        expect(result.partial_token).toBe('mock_token')
      }
      // Must NOT have called createRefreshTokenWithJti (no full tokens issued)
      expect(mockAuthRepository.createRefreshTokenWithJti).not.toHaveBeenCalled()
    })

    it('6.2 — should throw UnauthorizedError when email_verified is false', async () => {
      googleAuthMock.getPayload.mockReturnValue({ ...basePayload, email_verified: false })

      await expect(authService.googleLogin('unverified_id_token', tokenConfig)).rejects.toThrow(
        UnauthorizedError,
      )
      // Must NOT create any account or token
      expect(mockUserRepository.create).not.toHaveBeenCalled()
      expect(mockAuthRepository.createRefreshTokenWithJti).not.toHaveBeenCalled()
    })

    it('6.2 — should throw UnauthorizedError when email_verified is undefined (not set)', async () => {
      const payloadWithoutVerified: Record<string, unknown> = { ...basePayload }
      delete payloadWithoutVerified['email_verified']
      googleAuthMock.getPayload.mockReturnValue(payloadWithoutVerified)

      await expect(authService.googleLogin('unverified_id_token', tokenConfig)).rejects.toThrow(
        UnauthorizedError,
      )
    })

    it('6.2 — should throw UnauthorizedError when Google token verification fails', async () => {
      googleAuthMock.verifyIdToken.mockRejectedValue(new Error('Token invalid'))

      await expect(authService.googleLogin('bad_token', tokenConfig)).rejects.toThrow(
        UnauthorizedError,
      )
    })

    it('6.2 — should create new user and emit user.registered for a new Google account', async () => {
      googleAuthMock.getPayload.mockReturnValue(basePayload)
      mockUserRepository.findByEmail.mockResolvedValue(null) // new user
      mockUserRepository.create.mockResolvedValue({
        ...mockUser,
        email: 'user@example.com',
        name: 'Test User',
      } as any)
      mockAuthRepository.createRefreshTokenWithJti.mockResolvedValue({} as any)

      const mockEventBus = { emit: jest.fn() }
      authService.eventBus = mockEventBus as any

      await authService.googleLogin('valid_id_token', tokenConfig)

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@example.com' }),
      )
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'user.registered',
          payload: expect.objectContaining({ email: 'user@example.com' }),
        }),
      )
    })

    it('6.2 — should NOT emit user.registered for an existing user', async () => {
      googleAuthMock.getPayload.mockReturnValue(basePayload)
      mockUserRepository.findByEmail.mockResolvedValue({ ...mockUser, email: 'user@example.com' } as any)
      mockAuthRepository.createRefreshTokenWithJti.mockResolvedValue({} as any)

      const mockEventBus = { emit: jest.fn() }
      authService.eventBus = mockEventBus as any

      await authService.googleLogin('valid_id_token', tokenConfig)

      expect(mockUserRepository.create).not.toHaveBeenCalled()
      expect(mockEventBus.emit).not.toHaveBeenCalled()
    })
  })

  // =================== Task 6.2: Refresh rotation tests ===================

  describe('refreshTokenWithRotation', () => {
    const oldJti = 'old-jti-uuid'
    const oldRefreshToken = 'old_refresh_token_jwt'

    it('6.2 — should issue new tokens with new jti and revoke old jti', async () => {
      // Given: user exists and old token is active
      mockUserRepository.findById.mockResolvedValue(mockUser as any)
      mockAuthRepository.findRefreshTokenByJti.mockResolvedValue({
        _id: new Types.ObjectId(),
        jti: oldJti,
        token: oldRefreshToken,
        user_id: validObjectId,
        revokedAt: null,
      } as any)
      mockAuthRepository.revokeRefreshTokenByJti.mockResolvedValue(true)
      mockAuthRepository.createRefreshTokenWithJti.mockResolvedValue({} as any)

      const result = await authService.refreshTokenWithRotation(
        validObjectId.toString(),
        oldRefreshToken,
        oldJti,
        tokenConfig,
      )

      // New pair should be returned
      expect(result.access_token).toContain('Bearer')
      expect(result.refresh_token).toBeDefined()

      // Old token should be revoked
      expect(mockAuthRepository.revokeRefreshTokenByJti).toHaveBeenCalledWith(oldJti)

      // New token should be persisted with old jti as rotatedFromJti
      expect(mockAuthRepository.createRefreshTokenWithJti).toHaveBeenCalledWith(
        expect.anything(), // userId
        expect.any(String), // new refresh token JWT
        expect.any(String), // new jti (different from oldJti)
        expect.any(Date), // expiresAt
        oldJti, // rotatedFromJti for audit
      )
    })

    it('6.3 — should revoke all user tokens and return 401 when replaying already-rotated token', async () => {
      // Given: user exists but token jti is already revoked (reuse detected)
      mockUserRepository.findById.mockResolvedValue(mockUser as any)
      mockAuthRepository.findRefreshTokenByJti.mockResolvedValue({
        jti: oldJti,
        token: oldRefreshToken,
        user_id: validObjectId,
        revokedAt: new Date(), // already revoked!
      } as any)
      mockAuthRepository.revokeAllUserTokens.mockResolvedValue(undefined)

      await expect(
        authService.refreshTokenWithRotation(
          validObjectId.toString(),
          oldRefreshToken,
          oldJti,
          tokenConfig,
        ),
      ).rejects.toThrow(UnauthorizedError)

      // All user tokens should be revoked
      expect(mockAuthRepository.revokeAllUserTokens).toHaveBeenCalledWith(validObjectId.toString())
    })

    it('6.3 — should revoke all user tokens when jti not found in DB (expired/unknown)', async () => {
      // Given: jti not found in DB at all
      mockUserRepository.findById.mockResolvedValue(mockUser as any)
      mockAuthRepository.findRefreshTokenByJti.mockResolvedValue(null)
      mockAuthRepository.revokeAllUserTokens.mockResolvedValue(undefined)

      await expect(
        authService.refreshTokenWithRotation(
          validObjectId.toString(),
          oldRefreshToken,
          oldJti,
          tokenConfig,
        ),
      ).rejects.toThrow(UnauthorizedError)

      expect(mockAuthRepository.revokeAllUserTokens).toHaveBeenCalledWith(validObjectId.toString())
    })

    it('should handle legacy tokens (no jti) by looking up by token string', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser as any)
      mockAuthRepository.findRefreshToken.mockResolvedValue({
        token: oldRefreshToken,
        user_id: validObjectId,
      } as any)
      mockAuthRepository.deleteRefreshToken.mockResolvedValue(true)
      mockAuthRepository.createRefreshTokenWithJti.mockResolvedValue({} as any)

      const result = await authService.refreshTokenWithRotation(
        validObjectId.toString(),
        oldRefreshToken,
        undefined, // no jti — legacy token
        tokenConfig,
      )

      expect(result.access_token).toContain('Bearer')
      expect(mockAuthRepository.deleteRefreshToken).toHaveBeenCalledWith(oldRefreshToken)
    })

    it('should throw UnauthorizedError when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      await expect(
        authService.refreshTokenWithRotation(
          validObjectId.toString(),
          oldRefreshToken,
          oldJti,
          tokenConfig,
        ),
      ).rejects.toThrow(UnauthorizedError)
    })
  })
})
