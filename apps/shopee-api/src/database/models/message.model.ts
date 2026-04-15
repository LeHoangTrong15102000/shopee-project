import mongoose, { Schema } from 'mongoose'

export const MESSAGE_TYPE = {
  TEXT: 'text',
} as const

export type MessageTypeType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE]

export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const

export type MessageStatusType = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS]

export interface IMessage {
  _id: mongoose.Types.ObjectId
  chat: mongoose.Types.ObjectId
  sender: mongoose.Types.ObjectId
  content: string
  message_type: MessageTypeType
  status: MessageStatusType
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    chat: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'chats',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    message_type: {
      type: String,
      enum: Object.values(MESSAGE_TYPE),
      default: MESSAGE_TYPE.TEXT,
    },
    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      default: MESSAGE_STATUS.SENT,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient queries
MessageSchema.index({ chat: 1, createdAt: -1 })
MessageSchema.index({ chat: 1, sender: 1 })

export const MessageModel = mongoose.model<IMessage>('messages', MessageSchema)
