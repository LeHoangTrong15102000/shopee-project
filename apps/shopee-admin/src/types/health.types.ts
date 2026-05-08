export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded'

export interface DatabaseHealthStatus {
  status: HealthStatus
  message?: string
  responseTime?: number
}

export interface HealthCheckResponse {
  status: HealthStatus
  timestamp: string
  uptime: number
  version: string
  database: DatabaseHealthStatus
  memory: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
  }
}

export interface ReadinessResponse {
  ready: boolean
  timestamp: string
  checks: {
    database: boolean
    redis: boolean
  }
}

export interface ServerMetrics {
  timestamp: string
  uptime: number
  process: {
    pid: number
    platform: string
    nodeVersion: string
  }
  memory: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
    heapUsedMB: number
    heapTotalMB: number
  }
  database: DatabaseHealthStatus & {
    pool?: {
      totalConnections?: number
      availableConnections?: number
    }
  }
  requests?: {
    total: number
    perMinute: number
    avgResponseTimeMs: number
    errorRate: number
  }
}

export interface HealthHistoryPoint {
  timestamp: number
  heapUsedMB: number
  heapTotalMB: number
}
