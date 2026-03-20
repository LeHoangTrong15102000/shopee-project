/// <reference types="jest" />
import { Request, Response } from 'express'

const mockGetTopSelling = jest.fn()
const mockGetTopViewed = jest.fn()
const mockGetTopRated = jest.fn()
const mockGetStatsByCategory = jest.fn()

jest.mock('@services/admin-dashboard.service', () => ({
  AdminDashboardService: jest.fn().mockImplementation(() => ({
    getTopSelling: mockGetTopSelling,
    getTopViewed: mockGetTopViewed,
    getTopRated: mockGetTopRated,
    getStatsByCategory: mockGetStatsByCategory,
  })),
}))

import {
  adminGetTopSelling, adminGetTopViewed, adminGetTopRated, adminGetStatsByCategory,
} from '../../controllers/admin-product-analytics.controller'

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

describe('Admin Product Analytics Controller', () => {
  beforeEach(() => jest.clearAllMocks())

  it('adminGetTopSelling with period and limit', async () => {
    mockGetTopSelling.mockResolvedValue([{ name: 'P1', sales: 100 }])
    const req = createMockRequest({ query: { period: '7d', limit: '5' } })
    const res = createMockResponse()
    await adminGetTopSelling(req as Request, res as Response)
    expect(mockGetTopSelling).toHaveBeenCalledWith('7d', 5)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminGetTopSelling default limit 10', async () => {
    mockGetTopSelling.mockResolvedValue([])
    const req = createMockRequest({ query: { period: '30d' } })
    const res = createMockResponse()
    await adminGetTopSelling(req as Request, res as Response)
    expect(mockGetTopSelling).toHaveBeenCalledWith('30d', 10)
  })

  it('adminGetTopViewed with limit', async () => {
    mockGetTopViewed.mockResolvedValue([])
    const req = createMockRequest({ query: { limit: '15' } })
    const res = createMockResponse()
    await adminGetTopViewed(req as Request, res as Response)
    expect(mockGetTopViewed).toHaveBeenCalledWith(15)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminGetTopRated with limit and min_reviews', async () => {
    mockGetTopRated.mockResolvedValue([])
    const req = createMockRequest({ query: { limit: '20', min_reviews: '5' } })
    const res = createMockResponse()
    await adminGetTopRated(req as Request, res as Response)
    expect(mockGetTopRated).toHaveBeenCalledWith(20, 5)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('adminGetStatsByCategory', async () => {
    mockGetStatsByCategory.mockResolvedValue([{ category: 'Electronics', count: 50 }])
    const res = createMockResponse()
    await adminGetStatsByCategory(createMockRequest() as Request, res as Response)
    expect(mockGetStatsByCategory).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
