/**
 * Cache module entry point.
 *
 * Selects the cache driver based on the CACHE_DRIVER environment variable:
 *   CACHE_DRIVER=memory  — MemoryCacheService (Map-based, no Redis required)
 *   CACHE_DRIVER=redis   — RedisCacheService  (Redis-backed)
 *
 * Defaults:
 *   - "memory" in test environments (NODE_ENV=test)
 *   - "redis" otherwise
 *
 * Falls back to memory if Redis is unavailable (with a warning log).
 *
 * Backward compatibility:
 *   All existing imports of the form:
 *     import { cacheService, CacheKeys, CacheTTL } from '@utils/cache.service'
 *   continue to work via the re-export shim in cache.service.ts.
 */

import { Logger } from '@utils/logger'
import { ICacheService } from './types'
import { MemoryCacheService } from './memory-cache.service'
import { RedisCacheService } from './redis-cache.service'
import { redisClient } from '@utils/redis.client'

function resolveDriver(): ICacheService {
  const isTest = process.env.NODE_ENV === 'test'
  const raw = process.env.CACHE_DRIVER ?? (isTest ? 'memory' : 'redis')
  const driver = raw as string

  if (driver === 'memory') {
    return new MemoryCacheService()
  }

  if (driver !== 'redis') {
    Logger.apiWarn(`Invalid CACHE_DRIVER="${driver}", falling back to memory cache`)
    return new MemoryCacheService()
  }

  // Redis driver — fall back to memory if client is unavailable
  if (!redisClient) {
    Logger.apiWarn(
      'CACHE_DRIVER=redis but Redis client is unavailable — falling back to memory cache',
    )
    return new MemoryCacheService()
  }

  return new RedisCacheService()
}

// Singleton instance — driver selected once at module load
export const cacheService: ICacheService = resolveDriver()

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
  PRODUCTS_LIST: 5 * 60, // 5 minutes
  PRODUCT_DETAIL: 10 * 60, // 10 minutes
  CATEGORIES_LIST: 30 * 60, // 30 minutes
}

// Re-export types and implementations for consumers that need them directly
export { ICacheService } from './types'
export { MemoryCacheService } from './memory-cache.service'
export { RedisCacheService } from './redis-cache.service'

export default cacheService
