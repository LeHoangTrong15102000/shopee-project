/// <reference types="jest" />

const mockSearchHistoryAggregate = jest.fn()

jest.mock('@database/models/search-history.model', () => ({
  SearchHistoryModel: {
    aggregate: mockSearchHistoryAggregate,
  },
}))

import { AdminSearchAnalyticsService } from '@services/admin-search-analytics.service'

describe('AdminSearchAnalyticsService', () => {
  let service: AdminSearchAnalyticsService

  beforeEach(() => {
    service = new AdminSearchAnalyticsService()
    jest.clearAllMocks()
  })

  describe('getPopularSearches', () => {
    it('returns period and data for 7d', async () => {
      mockSearchHistoryAggregate.mockResolvedValue([
        { keyword: 'phone', count: 100, unique_users: 50 },
      ])

      const result = await service.getPopularSearches('7d')

      expect(result).toHaveProperty('period', '7d')
      expect(result).toHaveProperty('data')
      expect(mockSearchHistoryAggregate).toHaveBeenCalled()
    })

    it('returns period and data for 30d (default)', async () => {
      mockSearchHistoryAggregate.mockResolvedValue([])

      const result = await service.getPopularSearches('30d')

      expect(result.period).toBe('30d')
    })

    it('returns period and data for 90d', async () => {
      mockSearchHistoryAggregate.mockResolvedValue([
        { keyword: 'laptop', count: 200, unique_users: 80 },
        { keyword: 'tablet', count: 150, unique_users: 60 },
      ])

      const result = await service.getPopularSearches('90d')

      expect(result.period).toBe('90d')
      expect(result.data).toHaveLength(2)
    })
  })

  describe('getTrendingSearches', () => {
    it('returns data array with trending keywords', async () => {
      // getTrendingSearches calls aggregate twice (current + previous period)
      mockSearchHistoryAggregate
        .mockResolvedValueOnce([
          { _id: 'iphone', count: 100 },
          { _id: 'samsung', count: 50 },
        ])
        .mockResolvedValueOnce([
          { _id: 'iphone', count: 10 },
        ])

      const result = await service.getTrendingSearches()

      expect(result).toHaveProperty('data')
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('filters out keywords with less than 50% increase', async () => {
      mockSearchHistoryAggregate
        .mockResolvedValueOnce([
          { _id: 'trending', count: 200 },
          { _id: 'stable', count: 100 },
        ])
        .mockResolvedValueOnce([
          { _id: 'trending', count: 10 },
          { _id: 'stable', count: 90 },
        ])

      const result = await service.getTrendingSearches()

      // 'trending' went from 10 to 200 (1900% increase) — should be included
      // 'stable' went from 90 to 100 (~11% increase) — should be filtered out
      const keywords = result.data.map((d: any) => d.keyword)
      expect(keywords).toContain('trending')
      expect(keywords).not.toContain('stable')
    })

    it('returns empty data when no searches', async () => {
      mockSearchHistoryAggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const result = await service.getTrendingSearches()

      expect(result.data).toHaveLength(0)
    })
  })

  describe('getZeroResultSearches', () => {
    it('returns period and data for 30d (default)', async () => {
      mockSearchHistoryAggregate.mockResolvedValue([
        { keyword: 'xyz123', count: 5, unique_users: 3 },
      ])

      const result = await service.getZeroResultSearches('30d')

      expect(result).toHaveProperty('period', '30d')
      expect(result).toHaveProperty('data')
    })

    it('returns period and data for 7d', async () => {
      mockSearchHistoryAggregate.mockResolvedValue([])

      const result = await service.getZeroResultSearches('7d')

      expect(result.period).toBe('7d')
      expect(result.data).toHaveLength(0)
    })
  })

  describe('getSearchVolume', () => {
    it('returns period and data for 30d', async () => {
      mockSearchHistoryAggregate.mockResolvedValue([
        { date: '2026-05-01', searches: 100, unique_keywords: 30 },
        { date: '2026-05-02', searches: 120, unique_keywords: 35 },
      ])

      const result = await service.getSearchVolume('30d')

      expect(result).toHaveProperty('period', '30d')
      expect(result).toHaveProperty('data')
      expect(result.data).toHaveLength(2)
    })

    it('returns period and data for 90d (weekly grouping)', async () => {
      mockSearchHistoryAggregate.mockResolvedValue([
        { date: '2026-W18', searches: 700, unique_keywords: 200 },
      ])

      const result = await service.getSearchVolume('90d')

      expect(result.period).toBe('90d')
    })
  })

  describe('getOverview', () => {
    it('returns overview stats for 30d', async () => {
      mockSearchHistoryAggregate
        .mockResolvedValueOnce([{ total_searches: 1000, unique_keywords: 200 }])
        .mockResolvedValueOnce([{ zero_count: 50 }])

      const result = await service.getOverview('30d')

      expect(result).toHaveProperty('period', '30d')
      expect(result).toHaveProperty('total_searches', 1000)
      expect(result).toHaveProperty('unique_keywords', 200)
      expect(result).toHaveProperty('avg_per_day')
      expect(result).toHaveProperty('zero_result_rate')
    })

    it('returns zero values when no data', async () => {
      mockSearchHistoryAggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const result = await service.getOverview('7d')

      expect(result.total_searches).toBe(0)
      expect(result.unique_keywords).toBe(0)
      expect(result.avg_per_day).toBe(0)
      expect(result.zero_result_rate).toBe(0)
    })

    it('calculates avg_per_day correctly for 7d period', async () => {
      mockSearchHistoryAggregate
        .mockResolvedValueOnce([{ total_searches: 700, unique_keywords: 100 }])
        .mockResolvedValueOnce([])

      const result = await service.getOverview('7d')

      expect(result.avg_per_day).toBe(100) // 700 / 7
    })
  })
})
