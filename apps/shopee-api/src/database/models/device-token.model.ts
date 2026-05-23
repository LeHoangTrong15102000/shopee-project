/**
 * DeviceToken Mongoose model.
 *
 * Stores FCM device tokens for push notification delivery.
 * Each token is unique — upsert on registration to avoid duplicates.
 */
import mongoose, { Schema } from 'mongoose'

export const DEVICE_PLATFORM = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
} as const

export type DevicePlatform = (typeof DEVICE_PLATFORM)[keyof typeof DEVICE_PLATFORM]

export interface IDeviceToken {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  token: string
  platform: DevicePlatform
  deviceName?: string
  createdAt: Date
  lastUsed: Date
}

const DeviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    platform: {
      type: String,
      enum: Object.values(DEVICE_PLATFORM),
      required: true,
    },
    deviceName: {
      type: String,
      maxlength: 200,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

DeviceTokenSchema.index({ userId: 1, token: 1 })

export const DeviceTokenModel = mongoose.model<IDeviceToken>('device_tokens', DeviceTokenSchema)
