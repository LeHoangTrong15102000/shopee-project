import { Socket } from 'socket.io'
import { SocketEvent, SubscribeOrderPayload } from '../../@types/socket.type'
import { SOCKET_CONFIG, SOCKET_ERRORS } from '@constants/socket'
import { Logger } from '@utils/logger'

/**
 * Get order room name from order ID
 */
export const getOrderRoomName = (orderId: string): string =>
  `${SOCKET_CONFIG.ROOM_PREFIX.ORDER}${orderId}`

/**
 * Register order event handlers on a socket connection.
 */
export const registerOrderHandlers = (socket: Socket): void => {
  // Subscribe to order updates
  socket.on(SocketEvent.SUBSCRIBE_ORDER, (payload: SubscribeOrderPayload) => {
    try {
      if (!payload?.order_id) {
        socket.emit(SocketEvent.ERROR, {
          code: SOCKET_ERRORS.INVALID_PAYLOAD,
          message: 'order_id is required',
        })
        return
      }

      const roomName = getOrderRoomName(payload.order_id)
      socket.join(roomName)

      Logger.apiInfo('Socket subscribed to order room', {
        socketId: socket.id,
        userId: socket.user?.id,
        orderId: payload.order_id,
        room: roomName,
      })
    } catch (error) {
      Logger.apiError('Error subscribing to order', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      })
    }
  })

  // Unsubscribe from order updates
  socket.on(SocketEvent.UNSUBSCRIBE_ORDER, (payload: SubscribeOrderPayload) => {
    try {
      if (!payload?.order_id) {
        return
      }

      const roomName = getOrderRoomName(payload.order_id)
      socket.leave(roomName)

      Logger.apiInfo('Socket unsubscribed from order room', {
        socketId: socket.id,
        userId: socket.user?.id,
        orderId: payload.order_id,
        room: roomName,
      })
    } catch (error) {
      Logger.apiError('Error unsubscribing from order', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      })
    }
  })
}

