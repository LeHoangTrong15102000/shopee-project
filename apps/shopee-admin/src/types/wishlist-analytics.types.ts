export type WishlistPeriod = '7d' | '30d' | '90d' | 'all'

export interface TopWishlistedProduct {
  product_id: string
  name: string
  image: string
  price: number
  quantity: number
  sold: number
  wishlist_count: number
}

export interface WishlistConversionItem {
  product_id: string
  name: string
  image: string
  price: number
  wishlist_count: number
  purchase_count: number
  conversion_rate: number
}

export interface WishlistTrendPoint {
  date: string
  count: number
}

export interface WishlistAnalyticsOverview {
  total_wishlisted: number
  unique_products: number
  avg_conversion_rate: number
}

export interface TopWishlistedProductsResponse {
  products: TopWishlistedProduct[]
  total: number
  period: WishlistPeriod
}

export interface WishlistConversionResponse {
  items: WishlistConversionItem[]
}

export interface WishlistTrendsResponse {
  trends: WishlistTrendPoint[]
  period: WishlistPeriod
}
