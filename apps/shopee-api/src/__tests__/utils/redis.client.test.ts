/// <reference types="jest" />

jest.mock('ioredis')
jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiWarn: jest.fn(),
    apiError: jest.fn(),
  },
}))

describe('redis.client', () => {
  describe('in test environment (NODE_ENV=test)', () => {
    it('exports null as redisClient', () => {
      // NODE_ENV is set to "test" by Jest — the module should return null
      jest.resetModules()
      const { redisClient } = require('../../utils/redis.client')
      expect(redisClient).toBeNull()
    })

    it('disconnectRedis resolves without error when client is null', async () => {
      jest.resetModules()
      const { disconnectRedis } = require('../../utils/redis.client')
      await expect(disconnectRedis()).resolves.toBeUndefined()
    })
  })

  describe('when no Redis configuration is present', () => {
    it('exports null when REDIS_URL and REDIS_HOST are both absent', () => {
      jest.resetModules()

      const originalNodeEnv = process.env.NODE_ENV
      const originalRedisUrl = process.env.REDIS_URL
      const originalRedisHost = process.env.REDIS_HOST

      // Temporarily simulate non-test env with no Redis config
      process.env.NODE_ENV = 'production'
      delete process.env.REDIS_URL
      delete process.env.REDIS_HOST

      const { redisClient } = require('../../utils/redis.client')
      expect(redisClient).toBeNull()

      // Restore env
      process.env.NODE_ENV = originalNodeEnv
      if (originalRedisUrl !== undefined) process.env.REDIS_URL = originalRedisUrl
      if (originalRedisHost !== undefined) process.env.REDIS_HOST = originalRedisHost
    })
  })

  describe('when REDIS_URL is configured (non-test env)', () => {
    it('creates a Redis client using REDIS_URL', () => {
      jest.resetModules()

      const Redis = require('ioredis')
      const mockRedisInstance = {
        on: jest.fn(),
        quit: jest.fn().mockResolvedValue('OK'),
      }
      Redis.mockImplementation(() => mockRedisInstance)

      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      process.env.REDIS_URL = 'redis://localhost:6379'

      const { redisClient } = require('../../utils/redis.client')
      expect(redisClient).not.toBeNull()

      // Restore env
      process.env.NODE_ENV = originalNodeEnv
      delete process.env.REDIS_URL
    })

    it('registers connect, error, and close event handlers', () => {
      jest.resetModules()

      const Redis = require('ioredis')
      const eventHandlers: Record<string, Function> = {}
      const mockRedisInstance = {
        on: jest.fn((event: string, handler: Function) => {
          eventHandlers[event] = handler
        }),
        quit: jest.fn().mockResolvedValue('OK'),
      }
      Redis.mockImplementation(() => mockRedisInstance)

      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      process.env.REDIS_URL = 'redis://localhost:6379'

      require('../../utils/redis.client')

      expect(mockRedisInstance.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockRedisInstance.on).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockRedisInstance.on).toHaveBeenCalledWith('close', expect.any(Function))

      // Restore env
      process.env.NODE_ENV = originalNodeEnv
      delete process.env.REDIS_URL
    })

    it('error event handler does not throw unhandled exceptions', () => {
      jest.resetModules()

      const Redis = require('ioredis')
      const eventHandlers: Record<string, Function> = {}
      const mockRedisInstance = {
        on: jest.fn((event: string, handler: Function) => {
          eventHandlers[event] = handler
        }),
        quit: jest.fn().mockResolvedValue('OK'),
      }
      Redis.mockImplementation(() => mockRedisInstance)

      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      process.env.REDIS_URL = 'redis://localhost:6379'

      require('../../utils/redis.client')

      // Invoking the error handler should not throw — it logs via Logger.apiError
      expect(() => {
        eventHandlers['error'](new Error('Connection refused'))
      }).not.toThrow()

      // Restore env
      process.env.NODE_ENV = originalNodeEnv
      delete process.env.REDIS_URL
    })

    it('connect event handler does not throw', () => {
      jest.resetModules()

      const Redis = require('ioredis')
      const eventHandlers: Record<string, Function> = {}
      const mockRedisInstance = {
        on: jest.fn((event: string, handler: Function) => {
          eventHandlers[event] = handler
        }),
        quit: jest.fn().mockResolvedValue('OK'),
      }
      Redis.mockImplementation(() => mockRedisInstance)

      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      process.env.REDIS_URL = 'redis://localhost:6379'

      require('../../utils/redis.client')

      expect(() => {
        eventHandlers['connect']()
      }).not.toThrow()

      // Restore env
      process.env.NODE_ENV = originalNodeEnv
      delete process.env.REDIS_URL
    })

    it('close event handler does not throw', () => {
      jest.resetModules()

      const Redis = require('ioredis')
      const eventHandlers: Record<string, Function> = {}
      const mockRedisInstance = {
        on: jest.fn((event: string, handler: Function) => {
          eventHandlers[event] = handler
        }),
        quit: jest.fn().mockResolvedValue('OK'),
      }
      Redis.mockImplementation(() => mockRedisInstance)

      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      process.env.REDIS_URL = 'redis://localhost:6379'

      require('../../utils/redis.client')

      expect(() => {
        eventHandlers['close']()
      }).not.toThrow()

      // Restore env
      process.env.NODE_ENV = originalNodeEnv
      delete process.env.REDIS_URL
    })
  })
})
