/// <reference types="jest" />

/**
 * Unit Tests for TotpService
 * Tests: setup flow, verify-setup (valid/invalid code), disable flow, backup code regeneration
 */

// Mock UserModel before importing TotpService
jest.mock('@database/models/user.model', () => ({
  UserModel: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}))

jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn().mockReturnValue('MOCKSECRET123456'),
    keyuri: jest
      .fn()
      .mockReturnValue('otpauth://totp/ShopeeClone:test@example.com?secret=MOCKSECRET'),
    verify: jest.fn(),
  },
}))

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqrcode'),
}))

jest.mock('@utils/totp.util', () => ({
  encryptSecret: jest.fn((s) => `encrypted_${s}`),
  decryptSecret: jest.fn((s) => s.replace('encrypted_', '')),
  generateBackupCodes: jest.fn().mockReturnValue(['CODE0001', 'CODE0002', 'CODE0003']),
  hashBackupCodes: jest.fn((codes) => codes.map((c) => `hashed_${c}`)),
  verifyBackupCode: jest.fn(),
}))

jest.mock('@utils/jwt', () => ({
  signToken: jest.fn().mockResolvedValue('mock_token'),
  verifyToken: jest.fn(),
}))

jest.mock('@constants/config', () => ({
  config: {
    SECRET_KEY: 'test-secret-key-that-is-at-least-32-chars',
    EXPIRE_ACCESS_TOKEN: 900,
    EXPIRE_REFRESH_TOKEN: 2592000,
    TWO_FACTOR_ENCRYPTION_KEY: '0'.repeat(64),
  },
}))

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiWarn: jest.fn(),
    apiError: jest.fn(),
  },
}))

import { TotpService } from '@services/totp.service'
import { UserModel } from '@database/models/user.model'
import { authenticator } from 'otplib'
import { verifyToken } from '@utils/jwt'
import { verifyBackupCode, generateBackupCodes, hashBackupCodes } from '@utils/totp.util'
import { Types } from 'mongoose'
import { ValidationError, UnauthorizedError, NotFoundError } from '@services/base.service'

const mockUserId = new Types.ObjectId().toString()

const makeMockUser = (overrides: Record<string, unknown> = {}) => ({
  _id: new Types.ObjectId(mockUserId),
  email: 'test@example.com',
  roles: ['User'],
  twoFactorEnabled: false,
  twoFactorSecret: null,
  backupCodes: [],
  ...overrides,
})

describe('TotpService', () => {
  let service: TotpService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TotpService()
  })

  // ─── setupTwoFactor ───────────────────────────────────────────────────────

  describe('setupTwoFactor', () => {
    it('returns secret, qrCodeDataUrl, and backupCodes on success', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(makeMockUser()),
      })
      ;(UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      const result = await service.setupTwoFactor(mockUserId)

      expect(result.secret).toBe('MOCKSECRET123456')
      expect(result.qrCodeDataUrl).toBe('data:image/png;base64,mockqrcode')
      expect(result.backupCodes).toEqual(['CODE0001', 'CODE0002', 'CODE0003'])
    })

    it('stores encrypted secret and hashed backup codes with twoFactorEnabled=false', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(makeMockUser()),
      })
      ;(UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      await service.setupTwoFactor(mockUserId)

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          $set: expect.objectContaining({
            twoFactorEnabled: false,
            twoFactorSecret: 'encrypted_MOCKSECRET123456',
            backupCodes: ['hashed_CODE0001', 'hashed_CODE0002', 'hashed_CODE0003'],
          }),
        }),
      )
    })

    it('throws NotFoundError when user does not exist', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })

      await expect(service.setupTwoFactor(mockUserId)).rejects.toThrow(NotFoundError)
    })
  })

  // ─── verifySetup ─────────────────────────────────────────────────────────

  describe('verifySetup', () => {
    it('enables 2FA when TOTP code is valid', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValue(makeMockUser({ twoFactorSecret: 'encrypted_MOCKSECRET123456' })),
      })
      ;(authenticator.verify as jest.Mock).mockReturnValue(true)
      ;(UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      await service.verifySetup(mockUserId, '123456')

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          $set: { twoFactorEnabled: true },
        }),
      )
    })

    it('throws ValidationError when TOTP code is invalid', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest
          .fn()
          .mockResolvedValue(makeMockUser({ twoFactorSecret: 'encrypted_MOCKSECRET123456' })),
      })
      ;(authenticator.verify as jest.Mock).mockReturnValue(false)

      await expect(service.verifySetup(mockUserId, '000000')).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when 2FA setup was not initiated (no secret)', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(makeMockUser({ twoFactorSecret: null })),
      })

      await expect(service.verifySetup(mockUserId, '123456')).rejects.toThrow(ValidationError)
    })

    it('throws NotFoundError when user does not exist', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })

      await expect(service.verifySetup(mockUserId, '123456')).rejects.toThrow(NotFoundError)
    })

    it('configures otplib with window=1 for clock skew tolerance', () => {
      // The service module sets authenticator.options = { window: 1 } at module load time.
      // Because otplib is mocked with a plain object, the assignment lands directly on the
      // mock instance — the same object imported here as `authenticator`.
      expect((authenticator as unknown as { options: { window: number } }).options).toEqual(
        expect.objectContaining({ window: 1 }),
      )
    })
  })

  // ─── disableTwoFactor ─────────────────────────────────────────────────────

  describe('disableTwoFactor', () => {
    const enabledUser = makeMockUser({
      twoFactorEnabled: true,
      twoFactorSecret: 'encrypted_MOCKSECRET123456',
      backupCodes: ['hashed_CODE0001'],
    })

    it('disables 2FA when TOTP code is valid', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(enabledUser),
      })
      ;(authenticator.verify as jest.Mock).mockReturnValue(true)
      ;(UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      await service.disableTwoFactor(mockUserId, '123456')

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          $set: expect.objectContaining({
            twoFactorEnabled: false,
            backupCodes: [],
          }),
        }),
      )
    })

    it('disables 2FA when backup code is valid (TOTP fails)', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(enabledUser),
      })
      ;(authenticator.verify as jest.Mock).mockReturnValue(false)
      ;(verifyBackupCode as jest.Mock).mockReturnValue({ matched: true, index: 0 })
      ;(UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      await service.disableTwoFactor(mockUserId, 'CODE0001')

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalled()
    })

    it('throws ValidationError when both TOTP and backup code are invalid', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(enabledUser),
      })
      ;(authenticator.verify as jest.Mock).mockReturnValue(false)
      ;(verifyBackupCode as jest.Mock).mockReturnValue({ matched: false, index: -1 })

      await expect(service.disableTwoFactor(mockUserId, 'BADCODE')).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when 2FA is not enabled', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(makeMockUser({ twoFactorEnabled: false })),
      })

      await expect(service.disableTwoFactor(mockUserId, '123456')).rejects.toThrow(ValidationError)
    })
  })

  // ─── regenerateBackupCodes ────────────────────────────────────────────────

  describe('regenerateBackupCodes', () => {
    const enabledUser = makeMockUser({
      twoFactorEnabled: true,
      twoFactorSecret: 'encrypted_MOCKSECRET123456',
      backupCodes: ['hashed_OLD0001'],
    })

    it('returns new plaintext backup codes when TOTP code is valid', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(enabledUser),
      })
      ;(authenticator.verify as jest.Mock).mockReturnValue(true)
      ;(generateBackupCodes as jest.Mock).mockReturnValue(['NEW00001', 'NEW00002'])
      ;(hashBackupCodes as jest.Mock).mockReturnValue(['hashed_NEW00001', 'hashed_NEW00002'])
      ;(UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      const result = await service.regenerateBackupCodes(mockUserId, '123456')

      expect(result).toEqual(['NEW00001', 'NEW00002'])
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          $set: { backupCodes: ['hashed_NEW00001', 'hashed_NEW00002'] },
        }),
      )
    })

    it('throws ValidationError when TOTP code is invalid', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(enabledUser),
      })
      ;(authenticator.verify as jest.Mock).mockReturnValue(false)

      await expect(service.regenerateBackupCodes(mockUserId, '000000')).rejects.toThrow(
        ValidationError,
      )
    })

    it('throws ValidationError when 2FA is not enabled', async () => {
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(makeMockUser({ twoFactorEnabled: false })),
      })

      await expect(service.regenerateBackupCodes(mockUserId, '123456')).rejects.toThrow(
        ValidationError,
      )
    })
  })

  // ─── completeTwoFactorLogin ───────────────────────────────────────────────

  describe('completeTwoFactorLogin', () => {
    const enabledUser = makeMockUser({
      twoFactorEnabled: true,
      twoFactorSecret: 'encrypted_MOCKSECRET123456',
      backupCodes: ['hashed_CODE0001', 'hashed_CODE0002'],
    })

    const partialPayload = {
      id: mockUserId,
      email: 'test@example.com',
      roles: ['User'],
      created_at: new Date().toISOString(),
      scope: '2fa_pending' as const,
    }

    it('issues full tokens when TOTP code is valid', async () => {
      ;(verifyToken as jest.Mock).mockResolvedValue(partialPayload)
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(enabledUser),
      })
      ;(authenticator.verify as jest.Mock).mockReturnValue(true)

      const result = await service.completeTwoFactorLogin('partial_token', '123456')

      expect(result.userId).toBe(mockUserId)
      expect(result.email).toBe('test@example.com')
      expect(result.accessToken).toBe('mock_token')
      expect(result.refreshToken).toBe('mock_token')
      expect(result.usedBackupCode).toBe(false)
      expect(result.accessJti).toBeDefined()
      expect(result.refreshJti).toBeDefined()
    })

    it('issues full tokens and removes backup code when backup code is used', async () => {
      ;(verifyToken as jest.Mock).mockResolvedValue(partialPayload)
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(enabledUser),
      })
      ;(authenticator.verify as jest.Mock).mockReturnValue(false)
      ;(verifyBackupCode as jest.Mock).mockReturnValue({ matched: true, index: 0 })
      ;(UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      const result = await service.completeTwoFactorLogin('partial_token', 'CODE0001')

      expect(result.usedBackupCode).toBe(true)
      // Backup code at index 0 should be removed
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          $set: { backupCodes: ['hashed_CODE0002'] },
        }),
      )
    })

    it('throws UnauthorizedError when partial token is invalid', async () => {
      ;(verifyToken as jest.Mock).mockRejectedValue(new Error('jwt expired'))

      await expect(service.completeTwoFactorLogin('bad_token', '123456')).rejects.toThrow(
        UnauthorizedError,
      )
    })

    it('throws UnauthorizedError when token scope is not 2fa_pending', async () => {
      ;(verifyToken as jest.Mock).mockResolvedValue({
        ...partialPayload,
        scope: undefined,
      })

      await expect(service.completeTwoFactorLogin('full_token', '123456')).rejects.toThrow(
        UnauthorizedError,
      )
    })

    it('throws ValidationError when both TOTP and backup code are invalid', async () => {
      ;(verifyToken as jest.Mock).mockResolvedValue(partialPayload)
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(enabledUser),
      })
      ;(authenticator.verify as jest.Mock).mockReturnValue(false)
      ;(verifyBackupCode as jest.Mock).mockReturnValue({ matched: false, index: -1 })

      await expect(service.completeTwoFactorLogin('partial_token', 'BADCODE')).rejects.toThrow(
        ValidationError,
      )
    })

    it('throws NotFoundError when user does not exist', async () => {
      ;(verifyToken as jest.Mock).mockResolvedValue(partialPayload)
      ;(UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })

      await expect(service.completeTwoFactorLogin('partial_token', '123456')).rejects.toThrow(
        NotFoundError,
      )
    })
  })
})
