import { SOCKET_CONFIG } from '@constants/socket'
import {
  SocketEvent,
  SellerOrderNotificationPayload,
  SellerMetricsUpdatePayload,
  SellerQANotificationPayload,
} from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'

/**
 * Emit a seller order notification to the seller's dashboard room
 * @param sellerId - The seller's user ID
 * @param notification - Order notification data
 */
export const emitSellerOrderNotification = (
  sellerId: string,
  notification: SellerOrderNotificationPayload
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.SELLER}${sellerId}`

    io.to(room).emit(SocketEvent.SELLER_ORDER_NOTIFICATION, notification)

    Logger.apiInfo('Seller order notification emitted', {
      sellerId,
      room,
      orderId: notification.order_id,
      status: notification.status,
    })
  } catch (error) {
    Logger.apiError('Failed to emit seller order notification', {
      sellerId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Emit seller metrics update to the seller's dashboard room
 * @param sellerId - The seller's user ID
 * @param metrics - Updated metrics data
 */
export const emitSellerMetricsUpdate = (
  sellerId: string,
  metrics: SellerMetricsUpdatePayload
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.SELLER}${sellerId}`

    io.to(room).emit(SocketEvent.SELLER_METRICS_UPDATE, metrics)

    Logger.apiInfo('Seller metrics update emitted', {
      sellerId,
      room,
      todayOrders: metrics.today_orders,
      todayRevenue: metrics.today_revenue,
    })
  } catch (error) {
    Logger.apiError('Failed to emit seller metrics update', {
      sellerId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Emit a seller Q&A notification to the seller's dashboard room
 * @param sellerId - The seller's user ID
 * @param notification - Q&A notification data
 */
export const emitSellerQANotification = (
  sellerId: string,
  notification: SellerQANotificationPayload
): void => {
  try {
    const io = getIORequired()
    const room = `${SOCKET_CONFIG.ROOM_PREFIX.SELLER}${sellerId}`

    io.to(room).emit(SocketEvent.SELLER_QA_NOTIFICATION, notification)

    Logger.apiInfo('Seller Q&A notification emitted', {
      sellerId,
      room,
      productId: notification.product_id,
      questionId: notification.question_id,
    })
  } catch (error) {
    Logger.apiError('Failed to emit seller Q&A notification', {
      sellerId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

