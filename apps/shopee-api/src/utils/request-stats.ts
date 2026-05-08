/**
 * In-memory request statistics tracker.
 * Tracks total requests, error count, and response times for the /metrics endpoint.
 * Resets on server restart (intentional — lightweight monitoring only).
 */

interface RequestStats {
  totalRequests: number
  errorRequests: number
  totalResponseTimeMs: number
  /** Sliding window: timestamp of each request in the last 60 seconds */
  recentTimestamps: number[]
}

const stats: RequestStats = {
  totalRequests: 0,
  errorRequests: 0,
  totalResponseTimeMs: 0,
  recentTimestamps: [],
}

const WINDOW_MS = 60_000 // 1 minute sliding window

export function recordRequest(statusCode: number, responseTimeMs: number): void {
  stats.totalRequests++
  stats.totalResponseTimeMs += responseTimeMs
  if (statusCode >= 400) {
    stats.errorRequests++
  }

  const now = Date.now()
  stats.recentTimestamps.push(now)

  // Prune entries older than the window
  const cutoff = now - WINDOW_MS
  while (stats.recentTimestamps.length > 0 && stats.recentTimestamps[0] < cutoff) {
    stats.recentTimestamps.shift()
  }
}

export function getRequestStats() {
  const avgResponseTimeMs =
    stats.totalRequests > 0
      ? Math.round(stats.totalResponseTimeMs / stats.totalRequests)
      : 0

  const errorRate =
    stats.totalRequests > 0
      ? Math.round((stats.errorRequests / stats.totalRequests) * 1000) / 10
      : 0

  return {
    totalRequests: stats.totalRequests,
    requestsPerMinute: stats.recentTimestamps.length,
    avgResponseTimeMs,
    errorRate,
  }
}
