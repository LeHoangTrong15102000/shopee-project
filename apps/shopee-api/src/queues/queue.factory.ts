/**
 * BullMQ Queue factory.
 *
 * Reads Redis config directly from process.env, mirroring the logic in
 * utils/redis.client.ts. Does NOT import or depend on the redisClient singleton
 * because BullMQ requires its own internal connections.
 */
import { Queue, ConnectionOptions } from 'bullmq'
import { DEFAULT_JOB_OPTIONS } from './queue.config'

function getRedisConnection(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL
  const redisHost = process.env.REDIS_HOST

  const tlsEnabled =
    process.env.REDIS_TLS_ENABLED === 'true' || (redisUrl?.startsWith('rediss://') ?? false)

  if (redisUrl) {
    return {
      // BullMQ accepts a URL string directly
      ...(tlsEnabled ? { tls: { rejectUnauthorized: true } } : {}),
      // Pass as a url property via lazyConnect pattern
      // BullMQ ConnectionOptions accepts the ioredis constructor options
      // When REDIS_URL is set, pass it as the host field is not used
      maxRetriesPerRequest: null,
    } as ConnectionOptions & { url?: string }
  }

  return {
    host: redisHost || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
    maxRetriesPerRequest: null,
    ...(tlsEnabled ? { tls: { rejectUnauthorized: true } } : {}),
  }
}

/**
 * Create a BullMQ Queue instance with shared default options.
 * Each call creates a new Queue with its own Redis connection.
 */
export function createQueue(name: string): Queue {
  const redisUrl = process.env.REDIS_URL
  const tlsEnabled =
    process.env.REDIS_TLS_ENABLED === 'true' || (redisUrl?.startsWith('rediss://') ?? false)

  let connection: ConnectionOptions

  if (redisUrl) {
    connection = {
      // ioredis accepts a URL string as the first constructor arg,
      // but BullMQ ConnectionOptions expects an object.
      // We pass the URL via the lazyConnect approach using a custom object.
      // BullMQ internally calls new IORedis(connection) so passing url works.
      ...(redisUrl ? { url: redisUrl } : {}),
      maxRetriesPerRequest: null,
      ...(tlsEnabled ? { tls: { rejectUnauthorized: true } } : {}),
    } as ConnectionOptions & { url?: string }
  } else {
    connection = getRedisConnection()
  }

  return new Queue(name, {
    connection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  })
}
