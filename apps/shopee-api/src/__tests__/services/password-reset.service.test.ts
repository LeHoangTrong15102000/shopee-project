/// <reference types="jest" />
import { PasswordResetService } from '@services/password-reset.service'
import { BusinessError } from '@services/base.service'

jest.mock('@database/models/password-reset.model', () => ({
  PasswordResetModel: {
    deleteMany: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
    findOne: jest.fn(),
    deleteOne: jest.fn().mockResolvedValue({}),
  },
}))

jest.mock('@utils/crypt', () => ({
  hashValue: jest.fn().mockReturnValue('hashed_password'),
  generateSecureToken: jest.fn().mockReturnValue('mock_token_123'),
}))

import { PasswordResetModel } from '@database/models/password-reset.model'

describe('PasswordResetService', () => {
  let service: PasswordResetService
  let mockUserRepo: any
  let mockAuthRepo: any

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()

    mockUserRepo = {
      findByEmail: jest.fn(),
      updatePassword: jest.fn(),
    }

    mockAuthRepo = {
      deleteAllUserTokens: jest.fn(),
    }

    service = new PasswordResetService(mockUserRepo, mockAuthRepo)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('forgotPassword', () => {
    it('should create token and return success message when user exists', async () => {
      const email = 'user@example.com'
      mockUserRepo.findByEmail.mockResolvedValue({ _id: 'user123', email })

      const result = await service.forgotPassword(email)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(email)
      expect(PasswordResetModel.deleteMany).toHaveBeenCalledWith({ email })
      expect(PasswordResetModel.create).toHaveBeenCalledWith({
        email,
        token: 'mock_token_123',
        expires_at: expect.any(Date),
      })
      expect(result).toEqual({ message: 'Vui lòng kiểm tra email để đặt lại mật khẩu' })
    })

    it('should return success message when user not found (security)', async () => {
      const email = 'nonexistent@example.com'
      mockUserRepo.findByEmail.mockResolvedValue(null)

      const result = await service.forgotPassword(email)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(email)
      expect(PasswordResetModel.deleteMany).not.toHaveBeenCalled()
      expect(PasswordResetModel.create).not.toHaveBeenCalled()
      expect(result).toEqual({ message: 'Vui lòng kiểm tra email để đặt lại mật khẩu' })
    })
  })

  describe('resetPassword', () => {
    it('should update password and delete tokens when valid token', async () => {
      const token = 'valid_token'
      const newPassword = 'newPassword123'
      const resetRecord = {
        _id: 'reset123',
        email: 'user@example.com',
        token,
        expires_at: new Date(Date.now() + 3600000),
      }
      const user = { _id: 'user123', email: 'user@example.com' }

      ;(PasswordResetModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(resetRecord),
      })
      mockUserRepo.findByEmail.mockResolvedValue(user)

      const result = await service.resetPassword(token, newPassword)

      expect(PasswordResetModel.findOne).toHaveBeenCalledWith({ token })
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(resetRecord.email)
      expect(mockUserRepo.updatePassword).toHaveBeenCalledWith('user123', 'hashed_password')
      expect(PasswordResetModel.deleteMany).toHaveBeenCalledWith({ email: resetRecord.email })
      expect(mockAuthRepo.deleteAllUserTokens).toHaveBeenCalledWith('user123')
      expect(result).toEqual({ message: 'Đặt lại mật khẩu thành công' })
    })

    it('should throw BusinessError when token not found', async () => {
      ;(PasswordResetModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })

      await expect(service.resetPassword('invalid_token', 'newPassword123')).rejects.toThrow(
        new BusinessError('Token không hợp lệ'),
      )
    })

    it('should throw BusinessError when token is expired', async () => {
      const token = 'expired_token'
      const resetRecord = {
        _id: 'reset123',
        email: 'user@example.com',
        token,
        expires_at: new Date(Date.now() - 1000),
      }

      ;(PasswordResetModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(resetRecord),
      })

      await expect(service.resetPassword(token, 'newPassword123')).rejects.toThrow(
        new BusinessError('Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới'),
      )
      expect(PasswordResetModel.deleteOne).toHaveBeenCalledWith({ _id: resetRecord._id })
    })

    it('should throw BusinessError when user not found for token email', async () => {
      const token = 'valid_token'
      const resetRecord = {
        _id: 'reset123',
        email: 'user@example.com',
        token,
        expires_at: new Date(Date.now() + 3600000),
      }

      ;(PasswordResetModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(resetRecord),
      })
      mockUserRepo.findByEmail.mockResolvedValue(null)

      await expect(service.resetPassword(token, 'newPassword123')).rejects.toThrow(
        new BusinessError('Token không hợp lệ'),
      )
    })
  })
})
