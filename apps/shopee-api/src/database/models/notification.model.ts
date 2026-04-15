import mongoose, { Schema } from 'mongoose'

export const NOTIFICATION_TYPE = {
  ORDER: 'order',
  PROMOTION: 'promotion',
  SYSTEM: 'system',
  OTHER: 'other',
} as const

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]

export interface INotification {
  _id: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  title: string
  content: string
  type: NotificationType
  is_read: boolean
  link?: string
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      default: NOTIFICATION_TYPE.OTHER,
      index: true,
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
)

NotificationSchema.index({ user: 1, createdAt: -1 })
NotificationSchema.index({ user: 1, is_read: 1 })

export const NotificationModel = mongoose.model<INotification>('notifications', NotificationSchema)
