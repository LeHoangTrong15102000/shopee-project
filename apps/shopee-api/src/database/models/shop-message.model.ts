import mongoose, { Schema } from 'mongoose'

export const SHOP_MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
} as const

export type ShopMessageType = (typeof SHOP_MESSAGE_TYPE)[keyof typeof SHOP_MESSAGE_TYPE]

export const SHOP_SENDER_TYPE = {
  USER: 'user',
  SHOP: 'shop',
} as const

export type ShopSenderType = (typeof SHOP_SENDER_TYPE)[keyof typeof SHOP_SENDER_TYPE]

export interface IShopMessage {
  _id: mongoose.Types.ObjectId
  conversationId: mongoose.Types.ObjectId
  senderId: string
  senderType: ShopSenderType
  content: string
  type: ShopMessageType
  imageUrl?: string
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ShopMessageSchema = new Schema<IShopMessage>(
  {
    conversationId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'shop_conversations',
      required: true,
      index: true,
    },
    senderId: { type: String, required: true },
    senderType: {
      type: String,
      enum: Object.values(SHOP_SENDER_TYPE),
      required: true,
    },
    content: { type: String, required: true, maxlength: 5000 },
    type: {
      type: String,
      enum: Object.values(SHOP_MESSAGE_TYPE),
      default: SHOP_MESSAGE_TYPE.TEXT,
    },
    imageUrl: { type: String },
    readAt: { type: Date },
  },
  { timestamps: true },
)

ShopMessageSchema.index({ conversationId: 1, createdAt: -1 })

export const ShopMessageModel = mongoose.model<IShopMessage>('shop_messages', ShopMessageSchema)
