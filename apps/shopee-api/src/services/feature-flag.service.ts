import Redis from 'ioredis'
import { IFeatureFlag } from '@database/models/feature-flag.model'
import {
  FeatureFlagRepository,
  CreateFeatureFlagDTO,
  UpdateFeatureFlagDTO,
} from '@repositories/feature-flag.repository'
import { BaseService, NotFoundError, ConflictError, ValidationError } from './base.service'
import { Logger } from '@utils/logger'
import { createHash } from 'crypto'

// ─── Context for condition evaluation ────────────────────────────────────────

export interface FeatureFlagContext {
  userId?: string
  userRole?: string
  platform?: string
}

// ─── Cache key helper ─────────────────────────────────────────────────────────

const cacheKey = (key: string): string => `ff:${key}`
const CACHE_TTL_SECONDS = 60

// ─── FeatureFlagService ───────────────────────────────────────────────────────

export class FeatureFlagService extends BaseService {
  constructor(
    private readonly featureFlagRepository: FeatureFlagRepository,
    private readonly redis: Redis | null,
  ) {
    super()
  }

  /**
   * Evaluate whether a feature flag is enabled for the given context.
   *
   * Condition evaluation order (D4):
   * 1. enabled: false → always disabled
   * 2. endDate passed → disabled
   * 3. startDate not yet reached → disabled
   * 4. userIds whitelist → if present and userId matches, enabled
   * 5. userRoles → if present and role matches, enabled
   * 6. platform → if present and platform matches, enabled
   * 7. rolloutPercentage → hash(userId + flagKey) % 100 < rolloutPercentage
   * 8. No conditions → enabled (if enabled: true)
   */
  async isEnabled(key: string, context?: FeatureFlagContext): Promise<boolean> {
    const flag = await this.getFlagWithCache(key)
    if (!flag) return false
    return this.evaluateConditions(flag, context)
  }

  /**
   * Get a flag from Redis cache, falling back to MongoDB on miss or Redis failure.
   */
  private async getFlagWithCache(key: string): Promise<IFeatureFlag | null> {
    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey(key))
        if (cached !== null) {
          return JSON.parse(cached) as IFeatureFlag
        }
      } catch (err) {
        Logger.apiWarn('[FeatureFlagService] Redis read failed, falling back to MongoDB', {
          key,
          error: (err as Error).message,
        })
      }
    }

    const flag = await this.featureFlagRepository.findByKey(key)

    if (flag && this.redis) {
      try {
        await this.redis.set(cacheKey(key), JSON.stringify(flag), 'EX', CACHE_TTL_SECONDS)
      } catch (err) {
        Logger.apiWarn('[FeatureFlagService] Redis write failed', {
          key,
          error: (err as Error).message,
        })
      }
    }

    return flag
  }

  /**
   * Evaluate conditions in priority order per D4.
   */
  private evaluateConditions(flag: IFeatureFlag, context?: FeatureFlagContext): boolean {
    const now = new Date()
    const c = flag.conditions

    // Step 1: enabled: false → always disabled
    if (!flag.enabled) return false

    // Step 2: endDate passed → disabled
    if (c?.endDate && new Date(c.endDate) < now) return false

    // Step 3: startDate not yet reached → disabled
    if (c?.startDate && new Date(c.startDate) > now) return false

    // If no context provided, only date-range and enabled conditions apply
    if (!context) {
      // No further conditions to check without context
      return true
    }

    // Step 4: userIds whitelist
    if (c?.userIds && c.userIds.length > 0) {
      if (context.userId && c.userIds.includes(context.userId)) return true
      // If whitelist present but user not in it, continue to next condition
    }

    // Step 5: userRoles
    if (c?.userRoles && c.userRoles.length > 0) {
      if (context.userRole && c.userRoles.includes(context.userRole)) return true
    }

    // Step 6: platform
    if (c?.platform && c.platform.length > 0) {
      if (context.platform && c.platform.includes(context.platform)) return true
    }

    // Step 7: rolloutPercentage
    if (flag.rolloutPercentage < 100) {
      const userId = context.userId ?? 'anonymous'
      const hash = createHash('sha256')
        .update(`${userId}:${flag.key}`)
        .digest('hex')
      const bucket = parseInt(hash.slice(0, 8), 16) % 100
      return bucket < flag.rolloutPercentage
    }

    // Step 8: No conditions → enabled
    return true
  }

  /**
   * Invalidate the Redis cache for a flag key.
   */
  private async invalidateCache(key: string): Promise<void> {
    if (!this.redis) return
    try {
      await this.redis.del(cacheKey(key))
    } catch (err) {
      Logger.apiWarn('[FeatureFlagService] Redis cache invalidation failed', {
        key,
        error: (err as Error).message,
      })
    }
  }

  // ─── CRUD methods ─────────────────────────────────────────────────────────

  async createFlag(data: CreateFeatureFlagDTO): Promise<IFeatureFlag> {
    const existing = await this.featureFlagRepository.findByKey(data.key)
    if (existing) {
      throw new ConflictError(`Feature flag with key '${data.key}' already exists`)
    }
    return this.featureFlagRepository.create(data)
  }

  async getFlag(id: string): Promise<IFeatureFlag> {
    if (!this.isValidObjectId(id)) {
      throw new ValidationError('Invalid feature flag ID format')
    }
    const flag = await this.featureFlagRepository.findById(id)
    if (!flag) {
      throw new NotFoundError('FeatureFlag', id)
    }
    return flag
  }

  async getFlagByKey(key: string): Promise<IFeatureFlag> {
    const flag = await this.featureFlagRepository.findByKey(key)
    if (!flag) {
      throw new NotFoundError('FeatureFlag')
    }
    return flag
  }

  async listFlags(): Promise<IFeatureFlag[]> {
    return this.featureFlagRepository.findAll()
  }

  async updateFlag(id: string, data: UpdateFeatureFlagDTO): Promise<IFeatureFlag> {
    if (!this.isValidObjectId(id)) {
      throw new ValidationError('Invalid feature flag ID format')
    }
    const updated = await this.featureFlagRepository.update(id, data)
    if (!updated) {
      throw new NotFoundError('FeatureFlag', id)
    }
    // Invalidate cache
    await this.invalidateCache(updated.key)
    return updated
  }

  async deleteFlag(id: string): Promise<void> {
    if (!this.isValidObjectId(id)) {
      throw new ValidationError('Invalid feature flag ID format')
    }
    const deleted = await this.featureFlagRepository.delete(id)
    if (!deleted) {
      throw new NotFoundError('FeatureFlag', id)
    }
    // Invalidate cache
    await this.invalidateCache(deleted.key)
  }

  async toggleFlag(id: string): Promise<IFeatureFlag> {
    if (!this.isValidObjectId(id)) {
      throw new ValidationError('Invalid feature flag ID format')
    }
    const flag = await this.featureFlagRepository.findById(id)
    if (!flag) {
      throw new NotFoundError('FeatureFlag', id)
    }
    const updated = await this.featureFlagRepository.update(id, { enabled: !flag.enabled })
    if (!updated) {
      throw new NotFoundError('FeatureFlag', id)
    }
    // Invalidate cache
    await this.invalidateCache(updated.key)
    return updated
  }
}
