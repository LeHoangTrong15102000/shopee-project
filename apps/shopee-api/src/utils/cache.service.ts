/**
 * Backward-compatibility re-export.
 *
 * All existing imports of the form:
 *   import { cacheService, CacheKeys, CacheTTL } from '@utils/cache.service'
 *   import cacheService from '@utils/cache.service'
 *
 * continue to work without any changes in consumer files.
 *
 * The actual implementation lives in @utils/cache/index.ts.
 */
export { cacheService, CacheKeys, CacheTTL, ICacheService, MemoryCacheService, RedisCacheService } from './cache/index'
export { default } from './cache/index'
