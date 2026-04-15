import mongoose, { Schema } from 'mongoose'

export const CHAT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const

export type ChatStatusType = (typeof CHAT_STATUS)[keyof typeof CHAT_STATUS]

export interface IChatParticipant {
  user: mongoose.Types.ObjectId
  joined_at: Date
  last_read_at?: Date
}

export interface IChat {
  _id: mongoose.Types.ObjectId
  participants: IChatParticipant[]
  last_message?: {
    content: string
    sender: mongoose.Types.ObjectId
    sent_at: Date
  }
  status: ChatStatusType
  createdAt: Date
  updatedAt: Date
}

const ChatParticipantSchema = new Schema<IChatParticipant>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
    },
    joined_at: {
      type: Date,
      default: Date.now,
    },
    last_read_at: {
      type: Date,
    },
  },
  { _id: false },
)

const ChatSchema = new Schema<IChat>(
  {
    participants: {
      type: [ChatParticipantSchema],
      required: true,
      validate: {
        validator: function (participants: IChatParticipant[]) {
          return participants.length >= 2
        },
        message: 'Chat phải có ít nhất 2 người tham gia',
      },
    },
    last_message: {
      content: { type: String, maxlength: 500 },
      sender: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
      sent_at: { type: Date },
    },
    status: {
      type: String,
      enum: Object.values(CHAT_STATUS),
      default: CHAT_STATUS.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
ChatSchema.index({ 'participants.user': 1, updatedAt: -1 })
ChatSchema.index({ 'participants.user': 1, status: 1 })

export const ChatModel = mongoose.model<IChat>('chats', ChatSchema)
