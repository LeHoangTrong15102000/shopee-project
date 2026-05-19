/// <reference types="jest" />

/**
 * Unit Tests for AuditLogService
 * Tests: log entry structure, fire-and-forget error handling
 *
 * Also tests withAuditLog HOF wrapper:
 * - diff computation via deep-diff
 * - before/after snapshot capture
 * - failed operations log with status:failed
 */

// ─── AuditLogService tests ────────────────────────────────────────────────────

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiWarn: jest.fn(),
    apiError: jest.fn(),
  },
}))

import { AuditLogService } from '@services/audit-log.service'
import { IAuditLogRepository } from '@repositories/interfaces/audit-log.repository.interface'
import { AuditLogStatus } from '@database/models/audit-log.model'
import { Logger } from '@utils/logger'

describe('AuditLogService', () => {
  let service: AuditLogService
  let mockRepo: jest.Mocked<IAuditLogRepository>

  const baseEntry = {
    action: 'product.update',
    resource: 'product',
    resourceId: 'prod123',
    actor: { userId: 'user456', roles: ['Admin'] },
    ip: '127.0.0.1',
    userAgent: 'TestAgent/1.0',
    status: 'success' as AuditLogStatus,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRepo = {
      create: jest.fn().mockResolvedValue({}),
      findPaginated: jest.fn(),
      findById: jest.fn(),
    } as jest.Mocked<IAuditLogRepository>

    service = new AuditLogService(mockRepo)
  })

  describe('writeLog', () => {
    it('calls repository.create with correct fields', async () => {
      service.writeLog(baseEntry)

      // Allow the async fire-and-forget to settle
      await new Promise((r) => setImmediate(r))

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'product.update',
          resource: 'product',
          resourceId: 'prod123',
          actor: { userId: 'user456', roles: ['Admin'] },
          ip: '127.0.0.1',
          userAgent: 'TestAgent/1.0',
          status: 'success',
          timestamp: expect.any(Date),
        }),
      )
    })

    it('sets null for optional fields when not provided', async () => {
      service.writeLog({ ...baseEntry, before: undefined, after: undefined, diff: undefined })

      await new Promise((r) => setImmediate(r))

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          before: null,
          after: null,
          diff: null,
          errorMessage: null,
        }),
      )
    })

    it('is fire-and-forget — does not throw when repository fails', async () => {
      mockRepo.create.mockRejectedValue(new Error('DB connection lost'))

      // writeLog is synchronous and must not throw
      expect(() => service.writeLog(baseEntry)).not.toThrow()

      await new Promise((r) => setImmediate(r))

      // Error should be swallowed and logged as a warning
      expect(Logger.apiWarn).toHaveBeenCalledWith(
        'audit_log.write.failed',
        expect.objectContaining({ error: 'DB connection lost' }),
      )
    })

    it('stores before/after/diff when provided', async () => {
      const before = { name: 'Old Name', price: 100 }
      const after = { name: 'New Name', price: 100 }
      const diff = [{ kind: 'E', path: ['name'], lhs: 'Old Name', rhs: 'New Name' }]

      service.writeLog({ ...baseEntry, before, after, diff })

      await new Promise((r) => setImmediate(r))

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ before, after, diff }),
      )
    })
  })

  describe('getLogs', () => {
    it('delegates to repository.findPaginated with correct filters', async () => {
      const mockResult = { logs: [], total: 0 }
      mockRepo.findPaginated.mockResolvedValue(mockResult)

      const filters = { action: 'product.update', page: 1, limit: 20 }
      const result = await service.getLogs(filters)

      expect(mockRepo.findPaginated).toHaveBeenCalledWith(filters)
      expect(result).toBe(mockResult)
    })
  })

  describe('getLogById', () => {
    it('delegates to repository.findById', async () => {
      const mockLog = { _id: 'log123', action: 'product.update' } as any
      mockRepo.findById.mockResolvedValue(mockLog)

      const result = await service.getLogById('log123')

      expect(mockRepo.findById).toHaveBeenCalledWith('log123')
      expect(result).toBe(mockLog)
    })

    it('returns null when log is not found', async () => {
      mockRepo.findById.mockResolvedValue(null)

      const result = await service.getLogById('nonexistent')

      expect(result).toBeNull()
    })
  })
})

// ─── withAuditLog HOF tests ───────────────────────────────────────────────────

describe('withAuditLog HOF', () => {
  // Mock the container import used inside withAuditLog
  const mockWriteLog = jest.fn()

  jest.mock('../../container', () => ({
    auditLogService: { writeLog: mockWriteLog },
  }))

  // deep-diff is used for real (no mock) to verify diff computation
  const { withAuditLog } = require('@utils/audit-log.wrapper')

  const makeReq = (overrides: Record<string, unknown> = {}) =>
    ({
      headers: { 'user-agent': 'TestAgent/1.0' },
      ip: '10.0.0.1',
      params: { id: 'res123' },
      jwtDecoded: { id: 'admin1', roles: ['Admin'] },
      socket: {},
      ...overrides,
    }) as any

  const makeRes = () => ({} as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls writeLog with status:success after handler succeeds', async () => {
    const handler = jest.fn().mockResolvedValue({ data: { _id: 'new123' } })
    const wrapped = withAuditLog(handler, {
      action: 'product.create',
      resource: 'product',
      getResourceId: (_req: any, result: any) => result?.data?._id ?? null,
    })

    await wrapped(makeReq(), makeRes())

    await new Promise((r) => setImmediate(r))

    expect(mockWriteLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'product.create',
        resource: 'product',
        status: 'success',
        resourceId: 'new123',
        actor: { userId: 'admin1', roles: ['Admin'] },
      }),
    )
  })

  it('calls writeLog with status:failed when handler throws', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Not found'))
    const wrapped = withAuditLog(handler, {
      action: 'product.delete',
      resource: 'product',
      getResourceId: (req: any) => req.params.id,
    })

    await expect(wrapped(makeReq(), makeRes())).rejects.toThrow('Not found')

    await new Promise((r) => setImmediate(r))

    expect(mockWriteLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'product.delete',
        resource: 'product',
        status: 'failed',
        errorMessage: 'Not found',
      }),
    )
  })

  it('computes diff between before and after snapshots', async () => {
    const before = { name: 'Old Name', price: 100 }
    const after = { name: 'New Name', price: 100 }

    const handler = jest.fn().mockResolvedValue({})
    const wrapped = withAuditLog(handler, {
      action: 'product.update',
      resource: 'product',
      getResourceId: (req: any) => req.params.id,
      getBeforeSnapshot: jest.fn().mockResolvedValue(before),
      getAfterSnapshot: jest.fn().mockResolvedValue(after),
    })

    await wrapped(makeReq(), makeRes())

    await new Promise((r) => setImmediate(r))

    const call = mockWriteLog.mock.calls[0][0]
    expect(call.before).toEqual(before)
    expect(call.after).toEqual(after)
    // diff should contain the name change
    expect(call.diff).toBeDefined()
    expect(Array.isArray(call.diff)).toBe(true)
    expect(call.diff.length).toBeGreaterThan(0)
    expect(call.diff[0]).toMatchObject({ kind: 'E', path: ['name'] })
  })

  it('strips password field from snapshots', async () => {
    const before = { name: 'User', password: 'secret123', email: 'u@example.com' }
    const after = { name: 'User', password: 'newpassword', email: 'u@example.com' }

    const handler = jest.fn().mockResolvedValue({})
    const wrapped = withAuditLog(handler, {
      action: 'user.update',
      resource: 'user',
      getResourceId: (req: any) => req.params.id,
      getBeforeSnapshot: jest.fn().mockResolvedValue(before),
      getAfterSnapshot: jest.fn().mockResolvedValue(after),
    })

    await wrapped(makeReq(), makeRes())

    await new Promise((r) => setImmediate(r))

    const call = mockWriteLog.mock.calls[0][0]
    expect(call.before).not.toHaveProperty('password')
    expect(call.after).not.toHaveProperty('password')
  })

  it('strips twoFactorSecret and backupCodes from snapshots', async () => {
    const before = {
      email: 'u@example.com',
      twoFactorSecret: 'encrypted_secret',
      backupCodes: ['hash1', 'hash2'],
    }

    const handler = jest.fn().mockResolvedValue({})
    const wrapped = withAuditLog(handler, {
      action: 'user.update',
      resource: 'user',
      getBeforeSnapshot: jest.fn().mockResolvedValue(before),
    })

    await wrapped(makeReq(), makeRes())

    await new Promise((r) => setImmediate(r))

    const call = mockWriteLog.mock.calls[0][0]
    expect(call.before).not.toHaveProperty('twoFactorSecret')
    expect(call.before).not.toHaveProperty('backupCodes')
  })

  it('sets diff=null when only before snapshot is available (delete operation)', async () => {
    const before = { name: 'Product', price: 50 }

    const handler = jest.fn().mockResolvedValue({})
    const wrapped = withAuditLog(handler, {
      action: 'product.delete',
      resource: 'product',
      getResourceId: (req: any) => req.params.id,
      getBeforeSnapshot: jest.fn().mockResolvedValue(before),
      // No getAfterSnapshot
    })

    await wrapped(makeReq(), makeRes())

    await new Promise((r) => setImmediate(r))

    const call = mockWriteLog.mock.calls[0][0]
    expect(call.before).toEqual(before)
    expect(call.after).toBeNull()
    expect(call.diff).toBeNull()
  })
})
