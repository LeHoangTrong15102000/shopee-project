import http from 'src/utils/http'
import type {
  WishlistPeriod,
  TopWishlistedProductsResponse,
  WishlistConversionResponse,
  WishlistTrendsResponse,
} from 'src/types/wishlist-analytics.types'

interface SuccessResponse<T> {
  message: string
  data: T
}

const wishlistAnalyticsApi = {
  getTopWishlistedProducts: (period: WishlistPeriod = '30d') =>
    http.get<SuccessResponse<TopWishlistedProductsResponse>>(
      'admin/wishlist/analytics/top-products',
      { params: { period } },
    ),

  getWishlistConversion: () =>
    http.get<SuccessResponse<WishlistConversionResponse>>('admin/wishlist/analytics/conversion'),

  getWishlistTrends: (period: WishlistPeriod = '30d') =>
    http.get<SuccessResponse<WishlistTrendsResponse>>('admin/wishlist/analytics/trends', {
      params: { period },
    }),
}

export default wishlistAnalyticsApi
