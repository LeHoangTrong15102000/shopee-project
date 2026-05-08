import http from 'src/utils/http'
import type { HealthCheckResponse, ReadinessResponse, ServerMetrics } from 'src/types/health.types'

const healthApi = {
  getHealth: () =>
    http.get<{ message: string; data: HealthCheckResponse }>('health'),

  getReady: () =>
    http.get<{ message: string; data: ReadinessResponse }>('ready'),

  getMetrics: () =>
    http.get<{ message: string; data: ServerMetrics }>('metrics'),
}

export default healthApi
