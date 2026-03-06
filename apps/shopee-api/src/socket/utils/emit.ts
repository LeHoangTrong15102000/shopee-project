import { SOCKET_CONFIG } from '@constants/socket'
import { NotificationPayload, SocketErrorPayload, SocketEvent } from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'

/**
 * Emit an event to a specific user by userId
 * @param userId - The user's ID
 * @param event - The event name to emit
 * @param data - The data payload to send
 * @returns true if emitted successfully, false otherwise
 */
export const emitToUser = (userId: string, event: string, data: any): boolean => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.USER}${userId}`

    io.to(room).emit(event, data)

    Logger.apiInfo('Emitted event to user', { userId, event, room })
    return true
  } catch (error) {
    Logger.apiError('Failed to emit event to user', { userId, event, error })
    return false
  }
}

/**
 * Emit an event to multiple users
 * @param userIds - Array of user IDs
 * @param event - The event name to emit
 * @param data - The data payload to send
 */
export const emitToUsers = (userIds: string[], event: string, data: any): void => {
  try {
    const io = getIORequired()

    for (const userId of userIds) {
      const room = `${SOCKET_CONFIG.ROOM_PREFIX.USER}${userId}`
      io.to(room).emit(event, data)
    }

    Logger.apiInfo('Emitted event to multiple users', { userCount: userIds.length, event })
  } catch (error) {
    Logger.apiError('Failed to emit event to users', { userIds, event, error })
  }
}

/**
 * Emit an event to a chat room
 * @param chatId - The chat room ID
 * @param event - The event name to emit
 * @param data - The data payload to send
 */
export const emitToChat = (chatId: string, event: string, data: any): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.CHAT}${chatId}`

    io.to(room).emit(event, data)

    Logger.apiInfo('Emitted event to chat', { chatId, event, room })
  } catch (error) {
    Logger.apiError('Failed to emit event to chat', { chatId, event, error })
  }
}

/**
 * Emit an event to a chat room excluding a specific socket (the sender)
 * @param chatId - The chat room ID
 * @param senderSocketId - The socket ID to exclude from the broadcast
 * @param event - The event name to emit
 * @param data - The data payload to send
 */
export const emitToChatExcludeSender = (
  chatId: string,
  senderSocketId: string,
  event: string,
  data: any
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.CHAT}${chatId}`

    io.to(room).except(senderSocketId).emit(event, data)

    Logger.apiInfo('Emitted event to chat (excluding sender)', {
      chatId,
      event,
      room,
      excludedSocketId: senderSocketId,
    })
  } catch (error) {
    Logger.apiError('Failed to emit event to chat (excluding sender)', {
      chatId,
      senderSocketId,
      event,
      error,
    })
  }
}

/**
 * Send a notification to a specific user
 * @param userId - The user's ID
 * @param notification - The notification payload
 * @returns true if emitted successfully, false otherwise
 */
export const emitNotification = (userId: string, notification: NotificationPayload): boolean => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.USER}${userId}`

    io.to(room).emit(SocketEvent.NOTIFICATION, notification)

    Logger.apiInfo('Emitted notification to user', {
      userId,
      notificationId: notification._id,
      type: notification.type,
    })
    return true
  } catch (error) {
    Logger.apiError('Failed to emit notification to user', { userId, notification, error })
    return false
  }
}

/**
 * Send an error to a specific socket
 * @param socketId - The socket ID to send the error to
 * @param error - The error payload
 */
export const emitError = (socketId: string, error: SocketErrorPayload): void => {
  try {
    const io = getIORequired()

    io.to(socketId).emit(SocketEvent.ERROR, error)

    Logger.apiInfo('Emitted error to socket', { socketId, errorCode: error.code })
  } catch (err) {
    Logger.apiError('Failed to emit error to socket', { socketId, error, err })
  }
}

