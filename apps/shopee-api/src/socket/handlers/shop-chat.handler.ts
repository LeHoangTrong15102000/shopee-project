import { Socket } from 'socket.io'
import { ShopConversationModel } from '@database/models/shop-conversation.model'
import { Logger } from '@utils/logger'

/**
 * Register shop chat WebSocket handlers.
 * Clients join a room named `shop_conv:<conversationId>` to receive
 * message:new, message:read, and typing events for that conversation.
 */
export const registerShopChatHandlers = (socket: Socket): void => {
  const userId = (socket as any).user?.id

  // Client joins a conversation room
  socket.on('shop_chat:join', async (payload: { conversationId: string }) => {
    try {
      if (!payload?.conversationId) return
      const conv = await ShopConversationModel.findById(payload.conversationId).lean()
      if (!conv) return
      if (conv.userId.toString() !== userId) return

      const room = `shop_conv:${payload.conversationId}`
      socket.join(room)
      Logger.apiInfo(`User ${userId} joined shop_conv room ${payload.conversationId}`)
    } catch (error) {
      Logger.apiError('Error joining shop_conv room', error)
    }
  })

  // Client leaves a conversation room
  socket.on('shop_chat:leave', (payload: { conversationId: string }) => {
    if (!payload?.conversationId) return
    const room = `shop_conv:${payload.conversationId}`
    socket.leave(room)
  })

  // Typing indicator — broadcast to room, do not persist
  socket.on('typing', (payload: { conversationId: string }) => {
    if (!payload?.conversationId) return
    const room = `shop_conv:${payload.conversationId}`
    socket.to(room).emit('typing', { conversationId: payload.conversationId, senderId: userId })
  })

  // Mark messages as read
  socket.on('message:read', (payload: { conversationId: string; messageId: string }) => {
    if (!payload?.conversationId) return
    const room = `shop_conv:${payload.conversationId}`
    socket.to(room).emit('message:read', {
      conversationId: payload.conversationId,
      readAt: new Date(),
    })
  })
}
