import { Socket } from 'socket.io'
import { SocketEvent } from '../../@types/socket.type'
import { SOCKET_CONFIG, SOCKET_ERRORS } from '@constants/socket'
import { ROLE } from '@constants/role.enum'
import { Logger } from '@utils/logger'

/**
 * Get seller room name from user ID
 */
export const getSellerRoomName = (userId: string): string =>
  `${SOCKET_CONFIG.ROOM_PREFIX.SELLER}${userId}`

/**
 * Register seller dashboard event handlers on a socket connection.
 * Only Admin users can subscribe to seller dashboard events.
 */
export const registerSellerDashboardHandlers = (socket: Socket): void => {
  // Subscribe to seller dashboard
  socket.on(SocketEvent.SUBSCRIBE_SELLER_DASHBOARD, () => {
    try {
      const roles = socket.user?.roles ?? []
      if (!roles.includes(ROLE.ADMIN)) {
        socket.emit(SocketEvent.ERROR, {
          code: SOCKET_ERRORS.UNAUTHORIZED,
          message: 'Only Admin users can subscribe to seller dashboard',
        })
        return
      }

      const userId = socket.user?.id
      if (!userId) return

      const roomName = getSellerRoomName(userId)
      socket.join(roomName)

      Logger.apiInfo('Socket subscribed to seller dashboard', {
        socketId: socket.id,
        userId,
        room: roomName,
      })
    } catch (error) {
      Logger.apiError('Error subscribing to seller dashboard', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      })
    }
  })

  // Unsubscribe from seller dashboard
  socket.on(SocketEvent.UNSUBSCRIBE_SELLER_DASHBOARD, () => {
    try {
      const userId = socket.user?.id
      if (!userId) return

      const roomName = getSellerRoomName(userId)
      socket.leave(roomName)

      Logger.apiInfo('Socket unsubscribed from seller dashboard', {
        socketId: socket.id,
        userId,
        room: roomName,
      })
    } catch (error) {
      Logger.apiError('Error unsubscribing from seller dashboard', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      })
    }
  })
}

