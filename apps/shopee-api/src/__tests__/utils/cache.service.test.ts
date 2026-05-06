/// <reference types="jest" />

/**
 * Tests for the async MemoryCacheService.
 *
 * Uses jest.useFakeTimers() for TTL expiry tests.
 * All cache operations are async (return Promises).
 */

jest.useFakeTimers()

import { MemoryCacheService } from '@utils/cache/memory-cache.service'
import { CacheKeys, CacheTTL } from '@utils/cache'

describe('MemoryCacheService', () => {
  let cache: MemoryCacheService

  beforeEach(() => {
    cache = new MemoryCacheService()
  })

  afterEach(() => {
    cache.destroy()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('get / set', () => {
    it('stores and retrieves a value', async () => {
      const data = { id: 1, name: 'test' }
      await cache.set('key1', data)
      const result = await cache.get<typeof data>('key1')
      expect(result).toEqual(data)
    })

    it('returns null for a non-existent key', async () => {
      const result = await cache.get('missing-key')
      expect(result).toBeNull()
    })

    it('stores string values', async () => {
      await cache.set('str-key', 'hello')
      expect(await cache.get('str-key')).toBe('hello')
    })

    it('stores number values', async () => {
      await cache.set('num-key', 42)
      expect(await cache.get('num-key')).toBe(42)
    })

    it('stores array values', async () => {
      await cache.set('arr-key', [1, 2, 3])
      expect(await cache.get('arr-key')).toEqual([1, 2, 3])
    })
  })

  describe('TTL', () => {
    it('uses default TTL of 300 seconds', async () => {
      await cache.set('default-ttl', 'value')

      jest.advanceTimersByTime(299 * 1000)
      expect(await cache.get('default-ttl')).toBe('value')

      jest.advanceTimersByTime(2 * 1000)
      expect(await cache.get('default-ttl')).toBeNull()
    })

    it('supports custom TTL', async () => {
      await cache.set('custom-ttl', 'value', 10)

      jest.advanceTimersByTime(9 * 1000)
      expect(await cache.get('custom-ttl')).toBe('value')

      jest.advanceTimersByTime(2 * 1000)
      expect(await cache.get('custom-ttl')).toBeNull()
    })

    it('lazy TTL eviction on get() — returns null after expiry', async () => {
      await cache.set('expire-key', 'value', 5)

      expect(await cache.get('expire-key')).toBe('value')

      jest.advanceTimersByTime(6 * 1000)

      expect(await cache.get('expire-key')).toBeNull()
    })

    it('lazy TTL eviction on has() — returns false after expiry', async () => {
      await cache.set('expire-has', 'value', 5)

      expect(await cache.has('expire-has')).toBe(true)

      jest.advanceTimersByTime(6 * 1000)

      expect(await cache.has('expire-has')).toBe(false)
    })
  })

  describe('del', () => {
    it('deletes by exact key and returns 1', async () => {
      await cache.set('key-to-delete', 'value')
      const result = await cache.del('key-to-delete')
      expect(result).toBe(1)
      expect(await cache.get('key-to-delete')).toBeNull()
    })

    it('returns 0 for non-existent key', async () => {
      const result = await cache.del('non-existent')
      expect(result).toBe(0)
    })

    it('deletes with wildcard pattern', async () => {
      await cache.set('products:list:1', 'list1')
      await cache.set('products:list:2', 'list2')
      await cache.set('products:detail:abc', 'detail')
      await cache.set('categories:list', 'categories')

      const result = await cache.del('products:*')

      expect(result).toBe(3)
      expect(await cache.get('products:list:1')).toBeNull()
      expect(await cache.get('products:list:2')).toBeNull()
      expect(await cache.get('products:detail:abc')).toBeNull()
      expect(await cache.get('categories:list')).toBe('categories')
    })

    it('returns count of deleted entries for wildcard', async () => {
      await cache.set('test:a', 'a')
      await cache.set('test:b', 'b')
      await cache.set('other:c', 'c')

      const result = await cache.del('test:*')
      expect(result).toBe(2)
    })

    it('returns 0 for wildcard that matches nothing', async () => {
      const result = await cache.del('no-match:*')
      expect(result).toBe(0)
    })
  })

  describe('flush', () => {
    it('clears all entries', async () => {
      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')
      await cache.set('key3', 'value3')

      await cache.flush()

      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBeNull()
      expect(await cache.get('key3')).toBeNull()
    })
  })

  describe('has', () => {
    it('returns true for an existing key', async () => {
      await cache.set('existing', 'value')
      expect(await cache.has('existing')).toBe(true)
    })

    it('returns false for a non-existent key', async () => {
      expect(await cache.has('missing')).toBe(false)
    })

    it('returns false for an expired key', async () => {
      await cache.set('expiring', 'value', 5)
      jest.advanceTimersByTime(6 * 1000)
      expect(await cache.has('expiring')).toBe(false)
    })
  })

  describe('destroy', () => {
    it('clears all entries', async () => {
      await cache.set('key1', 'v1')
      await cache.set('key2', 'v2')
      cache.destroy()
      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBeNull()
    })
  })

  describe('no setInterval', () => {
    it('does not use setInterval (no timer leaks)', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval')
      const freshCache = new MemoryCacheService()
      expect(setIntervalSpy).not.toHaveBeenCalled()
      freshCache.destroy()
      setIntervalSpy.mockRestore()
    })
  })
})

describe('CacheKeys', () => {
  describe('productsList', () => {
    it('generates correct key with all params', () => {
      const key = CacheKeys.productsList({
        page: 2,
        limit: 20,
        category: 'electronics',
        sort_by: 'price',
        order: 'asc',
        rating_filter: '4',
        price_min: '100',
        price_max: '500',
        name: 'phone',
      })
      expect(key).toBe('products:list:2:20:electronics:price:asc:4:100:500:phone')
    })

    it('uses default values for missing params', () => {
      const key = CacheKeys.productsList({})
      expect(key).toBe('products:list:1:30:::::::')
    })

    it('handles partial params', () => {
      const key = CacheKeys.productsList({ page: 3, category: 'books' })
      expect(key).toBe('products:list:3:30:books::::::')
    })
  })

  describe('productDetail', () => {
    it('generates correct key', () => {
      expect(CacheKeys.productDetail('abc123')).toBe('products:detail:abc123')
    })
  })

  describe('productsPattern', () => {
    it('returns products:*', () => {
      expect(CacheKeys.productsPattern()).toBe('products:*')
    })
  })

  describe('categoriesList', () => {
    it('generates correct key without exclude', () => {
      expect(CacheKeys.categoriesList()).toBe('categories:list:')
    })

    it('generates correct key with exclude', () => {
      expect(CacheKeys.categoriesList('cat123')).toBe('categories:list:cat123')
    })
  })

  describe('categoriesPattern', () => {
    it('returns categories:*', () => {
      expect(CacheKeys.categoriesPattern()).toBe('categories:*')
    })
  })
})

describe('CacheTTL', () => {
  it('PRODUCTS_LIST is 300 seconds (5 minutes)', () => {
    expect(CacheTTL.PRODUCTS_LIST).toBe(300)
  })

  it('PRODUCT_DETAIL is 600 seconds (10 minutes)', () => {
    expect(CacheTTL.PRODUCT_DETAIL).toBe(600)
  })

  it('CATEGORIES_LIST is 1800 seconds (30 minutes)', () => {
    expect(CacheTTL.CATEGORIES_LIST).toBe(1800)
  })
})
