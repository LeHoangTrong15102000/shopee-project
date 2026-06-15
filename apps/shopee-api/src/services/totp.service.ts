import crypto from 'crypto'
import { authenticator } from 'otplib'
import qrcode from 'qrcode'
import { UserModel } from '@database/models/user.model'
import { BaseService, UnauthorizedError, ValidationError, NotFoundError } from './base.service'
import {
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
} from '@utils/totp.util'
import { signToken, verifyToken } from '@utils/jwt'
import { config } from '@constants/config'
import { IPayloadToken } from '../@types/models.type'
import { Logger } from '@utils/logger'

// Allow ±30s clock skew between client device and server (RFC 6238 best practice).
// window=1 means the server accepts codes from the previous, current, and next 30s step.
authenticator.options = { window: 1 }

/** Partial token payload — returned when 2FA is required */
export interface PartialTokenPayload {
  id: string
  email: string
  roles: string[]
  created_at: string
  jti?: string
  scope: '2fa_pending'
}

export interface TwoFactorSetupResult {
  secret: string
  qrCodeDataUrl: string
  backupCodes: string[]
}

export class TotpService extends BaseService {
  /**
   * Begin 2FA setup: generate a TOTP secret, store it encrypted (but NOT yet enabled),
   * and return the QR code data URL and plaintext backup codes for the user to save.
   */
  async setupTwoFactor(userId: string): Promise<TwoFactorSetupResult> {
    const user = await UserModel.findById(userId).lean()
    if (!user) throw new NotFoundError('User', userId)

    const secret = authenticator.generateSecret()
    const encryptedSecret = encryptSecret(secret)

    const plainBackupCodes = generateBackupCodes()
    const hashedBackupCodes = hashBackupCodes(plainBackupCodes)

    // Store encrypted secret and hashed backup codes, but keep twoFactorEnabled=false
    // until the user verifies with a valid TOTP code (verifySetup)
    await UserModel.findByIdAndUpdate(userId, {
      $set: {
        twoFactorSecret: encryptedSecret,
        twoFactorEnabled: false,
        backupCodes: hashedBackupCodes,
      },
    })

    const otpAuthUrl = authenticator.keyuri(user.email, 'ShopeeClone', secret)
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl)

    Logger.apiInfo('totp.setup.initiated', { userId })

    return {
      secret,
      qrCodeDataUrl,
      backupCodes: plainBackupCodes,
    }
  }

  /**
   * Verify a TOTP code during setup and enable 2FA if valid.
   */
  async verifySetup(userId: string, code: string): Promise<void> {
    const user = await UserModel.findById(userId).lean()
    if (!user) throw new NotFoundError('User', userId)

    if (!user.twoFactorSecret) {
      throw new ValidationError('2FA setup not initiated — call /auth/2fa/setup first')
    }

    const secret = decryptSecret(user.twoFactorSecret)
    const trimmedCode = code.trim()
    const isValid = authenticator.verify({ token: trimmedCode, secret })

    if (!isValid) {
      throw new ValidationError('Invalid TOTP code')
    }

    await UserModel.findByIdAndUpdate(userId, {
      $set: { twoFactorEnabled: true },
    })

    Logger.apiInfo('totp.setup.verified', { userId })
  }

  /**
   * Disable 2FA after verifying a TOTP code (or backup code).
   */
  async disableTwoFactor(userId: string, code: string): Promise<void> {
    const user = await UserModel.findById(userId).lean()
    if (!user) throw new NotFoundError('User', userId)

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new ValidationError('2FA is not enabled')
    }

    const secret = decryptSecret(user.twoFactorSecret)
    const trimmedCode = code.trim()
    const isTotpValid = authenticator.verify({ token: trimmedCode, secret })

    if (!isTotpValid) {
      // Try backup code
      const backupResult = verifyBackupCode(trimmedCode, user.backupCodes || [])
      if (!backupResult.matched) {
        throw new ValidationError('Invalid TOTP code or backup code')
      }
    }

    await UserModel.findByIdAndUpdate(userId, {
      $set: {
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        backupCodes: [],
      },
      $unset: { twoFactorSecret: 1 },
    })

    Logger.apiInfo('totp.disabled', { userId })
  }

  /**
   * Regenerate backup codes after verifying a valid TOTP code.
   * Returns the new plaintext backup codes for the user to save.
   */
  async regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
    const user = await UserModel.findById(userId).lean()
    if (!user) throw new NotFoundError('User', userId)

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new ValidationError('2FA is not enabled')
    }

    const secret = decryptSecret(user.twoFactorSecret)
    const trimmedCode = code.trim()
    const isValid = authenticator.verify({ token: trimmedCode, secret })

    if (!isValid) {
      throw new ValidationError('Invalid TOTP code')
    }

    const plainBackupCodes = generateBackupCodes()
    const hashedBackupCodes = hashBackupCodes(plainBackupCodes)

    await UserModel.findByIdAndUpdate(userId, {
      $set: { backupCodes: hashedBackupCodes },
    })

    Logger.apiInfo('totp.backup_codes.regenerated', { userId })

    return plainBackupCodes
  }

  /**
   * Complete the 2FA login flow:
   * 1. Verify the partial token (scope: "2fa_pending")
   * 2. Verify the TOTP code or backup code
   * 3. Issue full access + refresh tokens
   *
   * Returns the full auth result including tokens.
   * The caller (controller) is responsible for creating the session and login history record.
   */
  async completeTwoFactorLogin(
    partialToken: string,
    code: string,
  ): Promise<{
    userId: string
    email: string
    roles: string[]
    accessJti: string
    refreshJti: string
    accessToken: string
    refreshToken: string
    usedBackupCode: boolean
  }> {
    // Verify partial token
    let decoded: PartialTokenPayload
    try {
      decoded = (await verifyToken(partialToken, config.SECRET_KEY)) as PartialTokenPayload
    } catch {
      throw new UnauthorizedError('Invalid or expired partial token')
    }

    if (decoded.scope !== '2fa_pending') {
      throw new UnauthorizedError('Token is not a 2FA partial token')
    }

    const user = await UserModel.findById(decoded.id).lean()
    if (!user) throw new NotFoundError('User', decoded.id)

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new ValidationError('2FA is not enabled for this user')
    }

    const secret = decryptSecret(user.twoFactorSecret)
    const trimmedCode = code.trim()
    const isTotpValid = authenticator.verify({ token: trimmedCode, secret })

    let usedBackupCode = false

    if (!isTotpValid) {
      // Try backup code
      const backupResult = verifyBackupCode(trimmedCode, user.backupCodes || [])
      if (!backupResult.matched) {
        throw new ValidationError('Invalid TOTP code or backup code')
      }

      // Remove the used backup code (single-use)
      const updatedCodes = [...(user.backupCodes || [])]
      updatedCodes.splice(backupResult.index, 1)
      await UserModel.findByIdAndUpdate(decoded.id, {
        $set: { backupCodes: updatedCodes },
      })

      usedBackupCode = true
    }

    // Generate full tokens
    const accessJti = crypto.randomUUID()
    const refreshJti = crypto.randomUUID()

    const payload: IPayloadToken = {
      id: user._id!.toString(),
      email: user.email,
      roles: user.roles || [],
      created_at: new Date().toISOString(),
      jti: accessJti,
    }

    const refreshPayload: IPayloadToken = {
      ...payload,
      jti: refreshJti,
    }

    const [accessToken, refreshToken] = await Promise.all([
      signToken(payload, config.SECRET_KEY, config.EXPIRE_ACCESS_TOKEN) as Promise<string>,
      signToken(refreshPayload, config.SECRET_KEY, config.EXPIRE_REFRESH_TOKEN) as Promise<string>,
    ])

    Logger.apiInfo('totp.login.completed', { userId: decoded.id, usedBackupCode })

    return {
      userId: user._id!.toString(),
      email: user.email,
      roles: user.roles || [],
      accessJti,
      refreshJti,
      accessToken,
      refreshToken,
      usedBackupCode,
    }
  }
}
