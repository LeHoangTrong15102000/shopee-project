import mongoose, { Schema } from 'mongoose'

export const MESSAGE_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
} as const

export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE]

export const CONVERSATION_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const

export type ConversationStatus = (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS]

// Interface cho message
interface IMessage {
  role: MessageRole
  content: string
  timestamp: Date
  id: string
}

// Interface cho conversation
interface IConversation {
  user: mongoose.Types.ObjectId
  title: string
  messages: IMessage[]
  status: ConversationStatus
  lastActivity: Date
  createdAt: Date
  updatedAt: Date
}

// Import helper function
import { updateConversationLastActivity } from '@utils/conversation.helper'

// Schema cho Message (embedded)
const MessageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: Object.values(MESSAGE_ROLE),
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000, // Giới hạn độ dài message
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    id: {
      type: String,
      required: true,
    },
  },
  { _id: false },
) // Không tạo _id riêng cho message

// Schema cho Conversation
const ConversationSchema = new Schema<IConversation>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true, // Index để query nhanh theo user
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
      default: 'Cuộc trò chuyện mới',
    },
    messages: {
      type: [MessageSchema],
      default: [],
      validate: {
        validator: function (messages: IMessage[]) {
          // Giới hạn tối đa 1000 messages per conversation
          return messages.length <= 1000
        },
        message: 'Cuộc trò chuyện không thể có quá 1000 tin nhắn',
      },
    },
    status: {
      type: String,
      enum: Object.values(CONVERSATION_STATUS),
      default: CONVERSATION_STATUS.ACTIVE,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: -1, // Index giảm dần để sort theo thời gian
    },
  },
  {
    timestamps: true,
  },
)

// Tạo compound indexes
ConversationSchema.index({ user: 1, lastActivity: -1 }) // Query conversations của user theo thời gian
ConversationSchema.index({ user: 1, status: 1 }) // Filter theo status

// Middleware để update lastActivity khi có message mới
ConversationSchema.pre('save', function () {
  updateConversationLastActivity(this)
})

// Export model
export const ConversationModel = mongoose.model<IConversation>('conversations', ConversationSchema)

// Export interfaces
export { IConversation, IMessage }
