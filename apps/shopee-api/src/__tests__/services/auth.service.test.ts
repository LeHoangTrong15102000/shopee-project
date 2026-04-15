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
    SECRET_KEY: 'test-secret-key',
    EXPIRE_ACCESS_TOKEN: 900, // 15 minutes — stateless JWT
    EXPIRE_REFRESH_TOKEN: 8640000,
  },
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
      deleteRefreshToken: jest.fn(),
      deleteAllUserTokens: jest.fn(),
      isRefreshTokenValid: jest.fn(),
      rotateRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
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
      mockAuthRepository.createRefreshToken.mockResolvedValue({} as any)

      const result = await authService.register(
        { email: 'test@example.com', password: 'password123' },
        tokenConfig,
      )

      expect(mockUserRepository.emailExists).toHaveBeenCalledWith('test@example.com')
      expect(hashValue).toHaveBeenCalledWith('password123')
      expect(mockAuthRepository.createRefreshToken).toHaveBeenCalled()
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
      mockAuthRepository.createRefreshToken.mockResolvedValue({} as any)

      const result = await authService.login(
        { email: 'test@example.com', password: 'password123' },
        tokenConfig,
      )

      expect(mockAuthRepository.createRefreshToken).toHaveBeenCalled()
      expect(result.access_token).toContain('Bearer')
      expect(result.user.email).toBe('test@example.com')
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
})
