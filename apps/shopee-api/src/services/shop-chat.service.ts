import mongoose from 'mongoose'
import {
  ShopConversationModel,
  IShopConversation,
} from '@database/models/shop-conversation.model'
import {
  ShopMessageModel,
  IShopMessage,
  ShopMessageType,
} from '@database/models/shop-message.model'
import { ShopModel } from '@database/models/shop.model'
import { BaseService, NotFoundError, ValidationError } from './base.service'
import { getIO } from '../socket/socket.init'
import { SOCKET_CONFIG } from '@constants/socket'

export class ShopChatService extends BaseService {
  async getConversations(userId: string): Promise<IShopConversation[]> {
    return ShopConversationModel.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate('shopId', 'name avatar')
      .sort({ updatedAt: -1 })
      .lean()
  }

  async getMessages(
    conversationId: string,
    cursor?: string,
    limit = 20,
  ): Promise<{ data: IShopMessage[]; nextCursor: string | null }> {
    if (!this.isValidObjectId(conversationId)) {
      throw new ValidationError('Invalid conversation id')
    }

    const query: Record<string, unknown> = {
      conversationId: new mongoose.Types.ObjectId(conversationId),
    }
    if (cursor && this.isValidObjectId(cursor)) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) }
    }

    const messages = await ShopMessageModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean()

    const hasMore = messages.length > limit
    const data = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null

    return { data: data.reverse(), nextCursor }
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: 'user' | 'shop',
    content: string,
    type: ShopMessageType = 'text',
    imageUrl?: string,
  ): Promise<IShopMessage> {
    if (!this.isValidObjectId(conversationId)) {
      throw new ValidationError('Invalid conversation id')
    }

    const conversation = await ShopConversationModel.findById(conversationId)
    if (!conversation) throw new NotFoundError('Conversation', conversationId)

    const message = await ShopMessageModel.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderId,
      senderType,
      content,
      type,
      imageUrl,
    })

    // Update conversation last message
    await ShopConversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: { content, senderId, createdAt: new Date() },
      updatedAt: new Date(),
      $inc: { unreadCount: 1 },
    })

    // Emit WebSocket event to conversation room
    const io = getIO()
    if (io) {
      const room = `shop_conv:${conversationId}`
      io.to(room).emit('message:new', message)
    }

    return message
  }

  async createOrGetConversation(userId: string, shopId: string): Promise<IShopConversation> {
    if (!this.isValidObjectId(shopId)) {
      throw new ValidationError('Invalid shop id')
    }

    const shop = await ShopModel.findById(shopId)
    if (!shop) throw new NotFoundError('Shop', shopId)

    const existing = await ShopConversationModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      shopId: new mongoose.Types.ObjectId(shopId),
    }).lean()

    if (existing) return existing

    const conversation = await ShopConversationModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      shopId: new mongoose.Types.ObjectId(shopId),
      unreadCount: 0,
    })

    return conversation.toObject()
  }

  async markRead(conversationId: string): Promise<void> {
    if (!this.isValidObjectId(conversationId)) return
    await ShopConversationModel.findByIdAndUpdate(conversationId, { unreadCount: 0 })
    const io = getIO()
    if (io) {
      const room = `shop_conv:${conversationId}`
      io.to(room).emit('message:read', { conversationId, readAt: new Date() })
    }
  }
}
