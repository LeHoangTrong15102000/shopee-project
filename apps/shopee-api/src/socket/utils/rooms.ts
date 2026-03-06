import { Socket } from 'socket.io'
import { SOCKET_CONFIG } from '@constants/socket'
import { SocketEvent, SocketUserData } from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'

interface SocketData {
  user?: SocketUserData
}

/**
 * Build chat room name from chat ID
 */
export const getChatRoomName = (chatId: string): string =>
  `${SOCKET_CONFIG.ROOM_PREFIX.CHAT}${chatId}`

/**
 * Build user room name from user ID
 */
export const getUserRoomName = (userId: string): string =>
  `${SOCKET_CONFIG.ROOM_PREFIX.USER}${userId}`

/**
 * Join a socket to a chat room and notify other members
 */
export const joinChatRoom = async (socket: Socket, chatId: string): Promise<void> => {
  try {
    const roomName = getChatRoomName(chatId)
    const user = socket.user

    await socket.join(roomName)

    socket.to(roomName).emit(SocketEvent.USER_JOINED, {
      chat_id: chatId,
      user_id: user?.id,
      user_name: user?.email,
    })

    Logger.apiInfo('Socket joined chat room', {
      socketId: socket.id,
      userId: user?.id,
      roomName,
    })
  } catch (error) {
    Logger.apiError('Failed to join chat room', {
      socketId: socket.id,
      chatId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Leave a chat room and notify other members
 */
export const leaveChatRoom = async (socket: Socket, chatId: string): Promise<void> => {
  try {
    const roomName = getChatRoomName(chatId)
    const user = socket.user

    socket.to(roomName).emit(SocketEvent.USER_LEFT, {
      chat_id: chatId,
      user_id: user?.id,
      user_name: user?.email,
    })

    await socket.leave(roomName)

    Logger.apiInfo('Socket left chat room', {
      socketId: socket.id,
      userId: user?.id,
      roomName,
    })
  } catch (error) {
    Logger.apiError('Failed to leave chat room', {
      socketId: socket.id,
      chatId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Leave all chat rooms for a socket (cleanup on disconnect)
 */
export const leaveAllChatRooms = async (socket: Socket): Promise<void> => {
  try {
    const chatPrefix = SOCKET_CONFIG.ROOM_PREFIX.CHAT

    for (const room of socket.rooms) {
      if (room.startsWith(chatPrefix)) {
        const chatId = room.slice(chatPrefix.length)
        await leaveChatRoom(socket, chatId)
      }
    }

    Logger.apiInfo('Socket left all chat rooms', { socketId: socket.id })
  } catch (error) {
    Logger.apiError('Failed to leave all chat rooms', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Get all socket IDs in a room
 */
export const getRoomMembers = async (roomName: string): Promise<string[]> => {
  try {
    const io = getIORequired()
    const sockets = await io.in(roomName).fetchSockets()
    return sockets.map((s) => s.id)
  } catch (error) {
    Logger.apiError('Failed to get room members', {
      roomName,
      error: error instanceof Error ? error.message : error,
    })
    return []
  }
}

/**
 * Check if a user has at least one socket in a specific room
 */
export const isUserInRoom = async (userId: string, roomName: string): Promise<boolean> => {
  try {
    const io = getIORequired()
    const sockets = await io.in(roomName).fetchSockets()
    return sockets.some((s) => (s.data as SocketData)?.user?.id === userId)
  } catch (error) {
    Logger.apiError('Failed to check if user is in room', {
      userId,
      roomName,
      error: error instanceof Error ? error.message : error,
    })
    return false
  }
}

/**
 * Build product room name from product ID
 */
export const getProductRoomName = (productId: string): string =>
  `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}${productId}`

/**
 * Leave all product rooms for a socket (cleanup on disconnect)
 */
export const leaveAllProductRooms = async (socket: Socket): Promise<void> => {
  try {
    const productPrefix = SOCKET_CONFIG.ROOM_PREFIX.PRODUCT

    for (const room of socket.rooms) {
      if (room.startsWith(productPrefix)) {
        await socket.leave(room)
      }
    }

    Logger.apiInfo('Socket left all product rooms', { socketId: socket.id })
  } catch (error) {
    Logger.apiError('Failed to leave all product rooms', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : error,
    })
  }
}

