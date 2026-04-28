import { redisClient } from '@utils/redis.client'
import { Logger } from '@utils/logger'

export interface ActivityEntry {
  product_id: string
  type: 'purchase' | 'review'
  message: string
  timestamp: string
}

const MAX_BUFFER_SIZE = 10
const THROTTLE_SECONDS = 5 // 5 seconds per product

// In-memory activity buffer: productId -> ActivityEntry[]
// Stays in memory by design — it's a short-lived accumulator flushed on each broadcast.
const activityBufferMap = new Map<string, ActivityEntry[]>()

/**
 * Attempt to acquire the throttle lock for a product using Redis SET NX.
 * Returns true if the broadcast should proceed (lock acquired), false if throttled.
 * Falls back to in-memory timestamp tracking when Redis is unavailable.
 */
const throttleMapFallback = new Map<string, number>()

async function acquireThrottleLock(productId: string): Promise<boolean> {
  if (redisClient) {
    try {
      // SET NX EX: set key only if it does not exist, with TTL
      const result = await redisClient.set(
        `throttle:activity:${productId}`,
        '1',
        'NX',
        'EX',
        THROTTLE_SECONDS,
      )
      // result is 'OK' if key was set (lock acquired), null if key already existed (throttled)
      return result === 'OK'
    } catch (err) {
      Logger.apiError('Redis throttle lock error — falling back to memory', err)
      // Fall through to memory fallback
    }
  }

  // In-memory fallback (test env or Redis unavailable)
  const now = Date.now()
  const lastEmit = throttleMapFallback.get(productId) || 0
  if (now - lastEmit < THROTTLE_SECONDS * 1000) {
    return false
  }
  throttleMapFallback.set(productId, now)
  return true
}

/**
 * Add an activity to the buffer for a product.
 * Returns true if the activity should be broadcast (not throttled).
 */
export const addActivity = async (productId: string, activity: ActivityEntry): Promise<boolean> => {
  // Add to in-memory buffer
  let buffer = activityBufferMap.get(productId)
  if (!buffer) {
    buffer = []
    activityBufferMap.set(productId, buffer)
  }

  buffer.push(activity)

  // Evict oldest if over limit
  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer.shift()
  }

  const shouldBroadcast = await acquireThrottleLock(productId)

  if (!shouldBroadcast) {
    Logger.apiInfo('Activity throttled for product', { productId })
    return false
  }

  // Clear the buffer after broadcast
  activityBufferMap.set(productId, [])
  return true
}

/**
 * Get recent activities for a product (for buffer on room join).
 */
export const getRecentActivities = (productId: string): ActivityEntry[] => {
  return activityBufferMap.get(productId) || []
}

/**
 * Clear activity buffer for a product (for testing).
 */
export const clearActivities = (productId: string): void => {
  activityBufferMap.delete(productId)
  throttleMapFallback.delete(productId)
  if (redisClient) {
    redisClient.del(`throttle:activity:${productId}`).catch(() => {})
  }
}
