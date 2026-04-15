import { describe, it, expect, vi, beforeEach } from 'vitest'
import analyticsApi from './analytics.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('analytics.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getTopSelling calls GET /admin/products/analytics/top-selling', () => {
    analyticsApi.getTopSelling({ period: '30d', limit: 10 })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/products/analytics/top-selling', {
      params: { period: '30d', limit: 10 },
    })
  })

  it('getTopViewed calls GET /admin/products/analytics/top-viewed', () => {
    analyticsApi.getTopViewed({ limit: 5 })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/products/analytics/top-viewed', {
      params: { limit: 5 },
    })
  })

  it('getTopRated calls GET /admin/products/analytics/top-rated', () => {
    analyticsApi.getTopRated({ limit: 10, min_reviews: 5 })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/products/analytics/top-rated', {
      params: { limit: 10, min_reviews: 5 },
    })
  })

  it('getStatsByCategory calls GET /admin/products/analytics/by-category', () => {
    analyticsApi.getStatsByCategory()
    expect(mockHttp.get).toHaveBeenCalledWith('admin/products/analytics/by-category')
  })

  it('getChatbotOverview calls GET /admin/analytics/chatbot-overview', () => {
    analyticsApi.getChatbotOverview()
    expect(mockHttp.get).toHaveBeenCalledWith('admin/analytics/chatbot-overview')
  })

  it('getChatbotPerformance calls GET /admin/analytics/chatbot-performance', () => {
    analyticsApi.getChatbotPerformance({ period: '7d' })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/analytics/chatbot-performance', {
      params: { period: '7d' },
    })
  })
})
