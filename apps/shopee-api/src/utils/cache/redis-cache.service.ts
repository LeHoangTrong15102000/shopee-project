/**
 * Redis-backed cache service.
 *
 * Refactored from apps/shopee-api/src/utils/cache.service.ts.
 * All keys are prefixed with `shopee:api:cache:` to namespace them.
 * When Redis is unavailable, operations degrade gracefully:
 *   - get / has return null / false
 *   - set / del / flush are no-ops
 */

import { redisClient } from '@utils/redis.client'
import { Logger } from '@utils/logger'
import { ICacheService } from './types'

const KEY_PREFIX = 'shopee:api:cache:'

export class RedisCacheService implements ICacheService {
  /**
   * Get a value from cache.
   * Returns null on miss, expired key, or Redis error.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redisClient) return null
    try {
      const raw = await redisClient.get(KEY_PREFIX + key)
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch (err) {
      Logger.apiError('Cache get error', { key, err })
      return null
    }
  }

  /**
   * Store a value in cache with a TTL (seconds).
   * No-op if Redis is unavailable.
   */
  async set<T>(key: string, data: T, ttlSeconds = 300): Promise<void> {
    if (!redisClient) return
    try {
      await redisClient.setex(KEY_PREFIX + key, ttlSeconds, JSON.stringify(data))
    } catch (err) {
      Logger.apiError('Cache set error', { key, err })
    }
  }

  /**
   * Delete one or more cache entries.
   * Supports wildcard patterns (e.g. "products:*") via SCAN + DEL.
   * Returns the number of keys deleted.
   */
  async del(pattern: string): Promise<number> {
    if (!redisClient) return 0
    try {
      if (pattern.includes('*')) {
        return await this._scanDel(KEY_PREFIX + pattern)
      }
      return await redisClient.del(KEY_PREFIX + pattern)
    } catch (err) {
      Logger.apiError('Cache del error', { pattern, err })
      return 0
    }
  }

  /**
   * Delete all keys matching `shopee:api:cache:*`.
   * Uses SCAN to avoid blocking Redis with FLUSHDB.
   */
  async flush(): Promise<void> {
    if (!redisClient) return
    try {
      await this._scanDel(KEY_PREFIX + '*')
    } catch (err) {
      Logger.apiError('Cache flush error', err)
    }
  }

  /**
   * Check whether a key exists in Redis.
   */
  async has(key: string): Promise<boolean> {
    if (!redisClient) return false
    try {
      const count = await redisClient.exists(KEY_PREFIX + key)
      return count > 0
    } catch (err) {
      Logger.apiError('Cache has error', { key, err })
      return false
    }
  }

  /**
   * No-op — Redis TTL handles expiry automatically.
   * Kept for ICacheService compatibility.
   */
  cleanup(): void {
    // intentional no-op
  }

  // ---- private helpers ----

  private async _scanDel(pattern: string): Promise<number> {
    if (!redisClient) return 0
    let cursor = '0'
    let deleted = 0
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = nextCursor
      if (keys.length > 0) {
        deleted += await redisClient.del(...keys)
      }
    } while (cursor !== '0')
    return deleted
  }
}
