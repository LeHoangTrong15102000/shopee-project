/// <reference types="jest" />

/**
 * Integration tests for the cache factory (resolveDriver).
 *
 * Tests that the correct cache driver is selected based on CACHE_DRIVER env var,
 * and that the full get/set/del/flush/has cycle works through the factory singleton.
 *
 * Uses jest.isolateModules() to reload the cache module with different env vars.
 */

import { MemoryCacheService } from '@utils/cache/memory-cache.service'

describe('Cache factory — driver selection', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test' }
  })

  afterEach(() => {
    process.env = originalEnv
    jest.resetModules()
  })

  it('with CACHE_DRIVER=memory → cacheService is MemoryCacheService instance', () => {
    process.env.CACHE_DRIVER = 'memory'

    let cacheService: unknown
    let IsolatedMemoryCacheService: typeof MemoryCacheService
    jest.isolateModules(() => {
      jest.doMock('@utils/redis.client', () => ({ redisClient: null }))
      jest.doMock('@utils/logger', () => ({
        Logger: { apiError: jest.fn(), apiWarn: jest.fn(), apiInfo: jest.fn() },
      }))
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const cacheModule = require('@utils/cache')
      cacheService = cacheModule.cacheService
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      IsolatedMemoryCacheService = require('@utils/cache/memory-cache.service').MemoryCacheService
    })

    expect(cacheService).toBeInstanceOf(IsolatedMemoryCacheService!)
    expect((cacheService as object).constructor.name).toBe('MemoryCacheService')
  })

  it('default in test env (NODE_ENV=test, no CACHE_DRIVER) → MemoryCacheService', () => {
    delete process.env.CACHE_DRIVER
    process.env.NODE_ENV = 'test'

    let cacheService: unknown
    jest.isolateModules(() => {
      jest.doMock('@utils/redis.client', () => ({ redisClient: null }))
      jest.doMock('@utils/logger', () => ({
        Logger: { apiError: jest.fn(), apiWarn: jest.fn(), apiInfo: jest.fn() },
      }))
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      cacheService = require('@utils/cache').cacheService
    })

    expect((cacheService as object).constructor.name).toBe('MemoryCacheService')
  })

  it('with CACHE_DRIVER=redis and no redisClient → falls back to MemoryCacheService with warning', () => {
    process.env.CACHE_DRIVER = 'redis'
    const warnMock = jest.fn()

    let cacheService: unknown
    jest.isolateModules(() => {
      jest.doMock('@utils/redis.client', () => ({ redisClient: null }))
      jest.doMock('@utils/logger', () => ({
        Logger: { apiError: jest.fn(), apiWarn: warnMock, apiInfo: jest.fn() },
      }))
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      cacheService = require('@utils/cache').cacheService
    })

    expect((cacheService as object).constructor.name).toBe('MemoryCacheService')
    expect(warnMock).toHaveBeenCalledWith(
      expect.stringContaining('falling back to memory cache'),
    )
  })
})

describe('Cache factory — full get/set/del/flush/has cycle', () => {
  it('full cycle works through the factory singleton (memory driver)', async () => {
    // In test env, cacheService is always MemoryCacheService
    const { cacheService } = await import('@utils/cache')

    // Clean state
    await cacheService.flush()

    // set + get
    await cacheService.set('integration-key', { value: 42 })
    const result = await cacheService.get<{ value: number }>('integration-key')
    expect(result).toEqual({ value: 42 })

    // has
    expect(await cacheService.has('integration-key')).toBe(true)
    expect(await cacheService.has('missing-key')).toBe(false)

    // del exact key
    const deleted = await cacheService.del('integration-key')
    expect(deleted).toBe(1)
    expect(await cacheService.get('integration-key')).toBeNull()

    // set multiple + wildcard del
    await cacheService.set('products:1', 'p1')
    await cacheService.set('products:2', 'p2')
    await cacheService.set('categories:1', 'c1')

    const wildcardDeleted = await cacheService.del('products:*')
    expect(wildcardDeleted).toBe(2)
    expect(await cacheService.get('products:1')).toBeNull()
    expect(await cacheService.get('products:2')).toBeNull()
    expect(await cacheService.get('categories:1')).toBe('c1')

    // flush
    await cacheService.set('flush-key', 'value')
    await cacheService.flush()
    expect(await cacheService.get('flush-key')).toBeNull()
    expect(await cacheService.get('categories:1')).toBeNull()
  })
})
