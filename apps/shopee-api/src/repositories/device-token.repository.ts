/**
 * DeviceTokenRepository — manages FCM device tokens in MongoDB.
 */
import mongoose from 'mongoose'
import { DeviceTokenModel, IDeviceToken, DevicePlatform } from '@database/models/device-token.model'
import { Logger } from '@utils/logger'

export class DeviceTokenRepository {
  /**
   * Upsert a device token for a user.
   * If the token already exists, update its userId, platform, deviceName, and lastUsed.
   * If it doesn't exist, create a new document.
   */
  async upsertToken(
    userId: string,
    token: string,
    platform: DevicePlatform,
    deviceName?: string,
  ): Promise<IDeviceToken> {
    const doc = await DeviceTokenModel.findOneAndUpdate(
      { token },
      {
        $set: {
          userId: new mongoose.Types.ObjectId(userId),
          platform,
          deviceName,
          lastUsed: new Date(),
        },
      },
      { upsert: true, new: true },
    )
    return doc!
  }

  /**
   * Find all device tokens for a user.
   */
  async findByUserId(userId: string): Promise<IDeviceToken[]> {
    return DeviceTokenModel.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean()
  }

  /**
   * Delete a device token by ID with ownership check.
   * Returns null if not found or not owned by the user.
   */
  async deleteById(id: string, userId: string): Promise<IDeviceToken | null> {
    return DeviceTokenModel.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    })
  }

  /**
   * Delete a device token by its FCM token string.
   * Used to remove stale/invalid tokens returned by FCM.
   */
  async deleteByToken(token: string): Promise<void> {
    try {
      await DeviceTokenModel.deleteOne({ token })
    } catch (err: any) {
      Logger.apiError('[DeviceTokenRepository] Failed to delete token', {
        error: err?.message,
      })
    }
  }
}
