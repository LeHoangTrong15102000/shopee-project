/// <reference types="jest" />

/**
 * Unit Tests for database.ts
 * Tests for checkDatabaseHealth, isDatabaseReady, getConnectionPoolStats, isValidId, startSession
 */

// Unmock the database module so we can test the actual implementation
// (The global setup.ts mocks @database/database, so we must override it here)
jest.unmock('@database/database')

jest.mock('dotenv', () => ({ config: jest.fn() }))
jest.mock('chalk', () => {
  const fn = (s: string) => s
  return {
    __esModule: true,
    default: Object.assign(fn, {
      bold: Object.assign(fn, { cyan: fn, yellow: fn, red: fn, magenta: fn, blue: fn }),
    }),
  }
})
jest.mock('@utils/logger', () => ({
  Logger: { dbInfo: jest.fn(), dbError: jest.fn(), dbWarn: jest.fn() },
}))
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    readyState: 1,
    host: 'cluster0.example.net',
    db: { admin: jest.fn(() => ({ ping: jest.fn().mockResolvedValue({}) })) },
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  },
  startSession: jest.fn().mockResolvedValue({}),
  Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
}))

import mongoose from 'mongoose'
import {
  checkDatabaseHealth,
  isDatabaseReady,
  getConnectionPoolStats,
  isValidId,
  startSession,
  connectMongoDB,
  gracefulShutdown,
  DB_CONFIG,
} from '@database/database'

const conn = mongoose.connection as any

describe('database.ts', () => {
  const mockPing = jest.fn().mockResolvedValue({})

  beforeEach(() => {
    jest.clearAllMocks()
    conn.readyState = 1
    conn.host = 'cluster0.example.net'
    conn.db = { admin: jest.fn(() => ({ ping: mockPing })) }
    mockPing.mockResolvedValue({})
    ;(mongoose.connect as jest.Mock).mockResolvedValue({})
    conn.close.mockResolvedValue(undefined)
    ;(mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true)
    ;(mongoose.startSession as jest.Mock).mockResolvedValue({})
  })

  // ─── DB_CONFIG ─────────────────────────────────────────────────────────────

  describe('DB_CONFIG', () => {
    it('should have maxRetries of 5', () => {
      expect(DB_CONFIG.maxRetries).toBe(5)
    })

    it('should have poolSize of 10', () => {
      expect(DB_CONFIG.poolSize).toBe(10)
    })

    it('should have retryDelayMs of 5000', () => {
      expect(DB_CONFIG.retryDelayMs).toBe(5000)
    })

    it('should have socketTimeoutMs defined', () => {
      expect(DB_CONFIG.socketTimeoutMs).toBeDefined()
    })
  })

  // ─── isValidId ──────────────────────────────────────────────────────────────

  describe('isValidId', () => {
    it('should return true for a valid ObjectId', () => {
      ;(mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true)
      expect(isValidId('507f1f77bcf86cd799439011')).toBe(true)
    })

    it('should return false for an invalid string', () => {
      ;(mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false)
      expect(isValidId('bad-id')).toBe(false)
    })
  })

  // ─── startSession ──────────────────────────────────────────────────────────

  describe('startSession', () => {
    it('should call mongoose.startSession', () => {
      const session = { startTransaction: jest.fn() }
      ;(mongoose.startSession as jest.Mock).mockReturnValue(session)
      const result = startSession()
      expect(mongoose.startSession).toHaveBeenCalled()
      expect(result).toBe(session)
    })
  })

  // ─── isDatabaseReady ────────────────────────────────────────────────────────

  describe('isDatabaseReady', () => {
    it('should return true when readyState is 1', () => {
      conn.readyState = 1
      expect(isDatabaseReady()).toBe(true)
    })

    it('should return false when readyState is 0', () => {
      conn.readyState = 0
      expect(isDatabaseReady()).toBe(false)
    })

    it('should return false when readyState is 2', () => {
      conn.readyState = 2
      expect(isDatabaseReady()).toBe(false)
    })

    it('should return false when readyState is 3', () => {
      conn.readyState = 3
      expect(isDatabaseReady()).toBe(false)
    })
  })

  // ─── getConnectionPoolStats ─────────────────────────────────────────────────

  describe('getConnectionPoolStats', () => {
    it('should return poolSize, readyState and host', () => {
      conn.readyState = 1
      conn.host = 'test-host'
      const stats = getConnectionPoolStats()
      expect(stats.poolSize).toBe(10)
      expect(stats.readyState).toBe(1)
      expect(stats.host).toBe('test-host')
    })
  })

  // ─── checkDatabaseHealth ────────────────────────────────────────────────────

  describe('checkDatabaseHealth', () => {
    it('should return healthy when connected and ping succeeds', async () => {
      conn.readyState = 1
      mockPing.mockResolvedValue({})

      const result = await checkDatabaseHealth()

      expect(result.status).toBe('healthy')
      expect(result.connected).toBe(true)
      expect(result.readyState).toBe(1)
      expect(result.readyStateText).toBe('connected')
      expect(typeof result.latencyMs).toBe('number')
    })

    it('should return degraded when ping latency exceeds 1000ms', async () => {
      conn.readyState = 1
      const nowSpy = jest.spyOn(Date, 'now')
      nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1500)
      mockPing.mockResolvedValue({})

      const result = await checkDatabaseHealth()

      expect(result.status).toBe('degraded')
      expect(result.connected).toBe(true)
      nowSpy.mockRestore()
    })

    it('should return unhealthy when readyState is 0 (disconnected)', async () => {
      conn.readyState = 0

      const result = await checkDatabaseHealth()

      expect(result.status).toBe('unhealthy')
      expect(result.connected).toBe(false)
      expect(result.readyStateText).toBe('disconnected')
      expect(result.error).toContain('disconnected')
    })

    it('should return unhealthy when readyState is 2 (connecting)', async () => {
      conn.readyState = 2

      const result = await checkDatabaseHealth()

      expect(result.status).toBe('unhealthy')
      expect(result.readyStateText).toBe('connecting')
    })

    it('should return unhealthy when readyState is 3 (disconnecting)', async () => {
      conn.readyState = 3

      const result = await checkDatabaseHealth()

      expect(result.status).toBe('unhealthy')
      expect(result.readyStateText).toBe('disconnecting')
    })

    it('should return unhealthy for unknown readyState value', async () => {
      conn.readyState = 99

      const result = await checkDatabaseHealth()

      expect(result.status).toBe('unhealthy')
      expect(result.readyStateText).toBe('unknown')
    })

    it('should return unhealthy when ping throws an Error', async () => {
      conn.readyState = 1
      mockPing.mockRejectedValue(new Error('ping timeout'))

      const result = await checkDatabaseHealth()

      expect(result.status).toBe('unhealthy')
      expect(result.connected).toBe(false)
      expect(result.error).toBe('ping timeout')
    })

    it('should return "Ping failed" when ping throws a non-Error value', async () => {
      conn.readyState = 1
      mockPing.mockRejectedValue('connection reset')

      const result = await checkDatabaseHealth()

      expect(result.status).toBe('unhealthy')
      expect(result.error).toBe('Ping failed')
    })
  })

  // ─── connectMongoDB ─────────────────────────────────────────────────────────

  describe('connectMongoDB', () => {
    it('should call mongoose.connect and resolve', async () => {
      ;(mongoose.connect as jest.Mock).mockResolvedValue({})
      await expect(connectMongoDB()).resolves.toBeUndefined()
      expect(mongoose.connect).toHaveBeenCalled()
    })
  })

  // ─── gracefulShutdown ───────────────────────────────────────────────────────
  // process.exit is mocked as a no-op so it does not throw (which would
  // cascade from the try block into the catch block).
  // isShuttingDown is module-level state: after the first gracefulShutdown call
  // it is permanently true, so subsequent calls return early.

  describe('gracefulShutdown', () => {
    let exitSpy: jest.SpyInstance

    beforeEach(() => {
      exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as any)
    })

    afterEach(() => {
      exitSpy.mockRestore()
    })

    it('should close the connection and call process.exit(0) on success', async () => {
      conn.close.mockResolvedValueOnce(undefined)

      await gracefulShutdown('SIGTERM')

      expect(conn.close).toHaveBeenCalled()
      expect(exitSpy).toHaveBeenCalledWith(0)
    })

    it('should be idempotent — second call returns without action (isShuttingDown guard)', async () => {
      // After the first test sets isShuttingDown = true, subsequent calls return immediately.
      await gracefulShutdown('SIGINT')

      // conn.close and process.exit should NOT be called again
      expect(conn.close).not.toHaveBeenCalled()
      expect(exitSpy).not.toHaveBeenCalled()
    })
  })
})
