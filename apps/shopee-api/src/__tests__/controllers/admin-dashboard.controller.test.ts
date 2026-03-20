/// <reference types="jest" />
import { Request, Response } from 'express'

const mockGetOverview = jest.fn()
const mockGetRevenue = jest.fn()
const mockGetRevenueByCategory = jest.fn()
const mockGetRevenueByProduct = jest.fn()
const mockGetOrderTrend = jest.fn()
const mockGetUserGrowth = jest.fn()
const mockGetTopBuyers = jest.fn()

jest.mock('@services/admin-dashboard.service', () => ({
  AdminDashboardService: jest.fn().mockImplementation(() => ({
    getOverview: mockGetOverview,
    getRevenue: mockGetRevenue,
    getRevenueByCategory: mockGetRevenueByCategory,
    getRevenueByProduct: mockGetRevenueByProduct,
    getOrderTrend: mockGetOrderTrend,
    getUserGrowth: mockGetUserGrowth,
    getTopBuyers: mockGetTopBuyers,
  })),
}))

import {
  getOverview, getRevenue, getRevenueByCategory, getRevenueByProduct,
  getOrderTrend, getUserGrowth, getTopBuyers,
} from '../../controllers/admin-dashboard.controller'

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('AdminDashboardController', () => {
  beforeEach(() => jest.clearAllMocks())

  it('getOverview returns data', async () => {
    mockGetOverview.mockResolvedValue({ total: 100 })
    const res = createMockResponse()
    await getOverview(createMockRequest() as Request, res as Response)
    expect(mockGetOverview).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
  it('getRevenue passes query params', async () => {
    mockGetRevenue.mockResolvedValue({ revenue: 50000 })
    const req = createMockRequest({ query: { period: 'monthly', start_date: '2026-01-01', end_date: '2026-03-01' } })
    const res = createMockResponse()
    await getRevenue(req as Request, res as Response)
    expect(mockGetRevenue).toHaveBeenCalledWith('monthly', '2026-01-01', '2026-03-01')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('getRevenueByCategory passes period', async () => {
    mockGetRevenueByCategory.mockResolvedValue([])
    const req = createMockRequest({ query: { period: 'weekly' } })
    const res = createMockResponse()
    await getRevenueByCategory(req as Request, res as Response)
    expect(mockGetRevenueByCategory).toHaveBeenCalledWith('weekly')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('getRevenueByProduct uses Number(limit) with default 10', async () => {
    mockGetRevenueByProduct.mockResolvedValue([])
    const req = createMockRequest({ query: { period: 'daily' } })
    const res = createMockResponse()
    await getRevenueByProduct(req as Request, res as Response)
    expect(mockGetRevenueByProduct).toHaveBeenCalledWith('daily', 10)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('getOrderTrend passes period', async () => {
    mockGetOrderTrend.mockResolvedValue([])
    const res = createMockResponse()
    await getOrderTrend(createMockRequest({ query: { period: 'weekly' } }) as Request, res as Response)
    expect(mockGetOrderTrend).toHaveBeenCalledWith('weekly')
  })

  it('getUserGrowth passes period', async () => {
    mockGetUserGrowth.mockResolvedValue([])
    const res = createMockResponse()
    await getUserGrowth(createMockRequest({ query: { period: 'monthly' } }) as Request, res as Response)
    expect(mockGetUserGrowth).toHaveBeenCalledWith('monthly')
  })

  it('getTopBuyers uses Number(limit) with default 10', async () => {
    mockGetTopBuyers.mockResolvedValue([])
    const res = createMockResponse()
    await getTopBuyers(createMockRequest({ query: { period: 'yearly' } }) as Request, res as Response)
    expect(mockGetTopBuyers).toHaveBeenCalledWith('yearly', 10)
  })
})
