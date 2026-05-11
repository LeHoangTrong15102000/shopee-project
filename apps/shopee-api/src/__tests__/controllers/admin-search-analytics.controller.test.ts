/// <reference types="jest" />
import { Request, Response } from 'express'

const mockGetPopularSearches = jest.fn()
const mockGetTrendingSearches = jest.fn()
const mockGetZeroResultSearches = jest.fn()
const mockGetSearchVolume = jest.fn()
const mockGetOverview = jest.fn()

jest.mock('@services/admin-search-analytics.service', () => ({
  AdminSearchAnalyticsService: jest.fn().mockImplementation(() => ({
    getPopularSearches: mockGetPopularSearches,
    getTrendingSearches: mockGetTrendingSearches,
    getZeroResultSearches: mockGetZeroResultSearches,
    getSearchVolume: mockGetSearchVolume,
    getOverview: mockGetOverview,
  })),
}))

jest.mock('@utils/response', () => ({
  responseSuccess: jest.fn((res: any, { data }: any = {}) => {
    res.status(200).send({ data })
  }),
}))

import {
  getPopularSearches,
  getTrendingSearches,
  getZeroResultSearches,
  getSearchVolume,
  getOverview,
} from '../../controllers/admin-search-analytics.controller'

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

describe('AdminSearchAnalyticsController', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getPopularSearches', () => {
    it('forwards period param to service', async () => {
      mockGetPopularSearches.mockResolvedValue({ period: '7d', data: [] })

      const req = createMockRequest({ query: { period: '7d' } })
      const res = createMockResponse()

      await getPopularSearches(req as Request, res as Response)

      expect(mockGetPopularSearches).toHaveBeenCalledWith('7d')
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('defaults to 30d when period not provided', async () => {
      mockGetPopularSearches.mockResolvedValue({ period: '30d', data: [] })

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getPopularSearches(req as Request, res as Response)

      expect(mockGetPopularSearches).toHaveBeenCalledWith('30d')
    })
  })

  describe('getTrendingSearches', () => {
    it('calls service and returns 200', async () => {
      mockGetTrendingSearches.mockResolvedValue({ data: [] })

      const req = createMockRequest()
      const res = createMockResponse()

      await getTrendingSearches(req as Request, res as Response)

      expect(mockGetTrendingSearches).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('getZeroResultSearches', () => {
    it('forwards period param to service', async () => {
      mockGetZeroResultSearches.mockResolvedValue({ period: '7d', data: [] })

      const req = createMockRequest({ query: { period: '7d' } })
      const res = createMockResponse()

      await getZeroResultSearches(req as Request, res as Response)

      expect(mockGetZeroResultSearches).toHaveBeenCalledWith('7d')
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('defaults to 30d when period not provided', async () => {
      mockGetZeroResultSearches.mockResolvedValue({ period: '30d', data: [] })

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getZeroResultSearches(req as Request, res as Response)

      expect(mockGetZeroResultSearches).toHaveBeenCalledWith('30d')
    })
  })

  describe('getSearchVolume', () => {
    it('forwards period param to service', async () => {
      mockGetSearchVolume.mockResolvedValue({ period: '90d', data: [] })

      const req = createMockRequest({ query: { period: '90d' } })
      const res = createMockResponse()

      await getSearchVolume(req as Request, res as Response)

      expect(mockGetSearchVolume).toHaveBeenCalledWith('90d')
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('defaults to 30d when period not provided', async () => {
      mockGetSearchVolume.mockResolvedValue({ period: '30d', data: [] })

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getSearchVolume(req as Request, res as Response)

      expect(mockGetSearchVolume).toHaveBeenCalledWith('30d')
    })
  })

  describe('getOverview', () => {
    it('forwards period param to service', async () => {
      mockGetOverview.mockResolvedValue({
        period: '90d',
        total_searches: 5000,
        unique_keywords: 300,
        avg_per_day: 55,
        zero_result_rate: 5.2,
      })

      const req = createMockRequest({ query: { period: '90d' } })
      const res = createMockResponse()

      await getOverview(req as Request, res as Response)

      expect(mockGetOverview).toHaveBeenCalledWith('90d')
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('defaults to 30d when period not provided', async () => {
      mockGetOverview.mockResolvedValue({
        period: '30d',
        total_searches: 0,
        unique_keywords: 0,
        avg_per_day: 0,
        zero_result_rate: 0,
      })

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getOverview(req as Request, res as Response)

      expect(mockGetOverview).toHaveBeenCalledWith('30d')
    })
  })
})
