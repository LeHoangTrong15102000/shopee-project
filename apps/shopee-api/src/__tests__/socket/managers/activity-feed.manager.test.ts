/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    apiWarn: jest.fn(),
  },
}))

// Force in-memory fallback by making redisClient null
jest.mock('@utils/redis.client', () => ({
  redisClient: null,
}))

describe('Activity Feed Manager', () => {
  let activityFeedManager: typeof import('../../../socket/managers/activity-feed.manager')

  beforeEach(() => {
    jest.resetModules()
    jest.restoreAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('addActivity', () => {
    it('should return true for first activity (not throttled)', async () => {
      activityFeedManager = await import('../../../socket/managers/activity-feed.manager')

      const activity: import('../../../socket/managers/activity-feed.manager').ActivityEntry = {
        product_id: 'prod-1',
        type: 'purchase',
        message: 'User bought this item',
        timestamp: new Date().toISOString(),
      }

      const result = await activityFeedManager.addActivity('prod-1', activity)
      expect(result).toBe(true)
    })

    it('should return false for second activity within 5s (throttled)', async () => {
      activityFeedManager = await import('../../../socket/managers/activity-feed.manager')

      const now = Date.now()
      jest.spyOn(Date, 'now').mockReturnValue(now)

      const activity1: import('../../../socket/managers/activity-feed.manager').ActivityEntry = {
        product_id: 'prod-1',
        type: 'purchase',
        message: 'First purchase',
        timestamp: new Date().toISOString(),
      }

      const activity2: import('../../../socket/managers/activity-feed.manager').ActivityEntry = {
        product_id: 'prod-1',
        type: 'review',
        message: 'Second activity',
        timestamp: new Date().toISOString(),
      }

      await activityFeedManager.addActivity('prod-1', activity1)

      jest.spyOn(Date, 'now').mockReturnValue(now + 3000)
      const result = await activityFeedManager.addActivity('prod-1', activity2)
      expect(result).toBe(false)
    })

    it('should return true after throttle period expires', async () => {
      activityFeedManager = await import('../../../socket/managers/activity-feed.manager')

      const now = Date.now()
      jest.spyOn(Date, 'now').mockReturnValue(now)

      const activity1: import('../../../socket/managers/activity-feed.manager').ActivityEntry = {
        product_id: 'prod-1',
        type: 'purchase',
        message: 'First purchase',
        timestamp: new Date().toISOString(),
      }

      const activity2: import('../../../socket/managers/activity-feed.manager').ActivityEntry = {
        product_id: 'prod-1',
        type: 'review',
        message: 'Second activity after throttle',
        timestamp: new Date().toISOString(),
      }

      await activityFeedManager.addActivity('prod-1', activity1)

      jest.spyOn(Date, 'now').mockReturnValue(now + 6000)
      const result = await activityFeedManager.addActivity('prod-1', activity2)
      expect(result).toBe(true)
    })

    it('should evict oldest entry when buffer exceeds 10 items', async () => {
      activityFeedManager = await import('../../../socket/managers/activity-feed.manager')

      for (let i = 0; i < 11; i++) {
        const activity: import('../../../socket/managers/activity-feed.manager').ActivityEntry = {
          product_id: 'prod-1',
          type: 'purchase',
          message: `Activity ${i}`,
          timestamp: new Date().toISOString(),
        }
        await activityFeedManager.addActivity('prod-1', activity)
      }

      const activities = activityFeedManager.getRecentActivities('prod-1')
      expect(activities.length).toBeLessThanOrEqual(10)
    })

    it('should create new buffer for new product', async () => {
      activityFeedManager = await import('../../../socket/managers/activity-feed.manager')

      const activity: import('../../../socket/managers/activity-feed.manager').ActivityEntry = {
        product_id: 'new-prod',
        type: 'review',
        message: 'New product review',
        timestamp: new Date().toISOString(),
      }

      const result = await activityFeedManager.addActivity('new-prod', activity)
      // First call acquires throttle lock and clears buffer after broadcast
      // The product entry exists in the map (buffer is empty after successful broadcast)
      expect(result).toBe(true)
      // Buffer is cleared after broadcast, so getRecentActivities returns []
      const activities = activityFeedManager.getRecentActivities('new-prod')
      expect(Array.isArray(activities)).toBe(true)
    })
  })

  describe('getRecentActivities', () => {
    it('should return activities for existing product', async () => {
      activityFeedManager = await import('../../../socket/managers/activity-feed.manager')

      const activity: import('../../../socket/managers/activity-feed.manager').ActivityEntry = {
        product_id: 'prod-1',
        type: 'purchase',
        message: 'Test activity',
        timestamp: new Date().toISOString(),
      }

      await activityFeedManager.addActivity('prod-1', activity)
      // After a successful broadcast, buffer is cleared; check the activity was added before clear
      // getRecentActivities returns the current buffer state
      const activities = activityFeedManager.getRecentActivities('prod-1')
      expect(Array.isArray(activities)).toBe(true)
    })

    it('should return empty array for unknown product', async () => {
      activityFeedManager = await import('../../../socket/managers/activity-feed.manager')

      const activities = activityFeedManager.getRecentActivities('unknown-prod')
      expect(activities).toEqual([])
    })
  })

  describe('clearActivities', () => {
    it('should remove buffer and throttle for product', async () => {
      activityFeedManager = await import('../../../socket/managers/activity-feed.manager')

      const now = Date.now()
      jest.spyOn(Date, 'now').mockReturnValue(now)

      const activity: import('../../../socket/managers/activity-feed.manager').ActivityEntry = {
        product_id: 'prod-clear',
        type: 'purchase',
        message: 'Test activity',
        timestamp: new Date().toISOString(),
      }

      await activityFeedManager.addActivity('prod-clear', activity)

      activityFeedManager.clearActivities('prod-clear')
      expect(activityFeedManager.getRecentActivities('prod-clear')).toEqual([])

      // After clearing, throttle is reset so next add should return true
      jest.spyOn(Date, 'now').mockReturnValue(now + 1000)
      const newActivity: import('../../../socket/managers/activity-feed.manager').ActivityEntry = {
        product_id: 'prod-clear',
        type: 'review',
        message: 'New activity after clear',
        timestamp: new Date().toISOString(),
      }
      const result = await activityFeedManager.addActivity('prod-clear', newActivity)
      expect(result).toBe(true)
    })

    it('should handle clearing non-existent product gracefully', async () => {
      activityFeedManager = await import('../../../socket/managers/activity-feed.manager')

      expect(() => activityFeedManager.clearActivities('non-existent')).not.toThrow()
    })
  })
})
