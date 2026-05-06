import { ICacheService } from './types'

interface CacheEntry<T> {
  value: T
  expiresAt: number // Unix timestamp in ms; 0 = no expiry
}

/**
 * In-memory cache service backed by a Map.
 *
 * - No setInterval — expired entries are evicted lazily on get() and has().
 * - Suitable for test environments and single-process deployments.
 * - Call destroy() in tests to clear all entries and avoid state leakage.
 */
export class MemoryCacheService implements ICacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    // Lazy TTL check — evict if expired
    if (entry.expiresAt !== 0 && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value as T
  }

  async set<T>(key: string, data: T, ttlSeconds = 300): Promise<void> {
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0
    this.store.set(key, { value: data, expiresAt })
  }

  async del(pattern: string): Promise<number> {
    if (pattern.includes('*')) {
      return this._wildcardDel(pattern)
    }
    return this.store.delete(pattern) ? 1 : 0
  }

  async flush(): Promise<void> {
    this.store.clear()
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key)
    if (!entry) return false

    if (entry.expiresAt !== 0 && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return false
    }

    return true
  }

  /**
   * No-op — lazy cleanup handles expiry.
   * Kept for ICacheService compatibility.
   */
  cleanup(): void {
    // intentional no-op
  }

  /**
   * Clear all entries and release memory.
   * Call this in test teardown to prevent state leakage between tests.
   */
  destroy(): void {
    this.store.clear()
  }

  // ---- private helpers ----

  private _wildcardDel(pattern: string): number {
    // Convert glob-style wildcard to a regex
    const regexStr = '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
    const regex = new RegExp(regexStr)
    let deleted = 0
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key)
        deleted++
      }
    }
    return deleted
  }
}
