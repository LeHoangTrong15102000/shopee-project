/// <reference types="jest" />

const mockRefreshTokenData = {
  _id: '507f1f77bcf86cd799439013',
  user_id: '507f1f77bcf86cd799439012',
  token: 'refresh-token-123',
  expiresAt: new Date(Date.now() + 86400000),
  toObject: () => mockRefreshTokenData,
}

jest.mock('@database/models/refresh-token.model', () => {
  const mockModel: any = jest.fn()
  mockModel.findOne = jest.fn()
  mockModel.deleteOne = jest.fn()
  mockModel.deleteMany = jest.fn()
  return { RefreshTokenModel: mockModel }
})

import { RefreshTokenModel } from '@database/models/refresh-token.model'
import { AuthRepository } from '../../repositories/auth.repository'

describe('AuthRepository', () => {
  let repository: AuthRepository

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup constructor mocks for create operations
    ;(RefreshTokenModel as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ toObject: () => mockRefreshTokenData }),
    }))
    repository = new AuthRepository()
  })

  describe('createRefreshToken', () => {
    it('should create a new refresh token', async () => {
      const result = await repository.createRefreshToken('507f1f77bcf86cd799439012', 'new-refresh-token')
      expect(result).toEqual(mockRefreshTokenData)
    })
  })

  describe('findRefreshToken', () => {
    it('should find refresh token by token string', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockRefreshTokenData)
      ;(RefreshTokenModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findRefreshToken('refresh-token-123')

      expect(RefreshTokenModel.findOne).toHaveBeenCalledWith({ token: 'refresh-token-123' })
      expect(result).toEqual(mockRefreshTokenData)
    })

    it('should return null if token not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(RefreshTokenModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findRefreshToken('nonexistent-token')

      expect(result).toBeNull()
    })
  })

  describe('deleteRefreshToken', () => {
    it('should delete refresh token and return true', async () => {
      ;(RefreshTokenModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 })

      const result = await repository.deleteRefreshToken('refresh-token-123')

      expect(RefreshTokenModel.deleteOne).toHaveBeenCalledWith({ token: 'refresh-token-123' })
      expect(result).toBe(true)
    })

    it('should return false if token not found', async () => {
      ;(RefreshTokenModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 })

      const result = await repository.deleteRefreshToken('nonexistent-token')

      expect(result).toBe(false)
    })
  })

  describe('deleteAllUserTokens', () => {
    it('should delete all refresh tokens for a user', async () => {
      ;(RefreshTokenModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 })

      await repository.deleteAllUserTokens('507f1f77bcf86cd799439012')

      expect(RefreshTokenModel.deleteMany).toHaveBeenCalled()
    })
  })

  describe('deleteExpiredTokens', () => {
    it('should delete expired refresh tokens and return count', async () => {
      ;(RefreshTokenModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 })

      const result = await repository.deleteExpiredTokens()

      expect(RefreshTokenModel.deleteMany).toHaveBeenCalled()
      expect(result).toBe(2)
    })
  })

  describe('isRefreshTokenValid', () => {
    it('should return true for valid non-expired token', async () => {
      const validToken = { ...mockRefreshTokenData, expiresAt: new Date(Date.now() + 86400000) }
      ;(RefreshTokenModel.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(validToken) })

      const result = await repository.isRefreshTokenValid('refresh-token-123')

      expect(result).toBe(true)
    })

    it('should return false for expired token', async () => {
      const expiredToken = { ...mockRefreshTokenData, expiresAt: new Date(Date.now() - 86400000) }
      ;(RefreshTokenModel.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(expiredToken) })

      const result = await repository.isRefreshTokenValid('expired-token')

      expect(result).toBe(false)
    })

    it('should return false if token not found', async () => {
      ;(RefreshTokenModel.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(null) })

      const result = await repository.isRefreshTokenValid('nonexistent-token')

      expect(result).toBe(false)
    })
  })

  describe('rotateRefreshToken', () => {
    it('should delete old token and create new one', async () => {
      ;(RefreshTokenModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 })

      const result = await repository.rotateRefreshToken('old-token', 'new-token', '507f1f77bcf86cd799439012')

      expect(RefreshTokenModel.deleteOne).toHaveBeenCalledWith({ token: 'old-token' })
      expect(result).toEqual(mockRefreshTokenData)
    })

    it('should return null if old token not found', async () => {
      ;(RefreshTokenModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 })

      const result = await repository.rotateRefreshToken('nonexistent-token', 'new-token', '507f1f77bcf86cd799439012')

      expect(result).toBeNull()
    })
  })
})
