import { SOCKET_CONFIG } from '@constants/socket'
import { SocketEvent, PriceUpdatedPayload } from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'

/**
 * Emit a price update to all users viewing a product
 * @param productId - The product ID
 * @param oldPrice - Previous price
 * @param newPrice - New price
 * @param oldPriceBeforeDiscount - Previous price before discount
 * @param newPriceBeforeDiscount - New price before discount
 */
export const emitPriceUpdate = (
  productId: string,
  oldPrice: number,
  newPrice: number,
  oldPriceBeforeDiscount: number,
  newPriceBeforeDiscount: number,
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}${productId}`

    const payload: PriceUpdatedPayload = {
      product_id: productId,
      old_price: oldPrice,
      new_price: newPrice,
      old_price_before_discount: oldPriceBeforeDiscount,
      new_price_before_discount: newPriceBeforeDiscount,
    }

    io.to(room).emit(SocketEvent.PRICE_UPDATED, payload)

    Logger.apiInfo('Price update emitted to product room', {
      productId,
      room,
      oldPrice,
      newPrice,
    })
  } catch (error) {
    Logger.apiError('Failed to emit price update', {
      productId,
      error: error instanceof Error ? error.message : error,
    })
  }
}
