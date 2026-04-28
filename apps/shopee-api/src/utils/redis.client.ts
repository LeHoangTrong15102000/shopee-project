/**
 * Redis client singleton.
 *
 * Exports a single ioredis instance shared by all rate limiters and the cache
 * service. In test environments (NODE_ENV=test) or when no Redis configuration
 * is present, exports null so every consumer falls back to its in-memory
 * insurance limiter.
 *
 * Configuration priority:
 *   1. REDIS_URL  — full connection URL (redis:// or rediss://)
 *   2. REDIS_HOST + REDIS_PORT + REDIS_PASSWORD + REDIS_USERNAME — individual vars
 */

import Redis from 'ioredis'
import { Logger } from '@utils/logger'

const isTest = process.env.NODE_ENV === 'test'
const hasRedisUrl = Boolean(process.env.REDIS_URL)
const hasRedisHost = Boolean(process.env.REDIS_HOST)

function createClient(): Redis | null {
  if (isTest) {
    return null
  }

  if (!hasRedisUrl && !hasRedisHost) {
    Logger.apiWarn('No Redis configuration found — rate limiting will use in-memory fallback')
    return null
  }

  const tlsEnabled =
    process.env.REDIS_TLS_ENABLED === 'true' ||
    (process.env.REDIS_URL?.startsWith('rediss://') ?? false)

  const retryStrategy = (times: number): number | null => {
    if (times > 10) {
      Logger.apiError('Redis max retries reached — giving up')
      return null
    }
    const delay = Math.min(100 * Math.pow(2, times), 2000)
    return delay
  }

  let client: Redis

  if (hasRedisUrl) {
    client = new Redis(process.env.REDIS_URL!, {
      enableOfflineQueue: false,
      retryStrategy,
      ...(tlsEnabled ? { tls: { rejectUnauthorized: true } } : {}),
    })
  } else {
    client = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
      enableOfflineQueue: false,
      retryStrategy,
      ...(tlsEnabled ? { tls: { rejectUnauthorized: true } } : {}),
    })
  }

  client.on('connect', () => {
    Logger.apiInfo('Redis client connected')
  })

  client.on('error', (err: Error) => {
    Logger.apiError('Redis client error', { message: err.message })
  })

  client.on('close', () => {
    Logger.apiWarn('Redis client connection closed')
  })

  return client
}

export const redisClient: Redis | null = createClient()

/**
 * Gracefully disconnect the Redis client.
 * Called during server shutdown alongside server.close().
 */
export async function disconnectRedis(): Promise<void> {
  if (!redisClient) return
  try {
    await redisClient.quit()
    Logger.apiInfo('Redis client disconnected cleanly')
  } catch (err) {
    Logger.apiError('Error disconnecting Redis client', err)
  }
}
