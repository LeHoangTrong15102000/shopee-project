export interface PopularSearch {
  keyword: string
  count: number
  trend: 'up' | 'down' | 'stable'
  trend_percent?: number
}

export interface TrendingSearch {
  keyword: string
  current_count: number
  previous_count: number
  increase_percent: number
}

export interface ZeroResultSearch {
  keyword: string
  count: number
}

export interface SearchVolumePoint {
  date: string
  searches: number
}

export interface SearchAnalyticsOverview {
  total_searches: number
  unique_keywords: number
  avg_per_day: number
  zero_result_rate: number
}

export type SearchPeriod = '7d' | '30d' | '90d'
