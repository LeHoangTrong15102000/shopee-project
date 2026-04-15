import { Logger } from '@utils/logger'

export interface ActivityEntry {
  product_id: string
  type: 'purchase' | 'review'
  message: string
  timestamp: string
}

const MAX_BUFFER_SIZE = 10
const THROTTLE_MS = 5000 // 5 seconds per product

// In-memory activity buffer: productId -> ActivityEntry[]
const activityBufferMap = new Map<string, ActivityEntry[]>()

// Throttle tracking: productId -> last emit timestamp
const throttleMap = new Map<string, number>()

/**
 * Add an activity to the buffer for a product
 * Returns true if the activity should be broadcast (not throttled)
 * @param productId - The product ID
 * @param activity - The activity entry
 */
export const addActivity = (productId: string, activity: ActivityEntry): boolean => {
  // Add to buffer
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

  // Check throttle
  const now = Date.now()
  const lastEmit = throttleMap.get(productId) || 0

  if (now - lastEmit < THROTTLE_MS) {
    Logger.apiInfo('Activity throttled for product', {
      productId,
      timeSinceLastEmit: now - lastEmit,
    })
    return false
  }

  throttleMap.set(productId, now)
  return true
}

/**
 * Get recent activities for a product (for buffer on room join)
 * @param productId - The product ID
 * @returns Array of recent activities, oldest first
 */
export const getRecentActivities = (productId: string): ActivityEntry[] => {
  return activityBufferMap.get(productId) || []
}

/**
 * Clear activity buffer for a product (for testing)
 * @param productId - The product ID
 */
export const clearActivities = (productId: string): void => {
  activityBufferMap.delete(productId)
  throttleMap.delete(productId)
}
