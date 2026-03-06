import { Socket } from 'socket.io'
import mongoose from 'mongoose'
import {
  SocketEvent,
  JoinChatPayload,
  SendMessagePayload,
  TypingPayload,
  MessageReceivedPayload,
  SocketErrorPayload,
} from '../../@types/socket.type'
import { ChatModel } from '@database/models/chat.model'
import { MessageModel } from '@database/models/message.model'
import { UserModel } from '@database/models/user.model'
import { SOCKET_CONFIG, SOCKET_ERRORS } from '@constants/socket'
import { Logger } from '@utils/logger'

const getRoomName = (chatId: string) => `${SOCKET_CONFIG.ROOM_PREFIX.CHAT}${chatId}`

const emitError = (socket: Socket, code: string, message: string) => {
  socket.emit(SocketEvent.ERROR, { code, message } as SocketErrorPayload)
}

const isUserParticipant = (chat: any, userId: string): boolean => {
  return chat.participants.some((p: any) => p.user.toString() === userId)
}

export const registerChatHandlers = (socket: Socket): void => {
  const userId = (socket as any).user?.id

  socket.on(SocketEvent.JOIN_CHAT, async (payload: JoinChatPayload) => {
    try {
      if (!payload?.chat_id) {
        return emitError(socket, SOCKET_ERRORS.INVALID_PAYLOAD, 'chat_id is required')
      }

      const chat = await ChatModel.findById(payload.chat_id)
      if (!chat) {
        return emitError(socket, SOCKET_ERRORS.CHAT_NOT_FOUND, 'Chat not found')
      }

      if (!isUserParticipant(chat, userId)) {
        return emitError(socket, SOCKET_ERRORS.UNAUTHORIZED, 'Not a participant of this chat')
      }

      const roomName = getRoomName(payload.chat_id)
      socket.join(roomName)
      Logger.apiInfo(`User ${userId} joined chat ${payload.chat_id}`)
    } catch (error) {
      Logger.apiError('Error joining chat', error)
      emitError(socket, SOCKET_ERRORS.INTERNAL_ERROR, 'Failed to join chat')
    }
  })

  socket.on(SocketEvent.LEAVE_CHAT, (payload: JoinChatPayload) => {
    if (!payload?.chat_id) return

    const roomName = getRoomName(payload.chat_id)
    socket.leave(roomName)
    Logger.apiInfo(`User ${userId} left chat ${payload.chat_id}`)
  })

  socket.on(SocketEvent.SEND_MESSAGE, async (payload: SendMessagePayload) => {
    try {
      if (!payload?.chat_id || !payload?.message) {
        return emitError(socket, SOCKET_ERRORS.INVALID_PAYLOAD, 'chat_id and message are required')
      }

      const chat = await ChatModel.findById(payload.chat_id)
      if (!chat) {
        return emitError(socket, SOCKET_ERRORS.CHAT_NOT_FOUND, 'Chat not found')
      }

      if (!isUserParticipant(chat, userId)) {
        return emitError(socket, SOCKET_ERRORS.UNAUTHORIZED, 'Not a participant of this chat')
      }

      const sender = await UserModel.findById(userId).select('name avatar')
      const senderObjectId = new mongoose.Types.ObjectId(userId)

      const message = await MessageModel.create({
        chat: new mongoose.Types.ObjectId(payload.chat_id),
        sender: senderObjectId,
        content: payload.message,
        message_type: payload.message_type || 'text',
        status: 'sent',
      })

      await ChatModel.findByIdAndUpdate(payload.chat_id, {
        last_message: {
          content: payload.message.substring(0, 500),
          sender: senderObjectId,
          sent_at: new Date(),
        },
      })

      const messagePayload: MessageReceivedPayload = {
        _id: message._id.toString(),
        chat_id: payload.chat_id,
        sender: {
          _id: userId,
          name: sender?.name || 'Unknown',
          avatar: sender?.avatar ?? undefined,
        },
        content: message.content,
        message_type: message.message_type,
        status: 'sent',
        created_at: message.createdAt.toISOString(),
      }

      const roomName = getRoomName(payload.chat_id)
      socket.to(roomName).emit(SocketEvent.MESSAGE_RECEIVED, messagePayload)
      socket.emit(SocketEvent.MESSAGE_RECEIVED, messagePayload)
      socket.emit(SocketEvent.MESSAGE_DELIVERED, {
        message_id: message._id.toString(),
        chat_id: payload.chat_id,
        status: 'delivered',
      })
    } catch (error) {
      Logger.apiError('Error sending message', error)
      emitError(socket, SOCKET_ERRORS.INTERNAL_ERROR, 'Failed to send message')
    }
  })

  socket.on(SocketEvent.TYPING_START, (payload: TypingPayload) => {
    if (!payload?.chat_id) return

    const roomName = getRoomName(payload.chat_id)
    socket.to(roomName).emit(SocketEvent.USER_TYPING, {
      chat_id: payload.chat_id,
      user_id: userId,
      user_name: (socket as any).user?.email || 'Unknown',
    })
  })

  socket.on(SocketEvent.TYPING_STOP, (payload: TypingPayload) => {
    if (!payload?.chat_id) return

    const roomName = getRoomName(payload.chat_id)
    socket.to(roomName).emit(SocketEvent.USER_STOPPED_TYPING, {
      chat_id: payload.chat_id,
      user_id: userId,
      user_name: (socket as any).user?.email || 'Unknown',
    })
  })
}

