/**
 * Cache service interface.
 *
 * ICacheService — the public contract every cache driver must implement.
 * Implementations: MemoryCacheService, RedisCacheService.
 */

export interface ICacheService {
  /**
   * Retrieve a value from cache.
   * Returns null on miss, expired entry, or driver error.
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Store a value in cache with a TTL (seconds).
   * Default TTL is 300 seconds (5 minutes).
   */
  set<T>(key: string, data: T, ttlSeconds?: number): Promise<void>

  /**
   * Delete one or more cache entries.
   * Supports wildcard patterns (e.g. "products:*") where the driver supports it.
   * Returns the number of keys deleted.
   */
  del(pattern: string): Promise<number>

  /**
   * Delete all cache entries managed by this service.
   */
  flush(): Promise<void>

  /**
   * Check whether a key exists and has not expired.
   */
  has(key: string): Promise<boolean>

  /**
   * No-op for drivers that handle cleanup automatically (Redis TTL).
   * MemoryCacheService uses lazy cleanup on get(); this method is kept
   * for interface compatibility.
   */
  cleanup(): void
}
