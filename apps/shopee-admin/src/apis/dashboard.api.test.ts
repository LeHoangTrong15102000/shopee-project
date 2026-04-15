import { describe, it, expect, vi, beforeEach } from 'vitest'
import dashboardApi from './dashboard.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('dashboard.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getOverview calls GET /admin/dashboard/overview', () => {
    dashboardApi.getOverview()
    expect(mockHttp.get).toHaveBeenCalledWith('admin/dashboard/overview')
  })

  it('getRevenue calls GET /admin/dashboard/revenue with params', () => {
    dashboardApi.getRevenue({ period: '7d' })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/dashboard/revenue', {
      params: { period: '7d' },
    })
  })

  it('getRevenueByCategory calls GET /admin/dashboard/revenue/by-category', () => {
    dashboardApi.getRevenueByCategory({ period: '30d' })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/dashboard/revenue/by-category', {
      params: { period: '30d' },
    })
  })

  it('getRevenueByProduct calls GET /admin/dashboard/revenue/by-product', () => {
    dashboardApi.getRevenueByProduct({ period: '7d', limit: 5 })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/dashboard/revenue/by-product', {
      params: { period: '7d', limit: 5 },
    })
  })

  it('getOrderTrend calls GET /admin/dashboard/orders/trend', () => {
    dashboardApi.getOrderTrend({ period: '30d' })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/dashboard/orders/trend', {
      params: { period: '30d' },
    })
  })

  it('getUserGrowth calls GET /admin/dashboard/users/growth', () => {
    dashboardApi.getUserGrowth({ period: '30d' })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/dashboard/users/growth', {
      params: { period: '30d' },
    })
  })

  it('getTopBuyers calls GET /admin/dashboard/users/top-buyers', () => {
    dashboardApi.getTopBuyers({ period: '7d', limit: 10 })
    expect(mockHttp.get).toHaveBeenCalledWith('admin/dashboard/users/top-buyers', {
      params: { period: '7d', limit: 10 },
    })
  })
})
