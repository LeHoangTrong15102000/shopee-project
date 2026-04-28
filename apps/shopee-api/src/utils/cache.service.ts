/**
 * Cache Service — Redis-backed implementation.
 *
 * All keys are prefixed with `cache:` to namespace them from rate-limit keys.
 * When Redis is unavailable, operations degrade gracefully:
 *   - get returns null
 *   - set/del/flush are no-ops
 */

import { redisClient } from '@utils/redis.client'
import { Logger } from '@utils/logger'

const KEY_PREFIX = 'cache:'

class CacheService {
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
   * Delete all keys matching `cache:*`.
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
   * No-op — Redis TTL handles expiry automatically.
   * Kept for interface compatibility.
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

// Singleton instance
export const cacheService = new CacheService()

// ============ Cache Key Generators ============

export const CacheKeys = {
  /**
   * Key for product list
   * Format: products:list:{page}:{limit}:{category}:{sort_by}:{order}:{rating_filter}:{price_min}:{price_max}:{name}
   */
  productsList: (params: {
    page?: number | string
    limit?: number | string
    category?: string
    sort_by?: string
    order?: string
    rating_filter?: string
    price_min?: string
    price_max?: string
    name?: string
  }): string => {
    const {
      page = 1,
      limit = 30,
      category = '',
      sort_by = '',
      order = '',
      rating_filter = '',
      price_min = '',
      price_max = '',
      name = '',
    } = params
    return `products:list:${page}:${limit}:${category}:${sort_by}:${order}:${rating_filter}:${price_min}:${price_max}:${name}`
  },

  /**
   * Key for product detail
   * Format: products:detail:{id}
   */
  productDetail: (id: string): string => {
    return `products:detail:${id}`
  },

  /**
   * Pattern to delete all product cache entries
   */
  productsPattern: (): string => {
    return 'products:*'
  },

  /**
   * Key for category list
   * Format: categories:list:{exclude}
   */
  categoriesList: (exclude?: string): string => {
    return `categories:list:${exclude || ''}`
  },

  /**
   * Pattern to delete all category cache entries
   */
  categoriesPattern: (): string => {
    return 'categories:*'
  },
}

// TTL constants (seconds)
export const CacheTTL = {
  PRODUCTS_LIST: 5 * 60,    // 5 minutes
  PRODUCT_DETAIL: 10 * 60,  // 10 minutes
  CATEGORIES_LIST: 30 * 60, // 30 minutes
}

export default cacheService
