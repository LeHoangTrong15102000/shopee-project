/// <reference types="jest" />
import { Types } from 'mongoose'
import { FeatureFlagService } from '@services/feature-flag.service'
import { ConflictError, NotFoundError, ValidationError } from '@services/base.service'
import type { IFeatureFlag } from '@database/models/feature-flag.model'

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiWarn: jest.fn(), apiError: jest.fn() },
}))

// ─── Mock FeatureFlagRepository ───────────────────────────────────────────────

const mockRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  findByKey: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  upsertByKey: jest.fn(),
}

// ─── Mock Redis ───────────────────────────────────────────────────────────────

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFlag(overrides: Partial<IFeatureFlag> = {}): IFeatureFlag {
  return {
    _id: new Types.ObjectId(),
    key: 'test-flag',
    name: 'Test Flag',
    enabled: true,
    rolloutPercentage: 100,
    conditions: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as IFeatureFlag
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FeatureFlagService', () => {
  let service: FeatureFlagService

  beforeEach(() => {
    jest.clearAllMocks()
    mockRedis.get.mockResolvedValue(null)
    mockRedis.set.mockResolvedValue('OK')
    mockRedis.del.mockResolvedValue(1)
    service = new FeatureFlagService(mockRepo as never, mockRedis as never)
  })

  // ─── isEnabled — D4 condition evaluation ─────────────────────────────────────

  describe('isEnabled — condition evaluation order', () => {
    it('Step 1: returns false when enabled is false', async () => {
      const flag = makeFlag({ enabled: false })
      mockRepo.findByKey.mockResolvedValue(flag)

      const result = await service.isEnabled('test-flag')
      expect(result).toBe(false)
    })

    it('Step 2: returns false when endDate has passed', async () => {
      const past = new Date(Date.now() - 1000 * 60 * 60)
      const flag = makeFlag({ conditions: { endDate: past } })
      mockRepo.findByKey.mockResolvedValue(flag)

      const result = await service.isEnabled('test-flag')
      expect(result).toBe(false)
    })

    it('Step 3: returns false when startDate has not been reached', async () => {
      const future = new Date(Date.now() + 1000 * 60 * 60)
      const flag = makeFlag({ conditions: { startDate: future } })
      mockRepo.findByKey.mockResolvedValue(flag)

      const result = await service.isEnabled('test-flag')
      expect(result).toBe(false)
    })

    it('Step 4: returns true when userId is in userIds whitelist', async () => {
      const flag = makeFlag({
        conditions: { userIds: ['user-123', 'user-456'] },
      })
      mockRepo.findByKey.mockResolvedValue(flag)

      const result = await service.isEnabled('test-flag', { userId: 'user-123' })
      expect(result).toBe(true)
    })

    it('Step 4: continues evaluation when userId is NOT in userIds whitelist', async () => {
      // userIds present but user not in list — should fall through to rollout
      const flag = makeFlag({
        rolloutPercentage: 100,
        conditions: { userIds: ['user-999'] },
      })
      mockRepo.findByKey.mockResolvedValue(flag)

      // rolloutPercentage 100 → step 8 returns true
      const result = await service.isEnabled('test-flag', { userId: 'user-123' })
      expect(result).toBe(true)
    })

    it('Step 5: returns true when userRole matches', async () => {
      const flag = makeFlag({
        conditions: { userRoles: ['Admin', 'Moderator'] },
      })
      mockRepo.findByKey.mockResolvedValue(flag)

      const result = await service.isEnabled('test-flag', { userRole: 'Admin' })
      expect(result).toBe(true)
    })

    it('Step 6: returns true when platform matches', async () => {
      const flag = makeFlag({
        conditions: { platform: ['ios'] },
      })
      mockRepo.findByKey.mockResolvedValue(flag)

      const result = await service.isEnabled('test-flag', { platform: 'ios' })
      expect(result).toBe(true)
    })

    it('Step 6: returns false when platform does not match', async () => {
      const flag = makeFlag({
        rolloutPercentage: 0,
        conditions: { platform: ['ios'] },
      })
      mockRepo.findByKey.mockResolvedValue(flag)

      // platform mismatch, rollout 0 → false
      const result = await service.isEnabled('test-flag', { platform: 'android' })
      expect(result).toBe(false)
    })

    it('Step 7: applies rolloutPercentage hash bucket', async () => {
      // rolloutPercentage 0 → no user should pass
      const flag = makeFlag({ rolloutPercentage: 0 })
      mockRepo.findByKey.mockResolvedValue(flag)

      const result = await service.isEnabled('test-flag', { userId: 'any-user' })
      expect(result).toBe(false)
    })

    it('Step 7: rolloutPercentage 100 always passes', async () => {
      const flag = makeFlag({ rolloutPercentage: 100 })
      mockRepo.findByKey.mockResolvedValue(flag)

      const result = await service.isEnabled('test-flag', { userId: 'any-user' })
      expect(result).toBe(true)
    })

    it('Step 8: returns true when enabled with no conditions and no context', async () => {
      const flag = makeFlag({ rolloutPercentage: 100, conditions: undefined })
      mockRepo.findByKey.mockResolvedValue(flag)

      const result = await service.isEnabled('test-flag')
      expect(result).toBe(true)
    })

    it('returns false when flag key does not exist', async () => {
      mockRepo.findByKey.mockResolvedValue(null)

      const result = await service.isEnabled('nonexistent-flag')
      expect(result).toBe(false)
    })
  })

  // ─── Redis cache ──────────────────────────────────────────────────────────────

  describe('Redis cache', () => {
    it('returns cached flag on cache hit without calling repository', async () => {
      const flag = makeFlag()
      mockRedis.get.mockResolvedValue(JSON.stringify(flag))

      const result = await service.isEnabled('test-flag')

      expect(mockRedis.get).toHaveBeenCalledWith('ff:test-flag')
      expect(mockRepo.findByKey).not.toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('writes flag to cache after MongoDB fetch on cache miss', async () => {
      const flag = makeFlag()
      mockRedis.get.mockResolvedValue(null)
      mockRepo.findByKey.mockResolvedValue(flag)

      await service.isEnabled('test-flag')

      expect(mockRepo.findByKey).toHaveBeenCalledWith('test-flag')
      expect(mockRedis.set).toHaveBeenCalledWith(
        'ff:test-flag',
        JSON.stringify(flag),
        'EX',
        60,
      )
    })

    it('falls back to MongoDB when Redis.get throws', async () => {
      const flag = makeFlag()
      mockRedis.get.mockRejectedValue(new Error('Redis connection refused'))
      mockRepo.findByKey.mockResolvedValue(flag)

      const result = await service.isEnabled('test-flag')

      expect(mockRepo.findByKey).toHaveBeenCalledWith('test-flag')
      expect(result).toBe(true)
    })

    it('does not throw when Redis.set fails after MongoDB fetch', async () => {
      const flag = makeFlag()
      mockRedis.get.mockResolvedValue(null)
      mockRepo.findByKey.mockResolvedValue(flag)
      mockRedis.set.mockRejectedValue(new Error('Redis write error'))

      // Should not throw — Redis write failure is non-fatal
      await expect(service.isEnabled('test-flag')).resolves.toBe(true)
    })

    it('works correctly when redis is null (no Redis configured)', async () => {
      const noRedisService = new FeatureFlagService(mockRepo as never, null)
      const flag = makeFlag()
      mockRepo.findByKey.mockResolvedValue(flag)

      const result = await noRedisService.isEnabled('test-flag')

      expect(result).toBe(true)
      expect(mockRedis.get).not.toHaveBeenCalled()
    })
  })

  // ─── Cache invalidation ───────────────────────────────────────────────────────

  describe('cache invalidation', () => {
    it('invalidates cache after updateFlag', async () => {
      const id = new Types.ObjectId().toString()
      const updated = makeFlag({ key: 'my-flag', enabled: false })
      mockRepo.update.mockResolvedValue(updated)

      await service.updateFlag(id, { enabled: false })

      expect(mockRedis.del).toHaveBeenCalledWith('ff:my-flag')
    })

    it('invalidates cache after deleteFlag', async () => {
      const id = new Types.ObjectId().toString()
      const deleted = makeFlag({ key: 'my-flag' })
      mockRepo.delete.mockResolvedValue(deleted)

      await service.deleteFlag(id)

      expect(mockRedis.del).toHaveBeenCalledWith('ff:my-flag')
    })

    it('invalidates cache after toggleFlag', async () => {
      const id = new Types.ObjectId().toString()
      const flag = makeFlag({ key: 'my-flag', enabled: true })
      const toggled = makeFlag({ key: 'my-flag', enabled: false })
      mockRepo.findById.mockResolvedValue(flag)
      mockRepo.update.mockResolvedValue(toggled)

      await service.toggleFlag(id)

      expect(mockRedis.del).toHaveBeenCalledWith('ff:my-flag')
    })
  })

  // ─── CRUD methods ─────────────────────────────────────────────────────────────

  describe('createFlag', () => {
    it('creates a flag when key is unique', async () => {
      const flag = makeFlag()
      mockRepo.findByKey.mockResolvedValue(null)
      mockRepo.create.mockResolvedValue(flag)

      const result = await service.createFlag({ key: 'test-flag', name: 'Test', enabled: false, rolloutPercentage: 100 })
      expect(result).toBe(flag)
    })

    it('throws ConflictError when key already exists', async () => {
      mockRepo.findByKey.mockResolvedValue(makeFlag())

      await expect(
        service.createFlag({ key: 'test-flag', name: 'Test', enabled: false, rolloutPercentage: 100 }),
      ).rejects.toThrow(ConflictError)
    })
  })

  describe('getFlag', () => {
    it('throws ValidationError for invalid ObjectId', async () => {
      await expect(service.getFlag('not-an-id')).rejects.toThrow(ValidationError)
    })

    it('throws NotFoundError when flag does not exist', async () => {
      const id = new Types.ObjectId().toString()
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.getFlag(id)).rejects.toThrow(NotFoundError)
    })
  })

  describe('listFlags', () => {
    it('returns all flags from repository', async () => {
      const flags = [makeFlag(), makeFlag({ key: 'flag-2' })]
      mockRepo.findAll.mockResolvedValue(flags)

      const result = await service.listFlags()
      expect(result).toBe(flags)
    })
  })

  describe('toggleFlag', () => {
    it('flips enabled from true to false', async () => {
      const id = new Types.ObjectId().toString()
      const flag = makeFlag({ enabled: true })
      const toggled = makeFlag({ enabled: false })
      mockRepo.findById.mockResolvedValue(flag)
      mockRepo.update.mockResolvedValue(toggled)

      const result = await service.toggleFlag(id)

      expect(mockRepo.update).toHaveBeenCalledWith(id, { enabled: false })
      expect(result.enabled).toBe(false)
    })

    it('flips enabled from false to true', async () => {
      const id = new Types.ObjectId().toString()
      const flag = makeFlag({ enabled: false })
      const toggled = makeFlag({ enabled: true })
      mockRepo.findById.mockResolvedValue(flag)
      mockRepo.update.mockResolvedValue(toggled)

      const result = await service.toggleFlag(id)

      expect(mockRepo.update).toHaveBeenCalledWith(id, { enabled: true })
      expect(result.enabled).toBe(true)
    })
  })
})
