import mongoose, { Schema } from 'mongoose'

export interface IShopConversationLastMessage {
  content: string
  senderId: string
  createdAt: Date
}

export interface IShopConversation {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  shopId: mongoose.Types.ObjectId
  lastMessage?: IShopConversationLastMessage
  unreadCount: number
  updatedAt: Date
  createdAt: Date
}

const ShopConversationSchema = new Schema<IShopConversation>(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    shopId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'shops',
      required: true,
      index: true,
    },
    lastMessage: {
      content: { type: String, maxlength: 500 },
      senderId: { type: String },
      createdAt: { type: Date },
    },
    unreadCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

// Unique conversation per user-shop pair
ShopConversationSchema.index({ userId: 1, shopId: 1 }, { unique: true })
ShopConversationSchema.index({ userId: 1, updatedAt: -1 })

export const ShopConversationModel = mongoose.model<IShopConversation>(
  'shop_conversations',
  ShopConversationSchema,
)
