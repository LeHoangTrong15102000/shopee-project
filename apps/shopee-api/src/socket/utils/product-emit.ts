import { SOCKET_CONFIG } from '@constants/socket'
import { SocketEvent, PriceUpdatedPayload, PriceAlertTriggeredPayload } from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'
import { emitToUser } from './emit'

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
  newPriceBeforeDiscount: number
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

/**
 * Emit a price alert to a specific user when price drops below their target
 * @param userId - The user to notify
 * @param alert - The price alert data
 */
export const emitPriceAlert = (
  userId: string,
  alert: PriceAlertTriggeredPayload
): void => {
  try {
    emitToUser(userId, SocketEvent.PRICE_ALERT_TRIGGERED, alert)

    Logger.apiInfo('Price alert emitted to user', {
      userId,
      alertId: alert.alert_id,
      productId: alert.product_id,
      targetPrice: alert.target_price,
      newPrice: alert.new_price,
    })
  } catch (error) {
    Logger.apiError('Failed to emit price alert', {
      userId,
      alert,
      error: error instanceof Error ? error.message : error,
    })
  }
}

