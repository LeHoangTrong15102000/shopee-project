import { Socket } from 'socket.io'
import { SocketEvent, SubscribeFlashSalePayload } from '../../@types/socket.type'
import { SOCKET_CONFIG, SOCKET_ERRORS } from '@constants/socket'
import { Logger } from '@utils/logger'

/**
 * Get flash sale room name from sale ID
 */
export const getFlashSaleRoomName = (saleId: string): string =>
  `${SOCKET_CONFIG.ROOM_PREFIX.FLASH_SALE}${saleId}`

/**
 * Register flash sale event handlers on a socket connection.
 */
export const registerFlashSaleHandlers = (socket: Socket): void => {
  // Subscribe to flash sale updates
  socket.on(SocketEvent.SUBSCRIBE_FLASH_SALE, (payload: SubscribeFlashSalePayload) => {
    try {
      if (!payload?.sale_id) {
        socket.emit(SocketEvent.ERROR, {
          code: SOCKET_ERRORS.INVALID_PAYLOAD,
          message: 'sale_id is required',
        })
        return
      }

      const roomName = getFlashSaleRoomName(payload.sale_id)
      socket.join(roomName)

      Logger.apiInfo('Socket subscribed to flash sale room', {
        socketId: socket.id,
        userId: socket.user?.id,
        saleId: payload.sale_id,
        room: roomName,
      })
    } catch (error) {
      Logger.apiError('Error subscribing to flash sale', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      })
    }
  })

  // Unsubscribe from flash sale updates
  socket.on(SocketEvent.UNSUBSCRIBE_FLASH_SALE, (payload: SubscribeFlashSalePayload) => {
    try {
      if (!payload?.sale_id) {
        return
      }

      const roomName = getFlashSaleRoomName(payload.sale_id)
      socket.leave(roomName)

      Logger.apiInfo('Socket unsubscribed from flash sale room', {
        socketId: socket.id,
        userId: socket.user?.id,
        saleId: payload.sale_id,
        room: roomName,
      })
    } catch (error) {
      Logger.apiError('Error unsubscribing from flash sale', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : error,
      })
    }
  })
}
