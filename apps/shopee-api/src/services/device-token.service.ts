/**
 * DeviceTokenService — manages device token registration and unregistration.
 */
import { DeviceTokenRepository } from '@repositories/device-token.repository'
import { IDeviceToken, DevicePlatform } from '@database/models/device-token.model'
import { BaseService, ValidationError, ForbiddenError } from './base.service'

export interface RegisterTokenDTO {
  token: string
  platform: DevicePlatform
  deviceName?: string
}

export class DeviceTokenService extends BaseService {
  constructor(private readonly deviceTokenRepository: DeviceTokenRepository) {
    super()
  }

  /**
   * Register (upsert) a device token for a user.
   */
  async registerToken(userId: string, dto: RegisterTokenDTO): Promise<IDeviceToken> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    if (!dto.token || dto.token.trim().length === 0) {
      throw new ValidationError('Device token is required')
    }

    return this.deviceTokenRepository.upsertToken(
      userId,
      dto.token.trim(),
      dto.platform,
      dto.deviceName,
    )
  }

  /**
   * Unregister a device token by ID.
   * Throws 403 if the token does not belong to the requesting user.
   */
  async unregisterToken(userId: string, tokenId: string): Promise<IDeviceToken> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    if (!this.isValidObjectId(tokenId)) {
      throw new ValidationError('Invalid token ID format')
    }

    const deleted = await this.deviceTokenRepository.deleteById(tokenId, userId)

    if (!deleted) {
      // Either not found or not owned by this user — return 403 to avoid leaking existence
      throw new ForbiddenError('Device token not found or access denied')
    }

    return deleted
  }
}
