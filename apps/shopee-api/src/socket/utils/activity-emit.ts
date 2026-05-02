import { SOCKET_CONFIG } from '@constants/socket'
import { SocketEvent, ActivityEventPayload, ActivityBufferPayload } from '../../@types/socket.type'
import { Logger } from '@utils/logger'
import { getIORequired } from '../socket.init'
import { addActivity, getRecentActivities, ActivityEntry } from '../managers/activity-feed.manager'

/**
 * Emit an activity event to all users viewing a product (with throttling)
 * @param productId - The product ID
 * @param type - Activity type ('purchase' | 'review')
 * @param message - Activity message (e.g., "Ai đó vừa mua sản phẩm này")
 */
export const emitActivityEvent = async (
  productId: string,
  type: 'purchase' | 'review',
  message: string,
): Promise<void> => {
  try {
    const activity: ActivityEntry = {
      product_id: productId,
      type,
      message,
      timestamp: new Date().toISOString(),
    }

    const shouldBroadcast = await addActivity(productId, activity)

    if (shouldBroadcast) {
      const io = getIORequired()
      const room = `${SOCKET_CONFIG.ROOM_PREFIX.PRODUCT}${productId}`

      const payload: ActivityEventPayload = {
        product_id: activity.product_id,
        type: activity.type,
        message: activity.message,
        timestamp: activity.timestamp,
      }

      io.to(room).emit(SocketEvent.ACTIVITY_EVENT, payload)

      Logger.apiInfo('Activity event emitted to product room', {
        productId,
        room,
        type,
        message,
      })
    }
  } catch (error) {
    Logger.apiError('Failed to emit activity event', {
      productId,
      error: error instanceof Error ? error.message : error,
    })
  }
}

/**
 * Send activity buffer to a single socket when they join a product room
 * @param socketId - The socket ID to send to
 * @param productId - The product ID
 */
export const emitActivityBuffer = (socketId: string, productId: string): void => {
  try {
    const activities = getRecentActivities(productId)
    if (activities.length === 0) return

    const io = getIORequired()

    const payload: ActivityBufferPayload = {
      product_id: productId,
      activities: activities.map((a) => ({
        product_id: a.product_id,
        type: a.type,
        message: a.message,
        timestamp: a.timestamp,
      })),
    }

    io.to(socketId).emit(SocketEvent.ACTIVITY_BUFFER, payload)

    Logger.apiInfo('Activity buffer sent to socket', {
      socketId,
      productId,
      activityCount: activities.length,
    })
  } catch (error) {
    Logger.apiError('Failed to emit activity buffer', {
      socketId,
      productId,
      error: error instanceof Error ? error.message : error,
    })
  }
}
