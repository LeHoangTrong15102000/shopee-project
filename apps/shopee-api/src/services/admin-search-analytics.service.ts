import { SearchHistoryModel } from '@database/models/search-history.model'
import { BaseService } from './base.service'

type AnalyticsPeriod = '7d' | '30d' | '90d'

function getPeriodStart(period: AnalyticsPeriod): Date {
  const now = new Date()
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  }
}

export class AdminSearchAnalyticsService extends BaseService {
  // ─── Popular searches ─────────────────────────────────────────────

  async getPopularSearches(period: AnalyticsPeriod = '30d', limit = 50) {
    const startDate = getPeriodStart(period)

    const results = await SearchHistoryModel.aggregate([
      { $match: { lastSearched: { $gte: startDate } } },
      {
        $group: {
          _id: '$keyword',
          count: { $sum: '$searchCount' },
          unique_users: { $addToSet: '$user' },
        },
      },
      {
        $project: {
          _id: 0,
          keyword: '$_id',
          count: 1,
          unique_users: { $size: '$unique_users' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])

    return { period, data: results }
  }

  // ─── Trending searches ────────────────────────────────────────────

  async getTrendingSearches() {
    const now = new Date()
    const currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const [currentPeriod, previousPeriod] = await Promise.all([
      SearchHistoryModel.aggregate([
        { $match: { lastSearched: { $gte: currentPeriodStart } } },
        { $group: { _id: '$keyword', count: { $sum: '$searchCount' } } },
      ]),
      SearchHistoryModel.aggregate([
        {
          $match: {
            lastSearched: { $gte: previousPeriodStart, $lt: currentPeriodStart },
          },
        },
        { $group: { _id: '$keyword', count: { $sum: '$searchCount' } } },
      ]),
    ])

    const previousMap = new Map<string, number>()
    for (const item of previousPeriod) {
      previousMap.set(item._id, item.count)
    }

    const trending = currentPeriod
      .map((item) => {
        const prevCount = previousMap.get(item._id) ?? 0
        const increase =
          prevCount === 0
            ? item.count > 0
              ? 100
              : 0
            : ((item.count - prevCount) / prevCount) * 100

        return {
          keyword: item._id,
          current_count: item.count,
          previous_count: prevCount,
          increase_percent: Math.round(increase),
        }
      })
      .filter((item) => item.increase_percent >= 50)
      .sort((a, b) => b.increase_percent - a.increase_percent)
      .slice(0, 30)

    return { data: trending }
  }

  // ─── Zero-result searches ─────────────────────────────────────────

  async getZeroResultSearches(period: AnalyticsPeriod = '30d', limit = 30) {
    const startDate = getPeriodStart(period)

    const results = await SearchHistoryModel.aggregate([
      {
        $match: {
          lastSearched: { $gte: startDate },
          resultsCount: 0,
        },
      },
      {
        $group: {
          _id: '$keyword',
          count: { $sum: '$searchCount' },
          unique_users: { $addToSet: '$user' },
        },
      },
      {
        $project: {
          _id: 0,
          keyword: '$_id',
          count: 1,
          unique_users: { $size: '$unique_users' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])

    return { period, data: results }
  }

  // ─── Overview stats ───────────────────────────────────────────────

  async getOverview(period: AnalyticsPeriod = '30d') {
    const startDate = getPeriodStart(period)
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90

    const [totalResult, zeroResult] = await Promise.all([
      SearchHistoryModel.aggregate([
        { $match: { lastSearched: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            total_searches: { $sum: '$searchCount' },
            unique_keywords: { $addToSet: '$keyword' },
          },
        },
        {
          $project: {
            _id: 0,
            total_searches: 1,
            unique_keywords: { $size: '$unique_keywords' },
          },
        },
      ]),
      SearchHistoryModel.aggregate([
        { $match: { lastSearched: { $gte: startDate }, resultsCount: 0 } },
        { $group: { _id: null, zero_count: { $sum: '$searchCount' } } },
        { $project: { _id: 0, zero_count: 1 } },
      ]),
    ])

    const total_searches = totalResult[0]?.total_searches ?? 0
    const unique_keywords = totalResult[0]?.unique_keywords ?? 0
    const zero_count = zeroResult[0]?.zero_count ?? 0
    const avg_per_day = periodDays > 0 ? Math.round(total_searches / periodDays) : 0
    const zero_result_rate =
      total_searches > 0 ? Math.round((zero_count / total_searches) * 1000) / 10 : 0

    return {
      period,
      total_searches,
      unique_keywords,
      avg_per_day,
      zero_result_rate,
    }
  }

  // ─── Search volume over time ──────────────────────────────────────

  async getSearchVolume(period: '30d' | '90d' = '30d') {
    const startDate = getPeriodStart(period)
    const groupFormat = period === '90d' ? '%Y-W%V' : '%Y-%m-%d'

    const results = await SearchHistoryModel.aggregate([
      { $match: { lastSearched: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$lastSearched' },
          },
          searches: { $sum: '$searchCount' },
          unique_keywords: { $addToSet: '$keyword' },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          searches: 1,
          unique_keywords: { $size: '$unique_keywords' },
        },
      },
      { $sort: { date: 1 } },
    ])

    return { period, data: results }
  }
}
