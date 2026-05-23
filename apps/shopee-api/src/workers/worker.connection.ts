/**
 * Shared Redis connection options for BullMQ Workers.
 *
 * Workers need their own ioredis connections (separate from Queue connections)
 * because subscriber-mode connections cannot issue regular commands.
 * This helper reads the same env vars as queue.factory.ts.
 */
import { ConnectionOptions } from 'bullmq'

export function getWorkerConnection(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL
  const tlsEnabled =
    process.env.REDIS_TLS_ENABLED === 'true' ||
    (redisUrl?.startsWith('rediss://') ?? false)

  if (redisUrl) {
    return {
      url: redisUrl,
      maxRetriesPerRequest: null,
      ...(tlsEnabled ? { tls: { rejectUnauthorized: true } } : {}),
    } as ConnectionOptions & { url?: string }
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
    maxRetriesPerRequest: null,
    ...(tlsEnabled ? { tls: { rejectUnauthorized: true } } : {}),
  }
}
