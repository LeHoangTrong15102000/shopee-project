import { SOCKET_CONFIG } from '@constants/socket'
import { SocketEvent, CartUpdatedPayload } from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'

/**
 * Emit a cart update to all user's devices for cross-device sync
 * @param userId - The user ID
 * @param action - The cart action performed
 * @param productId - Optional product ID involved in the action
 * @param excludeSocketId - Optional socket ID to exclude from broadcast
 */
export const emitCartUpdate = (
  userId: string,
  action: 'add' | 'update' | 'delete' | 'buy',
  productId?: string,
  excludeSocketId?: string,
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.CART}${userId}`

    const payload: CartUpdatedPayload = {
      user_id: userId,
      action,
      product_id: productId,
      timestamp: new Date().toISOString(),
    }

    if (excludeSocketId) {
      io.to(room).except(excludeSocketId).emit(SocketEvent.CART_UPDATED, payload)
    } else {
      io.to(room).emit(SocketEvent.CART_UPDATED, payload)
    }

    Logger.apiInfo('Cart update emitted', {
      userId,
      action,
      productId,
      room,
    })
  } catch (error) {
    Logger.apiError('Failed to emit cart update', {
      userId,
      action,
      error: error instanceof Error ? error.message : error,
    })
  }
}
