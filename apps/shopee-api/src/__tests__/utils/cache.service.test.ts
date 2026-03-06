/// <reference types="jest" />

jest.useFakeTimers()

import { cacheService, CacheKeys, CacheTTL } from '../../utils/cache.service'

describe('CacheService', () => {
  beforeEach(() => {
    cacheService.flush()
  })

  afterAll(() => {
    cacheService.destroy()
    jest.useRealTimers()
  })

  describe('get/set', () => {
    it('should store and retrieve values', () => {
      const testData = { id: 1, name: 'test' }
      cacheService.set('test-key', testData)

      const result = cacheService.get('test-key')
      expect(result).toEqual(testData)
    })

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('should use default TTL of 300 seconds', () => {
      cacheService.set('default-ttl-key', 'value')

      jest.advanceTimersByTime(299 * 1000)
      expect(cacheService.get('default-ttl-key')).toBe('value')

      jest.advanceTimersByTime(2 * 1000)
      expect(cacheService.get('default-ttl-key')).toBeNull()
    })

    it('should support custom TTL', () => {
      cacheService.set('custom-ttl-key', 'value', 10)

      jest.advanceTimersByTime(9 * 1000)
      expect(cacheService.get('custom-ttl-key')).toBe('value')

      jest.advanceTimersByTime(2 * 1000)
      expect(cacheService.get('custom-ttl-key')).toBeNull()
    })
  })

  describe('TTL expiration', () => {
    it('should return null and delete entry after TTL expires', () => {
      cacheService.set('expire-key', 'value', 5)

      expect(cacheService.get('expire-key')).toBe('value')
      expect(cacheService.size()).toBe(1)

      jest.advanceTimersByTime(6 * 1000)

      expect(cacheService.get('expire-key')).toBeNull()
      expect(cacheService.size()).toBe(0)
    })
  })

  describe('del', () => {
    it('should delete by exact key and return 1', () => {
      cacheService.set('key-to-delete', 'value')

      const result = cacheService.del('key-to-delete')

      expect(result).toBe(1)
      expect(cacheService.get('key-to-delete')).toBeNull()
    })

    it('should return 0 when deleting non-existent key', () => {
      const result = cacheService.del('non-existent')
      expect(result).toBe(0)
    })

    it('should delete by wildcard pattern', () => {
      cacheService.set('products:list:1', 'list1')
      cacheService.set('products:list:2', 'list2')
      cacheService.set('products:detail:abc', 'detail')
      cacheService.set('categories:list', 'categories')

      const result = cacheService.del('products:*')

      expect(result).toBe(3)
      expect(cacheService.get('products:list:1')).toBeNull()
      expect(cacheService.get('products:list:2')).toBeNull()
      expect(cacheService.get('products:detail:abc')).toBeNull()
      expect(cacheService.get('categories:list')).toBe('categories')
    })

    it('should return count of deleted entries', () => {
      cacheService.set('test:a', 'a')
      cacheService.set('test:b', 'b')
      cacheService.set('other:c', 'c')

      const result = cacheService.del('test:*')
      expect(result).toBe(2)
    })
  })

  describe('flush', () => {
    it('should clear all entries', () => {
      cacheService.set('key1', 'value1')
      cacheService.set('key2', 'value2')
      cacheService.set('key3', 'value3')

      cacheService.flush()

      expect(cacheService.get('key1')).toBeNull()
      expect(cacheService.get('key2')).toBeNull()
      expect(cacheService.get('key3')).toBeNull()
    })

    it('should make size become 0', () => {
      cacheService.set('key1', 'value1')
      cacheService.set('key2', 'value2')
      expect(cacheService.size()).toBe(2)

      cacheService.flush()

      expect(cacheService.size()).toBe(0)
    })
  })

  describe('size', () => {
    it('should return correct count', () => {
      expect(cacheService.size()).toBe(0)

      cacheService.set('key1', 'value1')
      expect(cacheService.size()).toBe(1)

      cacheService.set('key2', 'value2')
      expect(cacheService.size()).toBe(2)

      cacheService.del('key1')
      expect(cacheService.size()).toBe(1)
    })
  })
})

describe('CacheKeys', () => {
  describe('productsList', () => {
    it('should generate correct key format with all params', () => {
      const key = CacheKeys.productsList({
        page: 2,
        limit: 20,
        category: 'electronics',
        sort_by: 'price',
        order: 'asc',
        rating_filter: '4',
        price_min: '100',
        price_max: '500',
        name: 'phone'
      })

      expect(key).toBe('products:list:2:20:electronics:price:asc:4:100:500:phone')
    })

    it('should use default values for missing params', () => {
      const key = CacheKeys.productsList({})

      expect(key).toBe('products:list:1:30:::::::')
    })

    it('should handle partial params', () => {
      const key = CacheKeys.productsList({
        page: 3,
        category: 'books'
      })

      expect(key).toBe('products:list:3:30:books::::::')
    })
  })

  describe('productDetail', () => {
    it('should generate correct key', () => {
      const key = CacheKeys.productDetail('abc123')
      expect(key).toBe('products:detail:abc123')
    })
  })

  describe('productsPattern', () => {
    it('should return products:*', () => {
      const pattern = CacheKeys.productsPattern()
      expect(pattern).toBe('products:*')
    })
  })

  describe('categoriesList', () => {
    it('should generate correct key without exclude', () => {
      const key = CacheKeys.categoriesList()
      expect(key).toBe('categories:list:')
    })

    it('should generate correct key with exclude', () => {
      const key = CacheKeys.categoriesList('cat123')
      expect(key).toBe('categories:list:cat123')
    })
  })

  describe('categoriesPattern', () => {
    it('should return categories:*', () => {
      const pattern = CacheKeys.categoriesPattern()
      expect(pattern).toBe('categories:*')
    })
  })
})

describe('CacheTTL', () => {
  it('should have correct PRODUCTS_LIST value', () => {
    expect(CacheTTL.PRODUCTS_LIST).toBe(300)
  })

  it('should have correct PRODUCT_DETAIL value', () => {
    expect(CacheTTL.PRODUCT_DETAIL).toBe(600)
  })

  it('should have correct CATEGORIES_LIST value', () => {
    expect(CacheTTL.CATEGORIES_LIST).toBe(1800)
  })
})

