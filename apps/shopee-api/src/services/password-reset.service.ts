import { Queue } from 'bullmq'
import { PasswordResetModel } from '@database/models/password-reset.model'
import { BaseService, BusinessError } from './base.service'
import { hashValue } from '@utils/crypt'
import { generateSecureToken } from '@utils/crypt'
import { IUserRepository } from '@repositories/interfaces/user.repository.interface'
import { IAuthRepository } from '@repositories/interfaces/auth.repository.interface'
import { EmailJobPayload } from '../queues/job-payloads'

const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

export class PasswordResetService extends BaseService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authRepository: IAuthRepository,
    private readonly emailQueue: Queue<EmailJobPayload>,
  ) {
    super()
  }

  async forgotPassword(email: string) {
    // Always return success (don't reveal if email exists)
    const user = await this.userRepository.findByEmail(email)

    if (user) {
      // Invalidate existing tokens for this email
      await PasswordResetModel.deleteMany({ email })

      // Generate new token
      const token = generateSecureToken(32)
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)

      await PasswordResetModel.create({
        email,
        token,
        expires_at: expiresAt,
      })

      const resetUrl = `${process.env.CLIENT_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`

      await this.emailQueue.add('password-reset-email', {
        to: email,
        subject: 'Đặt lại mật khẩu Shopee',
        body: resetUrl,
        template: 'password-reset',
        data: { resetUrl },
      })
    }

    return { message: 'Vui lòng kiểm tra email để đặt lại mật khẩu' }
  }

  async resetPassword(token: string, newPassword: string) {
    // Find valid token
    const resetRecord = await PasswordResetModel.findOne({ token }).lean()

    if (!resetRecord) {
      throw new BusinessError('Token không hợp lệ')
    }

    if (new Date() > resetRecord.expires_at) {
      // Clean up expired token
      await PasswordResetModel.deleteOne({ _id: resetRecord._id })
      throw new BusinessError('Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới')
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(resetRecord.email)
    if (!user) {
      throw new BusinessError('Token không hợp lệ')
    }

    // Update password
    const hashedPassword = hashValue(newPassword)
    await this.userRepository.updatePassword(user._id!.toString(), hashedPassword)

    // Delete all reset tokens for this email
    await PasswordResetModel.deleteMany({ email: resetRecord.email })

    // Invalidate all tokens for this user (logout from all devices)
    await this.authRepository.deleteAllUserTokens(user._id!.toString())

    return { message: 'Đặt lại mật khẩu thành công' }
  }
}
