import http from 'src/utils/http'
import type {
  PopularSearch,
  TrendingSearch,
  ZeroResultSearch,
  SearchVolumePoint,
  SearchAnalyticsOverview,
  SearchPeriod,
} from 'src/types/search-analytics.types'

interface SuccessResponse<T> {
  message: string
  data: T
}

const searchAnalyticsApi = {
  getPopularSearches: (period: SearchPeriod = '30d') =>
    http.get<SuccessResponse<PopularSearch[]>>('admin/search-analytics/popular', {
      params: { period },
    }),

  getTrendingSearches: (period: SearchPeriod = '30d') =>
    http.get<SuccessResponse<TrendingSearch[]>>('admin/search-analytics/trending', {
      params: { period },
    }),

  getZeroResultSearches: (period: SearchPeriod = '30d') =>
    http.get<SuccessResponse<ZeroResultSearch[]>>('admin/search-analytics/zero-results', {
      params: { period },
    }),

  getSearchVolume: (period: SearchPeriod = '30d') =>
    http.get<SuccessResponse<SearchVolumePoint[]>>('admin/search-analytics/volume', {
      params: { period },
    }),

  getOverview: (period: SearchPeriod = '30d') =>
    http.get<SuccessResponse<SearchAnalyticsOverview>>('admin/search-analytics/overview', {
      params: { period },
    }),
}

export default searchAnalyticsApi
