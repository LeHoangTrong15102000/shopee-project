/**
 * Unit Tests for SessionService
 * Covers revokeAllSessionsIncludingCurrent (Task 6.4)
 */

/// <reference types="jest" />
import { SessionService } from '@services/session.service'
import { Types } from 'mongoose'

// Mock RefreshTokenModel used directly inside SessionService
jest.mock('@database/models/refresh-token.model', () => ({
  RefreshTokenModel: {
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    findOneAndDelete: jest.fn().mockResolvedValue(null),
  },
}))

// Mock geo/ua utils to avoid heavy dependencies in unit tests
jest.mock('@utils/session.util', () => ({
  hashJti: jest.fn((jti: string) => 'hashed_' + jti),
  parseUserAgent: jest.fn(() => ({ browser: 'Chrome', os: 'Windows', device: 'desktop' })),
}))

jest.mock('@utils/geoip.util', () => ({
  getLocation: jest.fn(() => null),
  formatLocation: jest.fn(() => 'Unknown'),
}))

import { RefreshTokenModel } from '@database/models/refresh-token.model'
import { ISessionRepository } from '@repositories/interfaces/session.repository.interface'

describe('SessionService', () => {
  let service: SessionService
  let mockSessionRepo: jest.Mocked<ISessionRepository>

  const userId = new Types.ObjectId().toString()

  const makeSession = (accessJti: string, refreshJti: string) => ({
    _id: new Types.ObjectId(),
    user_id: new Types.ObjectId(userId),
    accessJti,
    refreshJti,
    refreshTokenHash: 'hash_' + refreshJti,
    device: 'Chrome on Windows',
    ip: '127.0.0.1',
    location: 'Unknown',
    lastActive: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    isRevoked: false,
  })

  beforeEach(() => {
    jest.clearAllMocks()

    mockSessionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUserId: jest.fn(),
      findByUserId: jest.fn(),
      findActiveByUserIdPaginated: jest.fn(),
      updateByRefreshTokenHash: jest.fn(),
      revokeById: jest.fn(),
      revokeManyByIds: jest.fn().mockResolvedValue(undefined),
      deleteExpired: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findPaginated: jest.fn(),
      updateMany: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<ISessionRepository>

    service = new SessionService(mockSessionRepo)
  })

  describe('revokeAllSessionsIncludingCurrent', () => {
    it('6.4 — revokes ALL sessions including the current one and deletes refresh tokens by jti', async () => {
      const sessionA = makeSession('access_jti_A', 'refresh_jti_A')
      const sessionB = makeSession('access_jti_B', 'refresh_jti_B') // current session

      mockSessionRepo.findByUserId.mockResolvedValue([sessionA, sessionB] as any)

      const count = await service.revokeAllSessionsIncludingCurrent(userId)

      expect(count).toBe(2)
      // All sessions revoked (both IDs)
      expect(mockSessionRepo.revokeManyByIds).toHaveBeenCalledWith(
        expect.arrayContaining([sessionA._id, sessionB._id]),
      )
      // Refresh tokens deleted by jti (includes current session's jti)
      expect(RefreshTokenModel.deleteMany).toHaveBeenCalledWith({
        jti: { $in: ['refresh_jti_A', 'refresh_jti_B'] },
      })
    })

    it('6.4 — returns 0 and still cleans orphaned refresh tokens when no active sessions', async () => {
      mockSessionRepo.findByUserId.mockResolvedValue([])

      const count = await service.revokeAllSessionsIncludingCurrent(userId)

      expect(count).toBe(0)
      expect(mockSessionRepo.revokeManyByIds).not.toHaveBeenCalled()
      // Deletes orphaned tokens by user field variants
      expect(RefreshTokenModel.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ $or: expect.any(Array) }),
      )
    })

    it('6.4 — does not spare the current session (contrast with revokeAllSessions)', async () => {
      const currentSession = makeSession('current_access_jti', 'current_refresh_jti')

      mockSessionRepo.findByUserId.mockResolvedValue([currentSession] as any)

      const count = await service.revokeAllSessionsIncludingCurrent(userId)

      expect(count).toBe(1)
      expect(mockSessionRepo.revokeManyByIds).toHaveBeenCalledWith([currentSession._id])
      expect(RefreshTokenModel.deleteMany).toHaveBeenCalledWith({
        jti: { $in: ['current_refresh_jti'] },
      })
    })
  })

  describe('revokeAllSessions (regression — still spares current)', () => {
    it('2.2 — spares the session whose accessJti matches currentAccessJti', async () => {
      const currentSession = makeSession('current_access_jti', 'current_refresh_jti')
      const otherSession = makeSession('other_access_jti', 'other_refresh_jti')

      mockSessionRepo.findByUserId.mockResolvedValue([currentSession, otherSession] as any)

      const count = await service.revokeAllSessions(userId, 'current_access_jti')

      expect(count).toBe(1)
      // Only the other session is revoked
      expect(mockSessionRepo.revokeManyByIds).toHaveBeenCalledWith([otherSession._id])
      expect(RefreshTokenModel.deleteMany).toHaveBeenCalledWith({
        jti: { $in: ['other_refresh_jti'] },
      })
    })
  })
})
